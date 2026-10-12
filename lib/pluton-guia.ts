/**
 * Guía personal de la campaña «Plutón directo en Acuario»: se construye con la carta natal de quien la pide.
 * Todo lo que es dato (casas, contactos, fechas de los cruces) se calcula aquí; la parte que necesita
 * redacción (el hilo, la marea en su casa, los contactos) la puede escribir la IA en lib/pluton-guia-ia.ts
 * a partir de estos mismos datos, y si falla se usa el texto determinista de este archivo.
 * Textos: lib/pluton-guia-textos.ts.
 */

import { angleDiff, houseOf, norm360 } from "@/lib/engine";
import { ROMAN, SIGN_NAMES } from "@/lib/engine/labels";
import type { BodyId, Chart } from "@/lib/engine/types";
import {
  distanciaAlRecorrido,
  ENTRADA_ACUARIO,
  ESTACIONES,
  cruces,
  fechaLarga,
  SALIDA_ACUARIO,
  type Cruce,
} from "@/lib/pluton-evento";
import {
  ASPECTOS_PLUTON,
  CALENDARIO,
  CASAS_PLUTON,
  FASES,
  FUNCION,
  INTRO_CIELO,
  MATIZ_CERCA,
  PUNTOS_PLUTON,
  SIGNO_MODO,
  SIN_CONTACTOS,
  TEXTO_CIERRE,
  type AspectoPluton,
} from "@/lib/pluton-guia-textos";

export type GuideSection = { titulo: string; texto: string };

export type PlutonGuide = {
  nombre: string;
  /** 0 = Aries … 11 = Piscis */
  ascendente: number;
  /** Casa (1-12) donde Plutón se detiene a 3°04′ de Acuario. */
  casa: number;
  /** Si el sistema Placidus no se pudo aplicar en esa latitud. */
  aproximada: boolean;
  /** Cuántas secciones ha escrito la IA (0 si todo es texto determinista). */
  seccionesIA: number;
  secciones: GuideSection[];
  cta: { texto: string; boton: string; ruta: string };
};

const SIGN_LON = (lon: number) => Math.floor(norm360(lon) / 30);

/** 12.5 → «12°30′» */
export function grados(deg: number) {
  const t = Math.round(deg * 60);
  return `${Math.floor(t / 60)}°${String(t % 60).padStart(2, "0")}′`;
}
/** 303.1833 → «3°11′ de Acuario» */
export const posicion = (lon: number) => `${grados(norm360(lon) % 30)} de ${SIGN_NAMES[SIGN_LON(lon)]}`;

