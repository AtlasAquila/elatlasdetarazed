/**
 * Redacción con IA de las partes de la guía «Plutón directo en Acuario» que dependen del cruce entre
 * la casa, los planetas y los contactos de cada persona: el hilo, la marea en su casa y los contactos.
 *
 * Los datos los calcula lib/pluton-guia.ts; la IA solo redacta con ellos. Cada texto se valida (grados,
 * fechas, casas y años deben figurar en los datos) y, si no pasa, se reintenta una vez y después se usa el
 * texto determinista de lib/pluton-guia.ts. La guía sale siempre, con o sin IA.
 */

import { AiError, MODELS, aiConfigured, complete } from "@/lib/ai/anthropic";
import { VOICE } from "@/lib/ai/prompts";
import { ROMAN, SIGN_NAMES } from "@/lib/engine/labels";
import { contactoMasExacto, distanciaAEstacion, grados, materialCasas, materialPuntos, nombreNatal, plutonFactsText, posicion, type PlutonBase, type RedaccionIA } from "@/lib/pluton-guia";
import { distanciaAlRecorrido } from "@/lib/pluton-evento";
import { PUNTOS_PLUTON } from "@/lib/pluton-guia-textos";

const MESES = "enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre";

// ─────────────────────────────────────────────────────────────
// Validación

type Reglas = {
  min: number;
  max: number;
  /** Textos que deben aparecer (p. ej. el nombre de cada contacto). */
  debeContener?: string[];
  /** Puntos natales: si el texto da su posición o su casa, deben ser estas. */
  puntos?: { nombre: string; pos: string; casa: string }[];
  /**
   * Distancias a la estación («0°07′», «3°28′»): cada una pertenece a un contacto. `todas` son las de los datos;
   * `propiasGlobal` las que se pueden citar fuera de los párrafos de contacto; `porParrafo` las de cada contacto,
   * por el comienzo de su párrafo. Una distancia ajena no puede aparecer en el párrafo de otro contacto.
   */
  distancias?: { todas: string[]; propiasGlobal: string[]; porParrafo?: { inicio: string; propias: string[] }[] };
  /** Puntos natales (sin «natal», p. ej. «Venus») que están dentro del recorrido de la marea (3°04′ a 7°11′ de Acuario). */
  recorrido?: { dentro: string[] };
};

const NOMBRES_CONOCIDOS = [...SIGN_NAMES, "Mercurio", "Venus", "Marte", "Júpiter", "Saturno", "Urano", "Neptuno", "Plutón", "Quirón", "Ascendente"];
/** Palabras corrientes que se parecen a un nombre propio y no lo son. */
const NO_ES_ERROR = new Set(["Libre", "Parte", "Martes"]);
const sinTildes = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function distanciaEdicion(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return d[a.length][b.length];
}

/** Un signo, planeta o punto escrito casi bien («Acuano», «Cancer», «Pluton»): devuelve el aviso, o null. */
function nombreMalEscrito(texto: string): string | null {
  for (const m of texto.matchAll(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñü]{4,}\b/g)) {
    const w = m[0];
    if (NOMBRES_CONOCIDOS.includes(w) || NO_ES_ERROR.has(w)) continue;
    for (const k of NOMBRES_CONOCIDOS) {
      const a = sinTildes(w);
      const b = sinTildes(k);
      if (a.slice(0, 3) === b.slice(0, 3) && distanciaEdicion(a, b) <= (b.length >= 7 ? 2 : 1)) return `escribe «${w}» donde debería decir «${k}»`;
    }
  }
  return null;
}

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const palabras = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

/** Devuelve el motivo del rechazo, o null si el texto vale. `permitido` es todo lo que la IA tenía delante. */
export function validarTexto(texto: string, permitido: string, reglas: Reglas): string | null {
  const t = texto.trim();
  const n = palabras(t);
  if (n < reglas.min) return `es demasiado corto (${n} palabras; mínimo ${reglas.min})`;
  if (n > reglas.max) return `es demasiado largo (${n} palabras; máximo ${reglas.max})`;
  if (!/[.?»)*]$/.test(t)) return "termina a medias";
  if (/!|¡/.test(t)) return "lleva signos de exclamación";
  if (/\p{Extended_Pictographic}/u.test(t)) return "lleva emojis";
  if (/^#{1,6}\s/m.test(t) || /\|\s*---/.test(t)) return "lleva títulos o tablas";

  // Grados con minutos: deben figurar tal cual en los datos.
  for (const m of t.matchAll(/\d{1,2}°\d{2}′/g)) if (!permitido.includes(m[0])) return `menciona el grado ${m[0]}, que no está en los datos`;
  // Grados sueltos («17°»): deben ser el comienzo de algún grado de los datos.
  for (const m of t.matchAll(/\b(\d{1,2})°(?!\d)/g)) if (!new RegExp(`\\b${m[1]}°`).test(permitido)) return `menciona ${m[0]}, que no está en los datos`;

  // Fechas: día y mes deben figurar en los datos; si lleva año, también.
  const fechasPermitidas = [...permitido.matchAll(new RegExp(`(\\d{1,2}) de (${MESES})(?: de (\\d{4}))?`, "g"))].map((m) => ({ d: m[1], mes: m[2], y: m[3] }));
  for (const m of t.matchAll(new RegExp(`(\\d{1,2}) de (${MESES})(?: de (\\d{4}))?`, "g"))) {
    const ok = fechasPermitidas.some((f) => f.d === m[1] && f.mes === m[2] && (!m[3] || !f.y || f.y === m[3]));
    if (!ok) return `menciona la fecha «${m[0]}», que no está en los datos`;
  }
  // Minutos sueltos («7′»): deben figurar en los datos.
  for (const m of t.matchAll(/(?<![°\d])(\d{1,2})′/g)) if (!new RegExp(String.raw`(?<![°\d])${m[1]}′`).test(permitido)) return `menciona ${m[0]}, que no está en los datos`;
  // Años: solo los de los datos.
  for (const m of t.matchAll(/\b(20\d{2})\b/g)) if (!permitido.includes(m[1])) return `menciona el año ${m[1]}, que no está en los datos`;

  // Casas: las que se citan deben figurar en los datos.
  const casasPermitidas = new Set([...permitido.matchAll(/\bcasas? ([IVX]+)\b/g)].map((m) => m[1]));
  for (const m of t.matchAll(/\bcasas? ([IVX]+(?:(?:, | y | e )[IVX]+)*)\b/g)) {
    for (const r of m[1].split(/, | y | e /)) if (!casasPermitidas.has(r)) return `menciona la casa ${r}, que no está en los datos`;
  }
  // Posición y casa de cada punto natal: deben coincidir con las de la carta.
  for (const p of reglas.puntos ?? []) {
    const nombre = String.raw`\b${escapar(p.nombre)}\b`;
    for (const m of t.matchAll(new RegExp(String.raw`${nombre}[^.\d]{0,12}?(\d{1,2}°\d{2}′ de [A-Za-zÁ-ú]+)`, "g"))) {
      if (m[1] !== p.pos) return `da a ${p.nombre} la posición ${m[1]}, y es ${p.pos}`;
    }
    for (const m of t.matchAll(new RegExp(String.raw`${nombre}[^.]{0,40}?\(casa ([IVX]+)\)`, "g"))) {
      if (m[1] !== p.casa) return `pone ${p.nombre} en la casa ${m[1]}, y está en la ${p.casa}`;
    }
  }

  // Nombres de signos y planetas bien escritos.
  const mal = nombreMalEscrito(t);
  if (mal) return mal;

  // «Dentro del recorrido» / «fuera del recorrido»: solo los puntos que de verdad lo están o no.
  if (reglas.recorrido) {
    const cuerpos = ["Sol", "Luna", "Mercurio", "Venus", "Marte", "Júpiter", "Saturno", "Urano", "Neptuno", "Quirón"];
    for (const frase of t.split(/(?<=[.?!])\s+/)) {
      const citados = cuerpos.filter((n) => new RegExp(String.raw`\b${n}\b`).test(frase));
      if (/dentro del (recorrido|tramo)/i.test(frase)) {
        const intruso = citados.find((n) => !reglas.recorrido!.dentro.includes(n));
        if (intruso) return `dice que ${intruso} está dentro del recorrido de la marea, y no lo está`;
      }
      if (/fuera del (recorrido|tramo)/i.test(frase)) {
        const intruso = citados.find((n) => reglas.recorrido!.dentro.includes(n));
        if (intruso) return `dice que ${intruso} está fuera del recorrido de la marea, y está dentro`;
      }
    }
  }

  // Distancias a la estación: cada una, solo en el párrafo de su contacto.
  if (reglas.distancias) {
    const posiciones = new Set([...permitido.matchAll(/(\d{1,2}°\d{2}′)(?= de [A-ZÁ-Ú])/g)].map((m) => m[1]));
    const ajenas = new Set(reglas.distancias.todas.filter((d) => !posiciones.has(d)));
    const parrafos = reglas.distancias.porParrafo ? t.split(/\n{2,}/) : [t];
    for (const par of parrafos) {
      const propias = reglas.distancias.porParrafo
        ? (reglas.distancias.porParrafo.find((x) => par.trim().startsWith(x.inicio))?.propias ?? reglas.distancias.propiasGlobal)
        : reglas.distancias.propiasGlobal;
      for (const m of par.matchAll(/\d{1,2}°\d{2}′/g)) {
        if (ajenas.has(m[0]) && !propias.includes(m[0])) return `atribuye la distancia ${m[0]}, que corresponde a otro contacto, a un texto donde no va`;
      }
    }
  }

  for (const s of reglas.debeContener ?? []) if (!t.includes(s)) return `no menciona «${s}»`;
  return null;
}