const lista = (items: string[]) => (items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`);

// ─────────────────────────────────────────────────────────────
// Cálculo

type PuntoNatal = { id: string; lon: number; casa: number };

const CUERPOS: BodyId[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "chiron"];

const ASPECTOS: { clave: AspectoPluton; angulo: number; peso: number }[] = [
  { clave: "conjuncion", angulo: 0, peso: 3 },
  { clave: "oposicion", angulo: 180, peso: 2.5 },
  { clave: "cuadratura", angulo: 90, peso: 2.5 },
  { clave: "trigono", angulo: 120, peso: 1.5 },
  { clave: "sextil", angulo: 60, peso: 1.5 },
];

const PESO_PUNTO: Record<string, number> = { sun: 3, moon: 3, asc: 3, mc: 3, venus: 3, mars: 3, mercury: 3, jupiter: 2, saturn: 2, uranus: 2, neptune: 2, pluto: 2, chiron: 2 };

/** Un contacto de Plutón, durante esta marea, con un punto de la carta natal. */
export type ContactoPluton = {
  cuerpo: string;
  natal: number;
  casa: number;
  aspecto: AspectoPluton;
  /** «cruce»: Plutón pasa exactamente por el grado del aspecto; «cerca»: se queda a menos de 2° (conjunción, cuadratura u oposición). */
  tipo: "cruce" | "cerca";
  /** Longitud que debe alcanzar Plutón para que el aspecto sea exacto. */
  objetivo: number;
  /** Distancia (°) entre ese grado y el recorrido de la marea; 0 si lo cruza. */
  distancia: number;
  cruces: Cruce[];
  peso: number;
};

export function puntosNatales(chart: Chart): PuntoNatal[] {
  if (!chart.angles || !chart.houses) throw new Error("La guía necesita ascendente y casas.");
  const { cusps } = chart.houses;
  const out: PuntoNatal[] = [];
  for (const id of CUERPOS) {
    const b = chart.bodies.find((x) => x.id === id);
    if (b && Number.isFinite(b.longitude)) out.push({ id, lon: b.longitude, casa: houseOf(b.longitude, cusps) });
  }
  out.push({ id: "asc", lon: chart.angles.asc, casa: houseOf(chart.angles.asc, cusps) });
  out.push({ id: "mc", lon: chart.angles.mc, casa: houseOf(chart.angles.mc, cusps) });
  return out;
}

/** Contactos de Plutón con la carta natal, del más pesado al menos pesado (máximo 5). */
export function contactosPluton(chart: Chart): ContactoPluton[] {
  const found: ContactoPluton[] = [];
  for (const p of puntosNatales(chart)) {
    for (const a of ASPECTOS) {
      const objetivos = a.angulo === 0 || a.angulo === 180 ? [norm360(p.lon + a.angulo)] : [norm360(p.lon + a.angulo), norm360(p.lon - a.angulo)];
      for (const objetivo of objetivos) {
        const distancia = distanciaAlRecorrido(objetivo);
        const dura = a.clave === "conjuncion" || a.clave === "cuadratura" || a.clave === "oposicion";
        if (distancia === 0) {
          found.push({ cuerpo: p.id, natal: p.lon, casa: p.casa, aspecto: a.clave, tipo: "cruce", objetivo, distancia, cruces: cruces(objetivo), peso: (PESO_PUNTO[p.id] ?? 1) * a.peso });
        } else if (dura && distancia <= 2) {
          found.push({ cuerpo: p.id, natal: p.lon, casa: p.casa, aspecto: a.clave, tipo: "cerca", objetivo, distancia, cruces: [], peso: ((PESO_PUNTO[p.id] ?? 1) * a.peso) / 2 });
        }
      }
    }
  }
  return found.sort((x, y) => y.peso - x.peso || x.distancia - y.distancia).slice(0, 5);
}

/** Casas que recorre un tramo de longitud en el orden en que se atraviesan (admite tramos que retroceden). */
export function casasEntre(desde: number, hasta: number, cusps: number[]) {
  const casas: number[] = [];
  const pasos = 96;
  for (let i = 0; i <= pasos; i++) {
    const h = houseOf(desde + ((hasta - desde) * i) / pasos, cusps);
    if (casas[casas.length - 1] !== h) casas.push(h);
  }
  return casas;
}

export type Cercania = { casaVecina: number; distancia: number; lado: "empieza" | "termina"; cuspide: number };

/** Si el punto está a menos de 1° de una cúspide de su casa, la otra casa también cuenta. */
export function cercaDeCuspide(lon: number, casa: number, cusps: number[]): Cercania | null {
  const inicio = cusps[casa - 1];
  const fin = cusps[casa % 12];
  const dIni = norm360(lon - inicio);
  const dFin = norm360(fin - lon);
  if (dIni < 1 && dIni <= dFin) return { casaVecina: casa === 1 ? 12 : casa - 1, distancia: dIni, lado: "empieza", cuspide: inicio };
  if (dFin < 1) return { casaVecina: (casa % 12) + 1, distancia: dFin, lado: "termina", cuspide: fin };
  return null;
}

/** Todo lo calculado sobre una carta para esta guía. */
export type PlutonBase = {
  chart: Chart;
  nombre: string;
  ascendente: number;
  casa: number;
  aproximada: boolean;
  cusps: number[];
  cercania: Cercania | null;
  casasBaja: number[];
  casasAlta: number[];
  casasSiguiente: number[];
  naturales: PuntoNatal[];
  contactos: ContactoPluton[];
};

export function calcularBase(chart: Chart, nombre: string): PlutonBase {
  if (!chart.angles || !chart.houses) throw new Error("La guía necesita ascendente y casas.");
  const { cusps } = chart.houses;
  const casa = houseOf(ESTACIONES.directo.lon, cusps);
  return {
    chart,
    nombre,
    ascendente: SIGN_LON(chart.angles.asc),
    casa,
    aproximada: chart.houses.systemUsed !== "placidus",
    cusps,
    cercania: cercaDeCuspide(ESTACIONES.directo.lon, casa, cusps),
    casasBaja: casasEntre(ESTACIONES.retroceso.lon, ESTACIONES.directo.lon, cusps),
    casasAlta: casasEntre(ESTACIONES.directo.lon, ESTACIONES.retroceso2.lon, cusps),
    casasSiguiente: casasEntre(ESTACIONES.retroceso2.lon, ESTACIONES.directo2.lon, cusps),
    naturales: puntosNatales(chart),
    contactos: contactosPluton(chart),
  };
}

// ─────────────────────────────────────────────────────────────
// Descripciones deterministas

const sentidoTexto = (c: Cruce) => (c.sentido === "directo" ? "avanzando" : "retrocediendo");

/** «hacia el 6 de octubre de 2026 (retrocediendo) y hacia el 7 de noviembre de 2026 (avanzando)» */
export function textoCruces(cs: Cruce[]) {
  return lista(cs.map((c) => `hacia el ${fechaLarga(c.fecha)} (${sentidoTexto(c)})`));
}

const nombreDe = (id: string) => PUNTOS_PLUTON[id]?.nombre ?? id;
/** «Venus natal» · «Plutón natal» · «Ascendente» · «Medio Cielo» */
export const nombreNatal = (id: string) => (id === "asc" || id === "mc" || id === "pluto" ? nombreDe(id) : `${nombreDe(id)} natal`);

/** Distancia (°) entre el grado exacto de un contacto y el punto de la estación (3°04′ de Acuario). */
export function distanciaAEstacion(c: ContactoPluton) {
  return Math.abs(angleDiff(c.objetivo, ESTACIONES.directo.lon));
}

/** El contacto cuyo grado exacto está a menos de 1° del punto de la estación, el más cercano; null si no hay ninguno. */
export function contactoMasExacto(contactos: ContactoPluton[]): ContactoPluton | null {
  const cercanos = contactos.filter((c) => c.tipo === "cruce" && distanciaAEstacion(c) < 1).sort((a, b) => distanciaAEstacion(a) - distanciaAEstacion(b));
  return cercanos[0] ?? null;
}

/** «Tu Venus en Acuario se vive desde la amistad… Al estar en tu casa IX, esa manera se mezcla con las creencias…» */
function lecturaSigno(c: ContactoPluton) {
  const signo = SIGN_LON(c.natal);
  return (
    `Tu ${nombreDe(c.cuerpo)} en ${SIGN_NAMES[signo]} se vive ${SIGNO_MODO[signo]}. ` +
    `Al estar en tu casa ${ROMAN[c.casa - 1]}, esa manera se mezcla con ${CASAS_PLUTON[c.casa - 1].tema}.`
  );
}

type ContextoContactos = { aspectosVistos: Set<string>; masExacto: ContactoPluton | null };

/** Sale del aspecto exacto: p. ej. un sextil al Plutón natal en 6°22′ de Sagitario se hace exacto cuando Plutón pasa por 6°22′ de Acuario. */
function descripcionContacto(c: ContactoPluton, ctx: ContextoContactos) {
  const p = PUNTOS_PLUTON[c.cuerpo];
  const asp = ASPECTOS_PLUTON[c.aspecto];
  const cabecera = `**${nombreNatal(c.cuerpo)}, ${posicion(c.natal)} (casa ${ROMAN[c.casa - 1]}).**`;
  // La descripción genérica del aspecto sale una sola vez por tipo, para que los contactos no repitan la misma frase.
  const clave = c.tipo === "cerca" ? "cerca" : c.aspecto;
  const matiz = ctx.aspectosVistos.has(clave) ? "" : ` ${c.tipo === "cerca" ? MATIZ_CERCA : asp.matiz}`;
  ctx.aspectosVistos.add(clave);

  if (c.tipo === "cruce") {
    const grado = posicion(c.objetivo);
    const paso =
      c.aspecto === "conjuncion"
        ? `Plutón pasa por encima de ese grado, ${textoCruces(c.cruces)}.`
        : `Plutón forma ${asp.nombre} con este punto cuando pasa por ${grado}, ${textoCruces(c.cruces)}.`;
    const d = distanciaAEstacion(c);
    const estacion =
      d < 1
        ? ` Plutón se detiene a solo ${grados(d)} de ${c.aspecto === "conjuncion" ? "ese grado" : "ese punto del aspecto"}${ctx.masExacto === c ? ": es el contacto más exacto de tu carta con esta estación" : ""}.`
        : "";
    return `${cabecera} ${paso}${estacion} ${lecturaSigno(c)} ${p.texto}${matiz}`;
  }
  const dist = grados(c.distancia);
  return `${cabecera} Plutón se queda a ${dist} del grado donde ${c.aspecto === "conjuncion" ? "caería exactamente sobre este punto" : `formaría ${asp.nombre} con él`} (${posicion(c.objetivo)}). ${lecturaSigno(c)} ${p.texto}${matiz}`;
}

// ─────────────────────────────────────────────────────────────
// Secciones

export type RedaccionIA = { hilo?: string; marea?: string; contactos?: string };

function seccionPunto(base: PlutonBase): GuideSection {
  const { chart, ascendente, aproximada } = base;
  return {
    titulo: `Tu punto de partida: ascendente ${SIGN_NAMES[ascendente]}`,
    texto:
      `Tu ascendente es ${SIGN_NAMES[ascendente]} (a ${grados(norm360(chart.angles!.asc) % 30)}). Desde ahí se reparten tus casas, y las casas dicen en qué terreno de tu vida cae cada parte del cielo.` +
      ` La hora y el lugar de nacimiento que diste las fijan; con una hora aproximada, las casas pueden desplazarse una.` +
      (aproximada ? "\n\n*En la latitud de tu lugar de nacimiento las casas Placidus no se pueden calcular con exactitud, así que las casas de esta guía son aproximadas.*" : ""),
  };
}

function avisoCuspide(base: PlutonBase): string {
  const { cercania, casa } = base;
  if (!cercania) return "";
  const dist = grados(cercania.distancia);
  const cuspide = posicion(cercania.cuspide);
  const vecina = CASAS_PLUTON[cercania.casaVecina - 1].tema;
  return (
    `\n\n*Aviso de precisión: tu casa ${ROMAN[casa - 1]} ${cercania.lado} a ${cuspide}, solo a ${dist} del punto donde Plutón se detiene. ` +
    `Si tu hora de nacimiento no es exacta, ese punto podría quedar en tu casa ${ROMAN[cercania.casaVecina - 1]} (${vecina}) en lugar de en la ${ROMAN[casa - 1]}. ` +
    `Comprueba tu hora antes de quedarte con una sola lectura.*`
  );
}

function seccionCasa(base: PlutonBase): GuideSection {
  const c = CASAS_PLUTON[base.casa - 1];
  return {
    titulo: `Plutón cae en tu casa ${ROMAN[base.casa - 1]}`,
    texto:
      `Los 3°04′ de Acuario, donde Plutón cambia de sentido, caen en tu casa ${ROMAN[base.casa - 1]}, la de ${c.tema}.\n\n${c.aqui}` +
      avisoCuspide(base) +
      `\n\nDos preguntas para llevarte:\n\n- *${c.preguntas[0]}*\n- *${c.preguntas[1]}*`,
  };
}

/** «Tus planetas en esa casa»: qué puntos de la carta viven en las casas de la marea y cuáles atraviesa Plutón. */
function planetasEnLaMarea(base: PlutonBase): string {
  const casasMarea = new Set([...base.casasBaja, ...base.casasAlta]);
  const enCasa = base.naturales.filter((p) => p.id !== "asc" && p.id !== "mc" && casasMarea.has(p.casa));
  if (!enCasa.length) return "";
  const nombrePropio = (id: string) => `tu ${nombreDe(id)}`;
  const mayus = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
  const viven = [...casasMarea]
    .sort((a, b) => a - b)
    .map((h) => ({ h, ps: enCasa.filter((p) => p.casa === h) }))
    .filter((x) => x.ps.length)
    .map((x) => `En tu casa ${ROMAN[x.h - 1]} ${x.ps.length === 1 ? "vive" : "viven"} ${lista(x.ps.map((p) => `${nombrePropio(p.id)} (${posicion(p.lon)})`))}.`);
  const dentro = enCasa.filter((p) => distanciaAlRecorrido(p.lon) === 0);
  const fuera = enCasa.filter((p) => distanciaAlRecorrido(p.lon) !== 0);
  const partes = [`**Tus planetas en ${casasMarea.size === 1 ? "esa casa" : "esas casas"}.** ${viven.join(" ")}`];
  if (dentro.length) {
    partes.push(
      `Plutón pasa por encima de ${lista(dentro.map((p) => nombrePropio(p.id)))} durante esta marea, así que lo que ${dentro.length === 1 ? "representa" : "representan"} (${dentro.map((p) => FUNCION[p.id]).join("; ")}) se mezcla con el tema de la casa: la marea se vive a través de ${dentro.length === 1 ? "ese punto" : "esos puntos"}.`,
    );
  }
  if (fuera.length) {
    partes.push(
      `${mayus(fuera.length === 1 ? `${nombrePropio(fuera[0].id)} comparte` : `${lista(fuera.map((p) => nombrePropio(p.id)))} comparten`)} casa con Plutón, pero ${fuera.length === 1 ? "queda" : "quedan"} fuera del recorrido de la marea: ${fuera.length === 1 ? "es" : "son"} telón de fondo, no un contacto directo.`,
    );
  }
  return partes.join(" ");
}

function seccionMareaDeterminista(base: PlutonBase): string {
  const todas = [...new Set([...base.casasBaja, ...base.casasAlta])];
  const planetas = planetasEnLaMarea(base);
  const cola = planetas ? `\n\n${planetas}` : "";
  if (todas.length === 1) {
    const c = CASAS_PLUTON[todas[0] - 1];
    return (
      `Toda la marea de este año, de los 5°31′ a los 3°04′ en el retrógrado y de los 3°04′ a los 7°11′ en el directo, cae dentro de tu casa ${ROMAN[todas[0] - 1]}. No cambias de terreno: Plutón trabaja en el mismo sitio durante todo el ciclo.\n\n` +
      `- **Mayo a octubre (marea baja).** ${c.baja}\n- **Octubre a mayo de 2027 (marea alta).** ${c.alta}` +
      cola
    );
  }
  const baja = base.casasBaja.map((h) => `- **Marea baja · casa ${ROMAN[h - 1]} (${CASAS_PLUTON[h - 1].tema}).** ${CASAS_PLUTON[h - 1].baja}`);
  const alta = base.casasAlta.map((h) => `- **Marea alta · casa ${ROMAN[h - 1]} (${CASAS_PLUTON[h - 1].tema}).** ${CASAS_PLUTON[h - 1].alta}`);
  return (
    `La marea de este año cruza más de una casa tuya: en el retrógrado, de los 5°31′ a los 3°04′, recorre ${lista(base.casasBaja.map((h) => `la casa ${ROMAN[h - 1]}`))}; ` +
    `en el directo, de los 3°04′ a los 7°11′, recorre ${lista(base.casasAlta.map((h) => `la casa ${ROMAN[h - 1]}`))}.\n\n` +
    [...baja, ...alta].join("\n") +
    cola
  );
}

function seccionContactosDeterminista(base: PlutonBase): string {
  if (!base.contactos.length) return SIN_CONTACTOS;
  const ctx: ContextoContactos = { aspectosVistos: new Set(), masExacto: contactoMasExacto(base.contactos) };
  return (
    "Estos son los puntos de tu carta que Plutón toca por grado durante esta marea, del contacto más importante al menos importante.\n\n" +
    base.contactos.map((c) => descripcionContacto(c, ctx)).join("\n\n")
  );
}

function hiloDeterminista(base: PlutonBase): string {
  const c = CASAS_PLUTON[base.casa - 1];
  const inicio = `Plutón cambia de sentido en tu casa ${ROMAN[base.casa - 1]}, la de ${c.tema}, y esta marea trabaja ahí.`;
  const exacto = contactoMasExacto(base.contactos);
  if (exacto) {
    const donde = exacto.casa === base.casa ? "que vive en esa misma casa" : `que está en tu casa ${ROMAN[exacto.casa - 1]}`;
    return `${inicio} Además, se detiene a solo ${grados(distanciaAEstacion(exacto))} de tu ${nombreNatal(exacto.cuerpo)} (${posicion(exacto.natal)}), ${donde}: es el contacto más exacto de tu carta con esta estación.`;
  }
  const primero = base.contactos[0];
  const toque = primero
    ? ` El contacto más importante de tu carta es con ${nombreNatal(primero.cuerpo)} (${posicion(primero.natal)}, casa ${ROMAN[primero.casa - 1]}).`
    : " Ningún punto de tu carta recibe un contacto exacto, así que lo vivirás sobre todo por esa casa.";
  return `${inicio}${toque}`;
}

function eventosFase(contactos: ContactoPluton[], fase: Cruce["fase"]) {
  return contactos
    .flatMap((c) => c.cruces.filter((x) => x.fase === fase).map((x) => ({ x, c })))
    .sort((a, b) => a.x.fecha.getTime() - b.x.fecha.getTime())
    .map(({ x, c }) => `- **Hacia el ${fechaLarga(x.fecha)}.** Plutón pasa, ${sentidoTexto(x)}, por ${posicion(c.objetivo)}: ${ASPECTOS_PLUTON[c.aspecto].frase} tu ${nombreNatal(c.cuerpo)} (${posicion(c.natal)}).`);
}

function seccionFases(base: PlutonBase): GuideSection {
  const casasTexto = (casas: number[]) => lista(casas.map((h) => ROMAN[h - 1]));
  const enTuCarta = (txt: string) => `\n\n**En tu carta:** ${txt}`;
  const bloque = (titulo: string, texto: string, extra: string, eventos: string[]) =>
    `### ${titulo}\n\n${texto}${extra}${eventos.length ? "\n\n" + eventos.join("\n") : ""}`;
  return {
    titulo: "El ciclo, fase a fase",
    texto: [
      bloque(
        FASES.baja.titulo,
        FASES.baja.texto,
        enTuCarta(`Plutón retrocede ${base.casasBaja.length === 1 ? "por tu casa" : "por tus casas"} ${casasTexto(base.casasBaja)}.`),
        eventosFase(base.contactos, "baja"),
      ),
      bloque(FASES.estacion.titulo, FASES.estacion.texto, enTuCarta(`se detiene en tu casa ${ROMAN[base.casa - 1]} (${CASAS_PLUTON[base.casa - 1].tema}).`), []),
      bloque(
        FASES.alta.titulo,
        FASES.alta.texto,
        enTuCarta(`Plutón avanza ${base.casasAlta.length === 1 ? "por tu casa" : "por tus casas"} ${casasTexto(base.casasAlta)}.`),
        eventosFase(base.contactos, "alta"),
      ),
      bloque(
        FASES.siguiente.titulo,
        FASES.siguiente.texto,
        enTuCarta(`Plutón vuelve a recorrer ${base.casasSiguiente.length === 1 ? "tu casa" : "tus casas"} ${casasTexto(base.casasSiguiente)}.`),
        eventosFase(base.contactos, "siguiente"),
      ),
    ].join("\n\n"),
  };
}