// ─────────────────────────────────────────────────────────────
// Prompts

const EJEMPLO_HILO =
  "Plutón se detiene en tu casa IX, la de las creencias y el sentido, y lo hace a solo 0°07′ de tu Venus natal, que vive en esa misma casa. Esta marea te pregunta por qué crees lo que crees y desde dónde quieres: cuánto de tus ideas y de tus vínculos lo sostienes por elección y cuánto por seguir perteneciendo. Mira qué has dejado de decir en voz alta.";

const EJEMPLO_CONTACTO =
  "**Venus natal, 3°11′ de Acuario (casa IX).** Plutón pasa por encima de ese grado dos veces: hacia el 23 de septiembre de 2026, retrocediendo, y hacia el 7 de noviembre de 2026, avanzando. Entre una y otra se detiene a solo 0°07′, así que es el contacto más exacto de tu carta con esta estación. Tu Venus en Acuario ama desde la amistad y la libertad mutua; Plutón pregunta dónde esa libertad es real y dónde es un modo de no implicarte, y quién manda de verdad en tus vínculos y en tus círculos. Al caer en la casa IX, la pregunta se amplía a lo que crees sobre el amor: cuánto de lo que piensas que es querer lo has elegido tú. La conjunción es el contacto más intenso, y este año lo vives dos veces, primero hacia dentro y después hacia la decisión.";

export function sistemaGuia(base: PlutonBase): string {
  return `${VOICE}

TAREA
Escribes secciones de una guía personal y gratuita, para una persona que ha pedido saber cómo afecta a su carta natal la estación directa de Plutón en Acuario (16 de octubre de 2026). En cada petición redactas SOLO la sección que se te pide, con el registro de la web: sereno, literario, cercano; de tú; sin emojis ni exclamaciones; sin títulos ni tablas (el título de la sección lo pone la web).

MÉTODO
- Metáfora de la marea: Plutón retrógrado (del 6 de mayo al 16 de octubre de 2026) es la marea baja, que deja a la vista lo que estaba bajo el agua; Plutón directo (del 16 de octubre de 2026 al 8 de mayo de 2027) es la marea alta, que pide decisión. Es la metáfora de la guía, no tradición astrológica; úsala con naturalidad.
- Plutón habla de poder, control y transformación; Acuario, de lo colectivo, los ideales y la libertad. El hilo de la guía es la pertenencia: cuánto de lo que somos se elige y cuánto se entrega para encajar.
- Síntesis, no inventario: relaciona la casa de la estación, los planetas natales de esa casa y los contactos entre sí (misma casa, mismo signo, mismo grado).
- Vida cotidiana: da situaciones concretas como posibilidades («es probable», «puede»), nunca como hechos ni predicciones.
- Dato, tradición, interpretación: distínguelos con naturalidad.
- Usa EXCLUSIVAMENTE los grados, las casas, los signos y las fechas de DATOS DE ESTA PERSONA. Escríbelos tal cual figuran (3°11′ de Acuario, 7 de noviembre de 2026, casa IX). No calcules ni añadas otros. No menciones años que no estén en los datos.
- Sin consejo médico, psicológico, legal ni financiero.
- Una ceñida estructura de párrafos separados por una línea en blanco; **negrita** solo donde se indique.

DATOS DE ESTA PERSONA
${plutonFactsText(base)}

MATERIAL BASE (escrito por el autor de la web: apóyate en él con tus palabras, sin copiarlo)
${materialCasas(base)}

${materialPuntos(base)}

EJEMPLO DE ESTILO (de otra persona: NO copies sus datos, sus fechas ni sus frases)
Hilo: ${EJEMPLO_HILO}

Contacto: ${EJEMPLO_CONTACTO}`;
}

const INSTRUCCION_HILO =
  "Escribe «Lo esencial para ti»: UN solo párrafo de 80 a 130 palabras. Cuenta el hilo de esta marea en SU carta: empieza por la casa donde se detiene Plutón y únela, en una sola idea, con el contacto más importante de la lista (o con los planetas natales de esa casa si no hay contactos). Si hay un contacto a menos de 1° de la estación (los datos lo señalan), ese es el centro del párrafo: di la distancia tal como figura en los datos. Cierra con una frase sobre qué mirar. Sin título ni listas.";

const INSTRUCCION_MAREA =
  "Escribe «Dónde se mueve la marea en tu carta»: de 2 a 4 párrafos, de 170 a 260 palabras en total. Primero di por qué casas pasa Plutón en la marea baja y en la marea alta (si es una sola, dilo: no cambia de terreno). Después cuenta qué puede haber mostrado la marea baja (mayo a octubre) y qué pide la marea alta (octubre a mayo) en ese terreno, partiendo del MATERIAL BASE pero con tus palabras y ligado a los planetas natales que estén en esas casas, con su grado y su signo, si los hay: nombra primero los que Plutón atraviesa y di cómo lo que representan (su signo y su función) cambia la lectura de la casa; los que quedan fuera del recorrido, como telón de fondo. Los puntos «dentro del recorrido» son EXACTAMENTE los de la lista de los datos: no digas que otro lo está, y no escribas los nombres de signos ni de planetas con faltas. No repitas el aviso de precisión de la cúspide: va en otra sección. Sin títulos ni listas.";

function instruccionContactos(base: PlutonBase) {
  const lista = base.contactos.slice(0, 4).map((c, i) => `${i + 1}. ${nombreNatal(c.cuerpo)}`);
  return `Escribe «Lo que toca tu carta»: un párrafo por cada uno de estos contactos, en este orden, de 70 a 130 palabras cada uno:
${lista.join("\n")}
Cada párrafo empieza con el nombre en negrita, la posición y la casa, como en el ejemplo: **Venus natal, 3°11′ de Acuario (casa IX).** Después: qué contacto es (si Plutón pasa por su grado, di las fechas exactas con la dirección, avanzando o retrocediendo; si es cercano, di claramente que no es exacto), qué se toca de ese punto (MATERIAL BASE) y cómo se lee en SU signo y SU casa, relacionándolo con la casa de la estación y con los otros contactos cuando se conecten. Incluye la frase que une el punto con su signo y con su casa (cómo se vive ese punto en ese signo y qué cambia al caer en esa casa), como en el ejemplo, desarrollando con tus palabras la idea del MATERIAL BASE. Si a un contacto lo señalan los datos como el más exacto con la estación, di la distancia tal como figura. Termina cada párrafo con una posibilidad concreta de la vida cotidiana o una pregunta, y varía los cierres y las expresiones entre contactos: no repitas la misma frase ni la misma descripción genérica del aspecto en más de un párrafo. Sin listas ni títulos.`;
}

// ─────────────────────────────────────────────────────────────
// Llamadas