function seccionFechas(base: PlutonBase): GuideSection {
  const generales = CALENDARIO.map((f) => `- **${f.fecha}.** ${f.texto}`);
  const personales = base.contactos
    .flatMap((c) => c.cruces.map((x) => ({ x, c })))
    .sort((a, b) => a.x.fecha.getTime() - b.x.fecha.getTime())
    .map(({ x, c }) => `- **Hacia el ${fechaLarga(x.fecha)}.** Plutón pasa por tu ${nombreNatal(c.cuerpo)} (${posicion(c.natal)}${c.aspecto === "conjuncion" ? "" : `, ${ASPECTOS_PLUTON[c.aspecto].nombre}`}), ${sentidoTexto(x)}.`);
  return {
    titulo: "Fechas clave",
    texto:
      `Horas de Madrid.\n\n${generales.join("\n")}` +
      (personales.length ? `\n\n### Los pasos de Plutón por tu carta\n\nFechas aproximadas, con un día de margen.\n\n${personales.join("\n")}` : ""),
  };
}

/** Compone la guía. `ia` trae las secciones que ha escrito la IA ya validadas; las que falten se rellenan con texto determinista. */
export function componerGuia(base: PlutonBase, ia: RedaccionIA = {}): PlutonGuide {
  const secciones: GuideSection[] = [];
  secciones.push({ titulo: "Qué pasa en el cielo", texto: INTRO_CIELO });
  secciones.push({ titulo: "Lo esencial para ti", texto: ia.hilo ?? hiloDeterminista(base) });
  secciones.push(seccionPunto(base));
  secciones.push(seccionCasa(base));
  secciones.push({ titulo: "Dónde se mueve la marea en tu carta", texto: ia.marea ?? seccionMareaDeterminista(base) });
  secciones.push({ titulo: "Lo que toca tu carta", texto: ia.contactos ?? seccionContactosDeterminista(base) });
  secciones.push(seccionFases(base));
  secciones.push(seccionFechas(base));
  return {
    nombre: base.nombre,
    ascendente: base.ascendente,
    casa: base.casa,
    aproximada: base.aproximada,
    seccionesIA: [ia.hilo, ia.marea, ia.contactos].filter(Boolean).length,
    secciones,
    cta: {
      texto: `${TEXTO_CIERRE}\n\nCrea tu carta natal gratis y mírala completa.`,
      boton: "Crear mi carta natal",
      ruta: `/registro?siguiente=${encodeURIComponent("/carta/nueva")}`,
    },
  };
}