const TIEMPO_MAXIMO = 110_000;

async function pedir(sistema: string, instruccion: string, maxTokens: number, permitido: string, reglas: Reglas, errores: string[], etiqueta: string): Promise<string | undefined> {
  let aviso = "";
  for (let intento = 1; intento <= 2; intento++) {
    try {
      const texto = await Promise.race([
        complete({ model: MODELS.main, system: sistema, messages: [{ role: "user", content: instruccion + aviso }], maxTokens }),
        new Promise<never>((_, rechazar) => setTimeout(() => rechazar(new Error("tiempo agotado")), TIEMPO_MAXIMO)),
      ]);
      const motivo = validarTexto(texto, permitido, reglas);
      if (!motivo) return texto.trim();
      errores.push(`${etiqueta} (intento ${intento}): ${motivo}`);
      aviso = `\n\nTu respuesta anterior se ha rechazado porque ${motivo}. Corrígelo y escribe de nuevo la sección completa, usando solo los datos que se te dan.`;
    } catch (e) {
      errores.push(`${etiqueta} (intento ${intento}): ${e instanceof AiError ? `error ${e.status}` : e instanceof Error ? e.message : "error"}`);
      if (e instanceof AiError && (e.status === 401 || e.status === 403)) return undefined;
    }
  }
  return undefined;
}

export type ResultadoIA = { redaccion: RedaccionIA; errores: string[] };

/** Pide a la IA las tres secciones en paralelo. Las que no salgan o no pasen la validación quedan sin definir. */
export async function redactarConIA(base: PlutonBase): Promise<ResultadoIA> {
  const errores: string[] = [];
  if (!aiConfigured()) return { redaccion: {}, errores: ["la IA no está configurada"] };

  const sistema = sistemaGuia(base);
  // Todo lo que la IA tenía delante: los datos y el material (los grados, fechas y casas que contienen son los permitidos).
  const permitido = `${plutonFactsText(base)}\n${materialCasas(base)}`;
  const nombres = base.contactos.slice(0, 4).map((c) => nombreNatal(c.cuerpo));
  const puntos = base.naturales.map((p) => ({ nombre: PUNTOS_PLUTON[p.id].nombre, pos: posicion(p.lon), casa: ROMAN[p.casa - 1] }));
  // Distancia de cada contacto a la estación: «cruce» → al punto de la estación; «cerca» → a su grado exacto.
  const propiasDe = (c: (typeof base.contactos)[number]) => {
    if (c.tipo === "cerca") return [grados(c.distancia)];
    const d = distanciaAEstacion(c);
    return d < 0.001 ? [] : [grados(d)];
  };
  const exacto = contactoMasExacto(base.contactos);
  const distancias = {
    todas: base.contactos.flatMap(propiasDe),
    propiasGlobal: exacto ? propiasDe(exacto) : [],
    porParrafo: base.contactos.map((c) => ({ inicio: `**${nombreNatal(c.cuerpo)}`, propias: propiasDe(c) })),
  };
  const distanciasGlobales = { todas: distancias.todas, propiasGlobal: distancias.propiasGlobal };
  const recorrido = {
    dentro: base.naturales.filter((p) => p.id !== "asc" && p.id !== "mc" && p.id !== "pluto" && distanciaAlRecorrido(p.lon) === 0).map((p) => PUNTOS_PLUTON[p.id].nombre),
  };

  const [hilo, marea, contactos] = await Promise.all([
    pedir(sistema, INSTRUCCION_HILO, 700, permitido, { min: 60, max: 170, puntos, distancias: distanciasGlobales, recorrido }, errores, "hilo"),
    pedir(sistema, INSTRUCCION_MAREA, 1100, permitido, { min: 130, max: 340, puntos, distancias: distanciasGlobales, recorrido }, errores, "marea"),
    base.contactos.length
      ? pedir(sistema, instruccionContactos(base), 2200, permitido, { min: 60 * nombres.length, max: 170 * nombres.length, debeContener: nombres, puntos, distancias, recorrido }, errores, "contactos")
      : Promise.resolve(undefined),
  ]);
  return { redaccion: { hilo, marea, contactos }, errores };
}