/** Guía completamente determinista (sin IA). */
export function buildPlutonGuide(chart: Chart, nombre: string): PlutonGuide {
  return componerGuia(calcularBase(chart, nombre));
}

// ─────────────────────────────────────────────────────────────
// Datos para la IA

/** Distancia del grado del contacto al punto de la estación (3°04′), como dato para la IA. */
function distanciaEstacion(c: ContactoPluton, masExacto: ContactoPluton | null) {
  const d = distanciaAEstacion(c);
  if (d < 0.001) return "";
  return ` Ese grado está a ${grados(d)} del punto de la estación (3°04′ de Acuario).${masExacto === c ? " Es el contacto más exacto de su carta con la estación (a menos de 1°)." : ""}`;
}

/** Todos los datos que la IA puede usar. Lo que no esté aquí no se puede afirmar. */
export function plutonFactsText(base: PlutonBase): string {
  const { chart, cusps } = base;
  const out: string[] = [];
  out.push(`Sistema de casas: ${base.aproximada ? "aproximado (Placidus no se puede calcular en esa latitud)" : "Placidus"}.`);
  out.push(`Ascendente: ${posicion(chart.angles!.asc)}. Medio Cielo: ${posicion(chart.angles!.mc)}.`);
  out.push("");
  out.push("CÚSPIDES DE LAS CASAS");
  out.push(cusps.map((c, i) => `casa ${ROMAN[i]}: ${posicion(c)}`).join(" · "));
  out.push("");
  out.push("PUNTOS NATALES (posición, casa)");
  for (const p of base.naturales) {
    const b = chart.bodies.find((x) => x.id === p.id);
    out.push(`- ${nombreDe(p.id)}: ${posicion(p.lon)}, casa ${ROMAN[p.casa - 1]}${b?.retrograde ? ", retrógrado" : ""}`);
  }
  out.push("");
  out.push("EVENTO (hora de Madrid)");
  out.push(`- Plutón entró en Acuario de forma definitiva el ${ENTRADA_ACUARIO} y saldrá hacia Piscis el ${SALIDA_ACUARIO}.`);
  out.push(`- Se detuvo retrógrado el 6 de mayo de 2026 a 5°31′ de Acuario (marea baja), y se detiene directo el 16 de octubre de 2026 a las 04:40 a 3°04′ de Acuario (marea alta).`);
  out.push(`- Estará directo hasta el 8 de mayo de 2027, cuando se detenga retrógrado a 7°11′ de Acuario (204 días directo). Volverá a ir directo el 18 de octubre de 2027 a 4°45′ de Acuario.`);
  out.push(`- El recorrido de la marea va de 3°04′ a 7°11′ de Acuario. Plutón retrógrado en 2026 recorre de 5°31′ a 3°04′.`);
  out.push("");
  out.push("CÓMO TOCA EL EVENTO LA CARTA DE ESTA PERSONA (calculado)");
  out.push(`- El punto de la estación (3°04′ de Acuario) cae en su casa ${ROMAN[base.casa - 1]} (${CASAS_PLUTON[base.casa - 1].tema}).`);
  if (base.cercania) out.push(`- Ese punto está a ${grados(base.cercania.distancia)} de la cúspide donde ${base.cercania.lado} su casa ${ROMAN[base.casa - 1]} (${posicion(base.cercania.cuspide)}); la casa vecina es la ${ROMAN[base.cercania.casaVecina - 1]}. Si su hora no es exacta, podría ser la vecina: dilo con naturalidad.`);
  out.push(`- Marea baja (de 5°31′ a 3°04′) recorre sus casas: ${base.casasBaja.map((h) => ROMAN[h - 1]).join(", ")}.`);
  out.push(`- Marea alta (de 3°04′ a 7°11′) recorre sus casas: ${base.casasAlta.map((h) => ROMAN[h - 1]).join(", ")}.`);
  const dentro = base.naturales.filter((p) => distanciaAlRecorrido(p.lon) === 0).map((p) => `${nombreNatal(p.id)} (${posicion(p.lon)}, casa ${ROMAN[p.casa - 1]})`);
  out.push(`- Puntos natales que están dentro del recorrido de la marea (3°04′ a 7°11′ de Acuario): ${dentro.length ? dentro.join("; ") : "ninguno"}.`);
  out.push("");
  out.push("CONTACTOS DE PLUTÓN CON SU CARTA (del más importante al menos importante)");
  const masExacto = contactoMasExacto(base.contactos);
  if (!base.contactos.length) out.push("- Ninguno: ningún punto natal recibe un contacto exacto ni cercano.");
  for (const c of base.contactos) {
    const asp = ASPECTOS_PLUTON[c.aspecto].frase;
    if (c.tipo === "cruce") {
      out.push(`- ${nombreNatal(c.cuerpo)} (${posicion(c.natal)}, casa ${ROMAN[c.casa - 1]}): Plutón ${c.aspecto === "conjuncion" ? "pasa por su grado" : `forma ${ASPECTOS_PLUTON[c.aspecto].nombre} con este punto al pasar por ${posicion(c.objetivo)}`}, ${textoCruces(c.cruces)}. Aspecto: ${ASPECTOS_PLUTON[c.aspecto].nombre}.${distanciaEstacion(c, masExacto)}`);
    } else {
      out.push(`- ${nombreNatal(c.cuerpo)} (${posicion(c.natal)}, casa ${ROMAN[c.casa - 1]}): Plutón no llega a pasar por ${posicion(c.objetivo)}, grado exacto de la ${ASPECTOS_PLUTON[c.aspecto].nombre}; se queda a ${grados(c.distancia)} de ese grado. Contacto cercano, no exacto.`);
    }
  }
  return out.join("\n");
}

/** Texto base de una casa, para dárselo a la IA como material de apoyo. */
export function materialCasas(base: PlutonBase): string {
  const casas = [...new Set([base.casa, ...base.casasBaja, ...base.casasAlta])];
  return casas
    .map((h) => {
      const c = CASAS_PLUTON[h - 1];
      return `CASA ${ROMAN[h - 1]} (${c.tema})\n- Plutón aquí: ${c.aqui}\n- Marea baja: ${c.baja}\n- Marea alta: ${c.alta}\n- Preguntas: ${c.preguntas.join(" · ")}`;
    })
    .join("\n\n");
}

/** Texto base de lo que significa que Plutón toque cada punto de la lista de contactos. */
export function materialPuntos(base: PlutonBase): string {
  const ids = [...new Set(base.contactos.map((c) => c.cuerpo))];
  const puntos = ids.map((id) => `${nombreDe(id)}: ${PUNTOS_PLUTON[id].texto}`).join("\n");
  const signos = base.contactos
    .map((c) => {
      const signo = SIGN_LON(c.natal);
      return `${nombreNatal(c.cuerpo)} en ${SIGN_NAMES[signo]} (${FUNCION[c.cuerpo]}): se vive ${SIGNO_MODO[signo]}. En su casa ${ROMAN[c.casa - 1]} se mezcla con ${CASAS_PLUTON[c.casa - 1].tema}.`;
    })
    .join("\n");
  const aspectos = [...new Set(base.contactos.map((c) => c.aspecto))].map((a) => `${a}: ${ASPECTOS_PLUTON[a].matiz}`).join("\n");
  return `${puntos}\n\nCÓMO VIVE CADA PUNTO SU SIGNO Y SU CASA (idea de partida: desarróllala con tus palabras)\n${signos}\n\n${aspectos}`;
}

