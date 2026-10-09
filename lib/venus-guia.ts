/**
 * Guía personal de la campaña «Venus retrógrado»: se construye con la carta natal de quien la pide
 * y se muestra en pantalla y por correo. Los textos están en lib/venus-guia-textos.ts.
 */

import { angleDiff, houseOf } from "@/lib/engine";
import { SIGN_NAMES } from "@/lib/engine/labels";
import type { BodyId, Chart } from "@/lib/engine/types";
import { siteUrl } from "@/lib/supabase/config";
import { NEW_MOON_LONGITUDE, VENUS_CALENDAR } from "@/lib/venus-retrogrado";
import {
  ASPECTO_MATIZ,
  ASPECTOS,
  CASAS,
  FASES,
  INTRO_CIELO,
  PUNTOS_CIELO,
  type PuntoCielo,
  PUNTOS_PERSONALES,
  SIN_CONTACTOS,
  EJE_MARTE_PLUTON,
  TEXTO_CIERRE,
  VENUS_NATAL_RETROGRADO,
  VENUS_SIGNOS,
} from "@/lib/venus-guia-textos";

export type GuideSection = { titulo: string; texto: string };

export type GuideContent = {
  nombre: string;
  /** 0 = Aries … 11 = Piscis */
  ascendente: number;
  /** Casa (1-12) donde cae la Luna Nueva. */
  casa: number;
  /** Si el sistema Placidus no se pudo aplicar en esa latitud. */
  aproximada: boolean;
  secciones: GuideSection[];
  cta: { texto: string; boton: string; ruta: string };
};

export const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const SIGN_LON = (lon: number) => Math.floor((((lon % 360) + 360) % 360) / 30);

/** 12.5 → «12°30′» */
export function grados(deg: number) {
  const t = Math.round(deg * 60);
  return `${Math.floor(t / 60)}°${String(t % 60).padStart(2, "0")}′`;
}

export const posicion = (lon: number) => `${grados(((lon % 30) + 30) % 30)} de ${SIGN_NAMES[SIGN_LON(lon)]}`;

export type Contacto = { cuerpo: string; natal: number; punto: (typeof PUNTOS_CIELO)[number]; aspecto: keyof typeof ASPECTOS; orbe: number };

/** Para cada punto personal, el contacto más cercano (conjunción, cuadratura u oposición) con los puntos del cielo. */
export function contactos(chart: Chart, puntos: PuntoCielo[] = PUNTOS_CIELO): Contacto[] {
  const natales: { id: string; lon: number; orbe: number }[] = (["sun", "moon", "mercury", "venus", "mars"] as BodyId[]).flatMap((id) => {
    // Sin hora de nacimiento la Luna puede variar hasta 7° en el día: no se compara.
    if (id === "moon" && chart.input.timeUnknown) return [];
    const b = chart.bodies.find((x) => x.id === id);
    return b ? [{ id, lon: b.longitude, orbe: 3 }] : [];
  });
  if (chart.angles) natales.push({ id: "asc", lon: chart.angles.asc, orbe: 2 });

  const found: Contacto[] = [];
  for (const n of natales) {
    let best: Contacto | null = null;
    for (const p of puntos) {
      const d = Math.abs(angleDiff(n.lon, p.longitud));
      const options: [keyof typeof ASPECTOS, number][] = [
        ["conjuncion", d],
        ["cuadratura", Math.abs(d - 90)],
        ["oposicion", Math.abs(d - 180)],
      ];
      for (const [aspecto, orbe] of options) {
        if (orbe <= n.orbe && (!best || orbe < best.orbe)) best = { cuerpo: n.id, natal: n.lon, punto: p, aspecto, orbe };
      }
    }
    if (best) found.push(best);
  }
  return found.sort((a, b) => a.orbe - b.orbe).slice(0, 3);
}

/** Casas que recorre Venus entre dos longitudes, en el orden en que las atraviesa (retrógrado: de mayor a menor longitud). */
export function casasDelRecorrido(desde: number, hasta: number, cusps: number[]) {
  const casas: number[] = [];
  const pasos = 64;
  for (let i = 0; i <= pasos; i++) {
    const h = houseOf(desde + ((hasta - desde) * i) / pasos, cusps);
    if (casas[casas.length - 1] !== h) casas.push(h);
  }
  return casas;
}

const lista = (items: string[]) => (items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`);

export function buildGuide(chart: Chart, nombre: string): GuideContent {
  if (!chart.angles || !chart.houses) throw new Error("La guía necesita ascendente y casas.");
  const { cusps } = chart.houses;
  const ascendente = SIGN_LON(chart.angles.asc);
  const casa = houseOf(NEW_MOON_LONGITUDE, cusps);
  const aproximada = chart.houses.systemUsed !== "placidus";
  const c = CASAS[casa - 1];

  const [lunaNueva, venusRetro, , conjuncion, venusDirecto] = PUNTOS_CIELO;
  const casaRetro = houseOf(venusRetro.longitud, cusps);
  const casaConjuncion = houseOf(conjuncion.longitud, cusps);
  const casaDirecto = houseOf(venusDirecto.longitud, cusps);
  const recorrido = casasDelRecorrido(venusRetro.longitud, venusDirecto.longitud, cusps);

  const secciones: GuideSection[] = [];

  secciones.push({ titulo: "Qué pasa en el cielo", texto: INTRO_CIELO });

  secciones.push({
    titulo: `Tu punto de partida: ascendente ${SIGN_NAMES[ascendente]}`,
    texto:
      `Tu ascendente es ${SIGN_NAMES[ascendente]} (a ${grados(chart.angles.asc % 30)}). Desde ahí se reparten tus casas, y las casas dicen en qué terreno de tu vida cae cada parte del cielo.` +
      ` La hora y el lugar de nacimiento que diste las fijan; con una hora aproximada, las casas pueden desplazarse una.` +
      (aproximada ? "\n\n*En la latitud de tu lugar de nacimiento las casas Placidus no se pueden calcular con exactitud, así que las casas de esta guía son aproximadas.*" : ""),
  });

  secciones.push({
    titulo: `La Luna Nueva cae en tu casa ${ROMAN[casa - 1]}`,
    texto: `La Luna Nueva del 10 de octubre, a ${lunaNueva.grado}, toca en tu carta ${c.tema}.\n\n${c.luna}\n\nDos preguntas para llevarte:\n\n- *${c.preguntas[0]}*\n- *${c.preguntas[1]}*`,
  });

  const recorridoTexto =
    casaRetro === casaDirecto
      ? `Venus retrógrado se detiene a ${venusRetro.grado} y vuelve sobre sus pasos hasta ${venusDirecto.grado}: todo su recorrido cae en tu casa ${ROMAN[casaRetro - 1]}.`
      : `Venus retrógrado se detiene a ${venusRetro.grado}, en tu casa ${ROMAN[casaRetro - 1]}, retrocede hasta ${venusDirecto.grado} y se detiene directo en tu casa ${ROMAN[casaDirecto - 1]}.`;
  secciones.push({
    titulo: "Dónde revisa Venus tu carta",
    texto:
      `${recorridoTexto}${recorrido.length > 1 ? " Entre una estación y otra cruza estas casas, en este orden:" : ""}\n\n` +
      recorrido.map((h) => `- **Casa ${ROMAN[h - 1]} · ${CASAS[h - 1].tema}.** ${CASAS[h - 1].venus}`).join("\n"),
  });

  const venus = chart.bodies.find((b) => b.id === "venus");
  if (venus) {
    secciones.push({
      titulo: `Tu Venus natal en ${SIGN_NAMES[venus.sign]}`,
      texto:
        `${VENUS_SIGNOS[venus.sign]}\n\n` +
        (venus.house ? `Tu Venus está en la casa ${ROMAN[venus.house - 1]} (${CASAS[venus.house - 1].tema}): ahí se concentra tu manera de dar y de pedir afecto.` : "") +
        (venus.retrograde ? `\n\n${VENUS_NATAL_RETROGRADO}` : ""),
    });
  }

  const toques = contactos(chart);
  secciones.push({
    titulo: "Lo que toca tu carta",
    texto: toques.length
      ? "Estos son los puntos de tu carta que el tránsito toca por grado, del contacto más exacto al menos exacto.\n\n" +
        toques
          .map((t) => {
            const p = PUNTOS_PERSONALES[t.cuerpo];
            return `**${p.nombre} natal, ${posicion(t.natal)}.** Está ${ASPECTOS[t.aspecto]} ${t.punto.nombre} (${t.punto.fecha}, ${t.punto.grado}), con un orbe de ${grados(t.orbe)}. ${p.texto} ${ASPECTO_MATIZ[t.aspecto]}`;
          })
          .join("\n\n")
      : SIN_CONTACTOS,
  });

  secciones.push({
    titulo: "El ciclo, fase a fase",
    texto: [
      `### ${FASES.apertura.titulo}\n\n${FASES.apertura.texto}\n\n**En tu carta:** la Luna Nueva siembra en tu casa ${ROMAN[casa - 1]} y Venus empieza a revisar tu casa ${ROMAN[casaRetro - 1]}.`,
      `### ${FASES.centro.titulo}\n\n${FASES.centro.texto}\n\n**En tu carta:** la conjunción inferior cae en tu casa ${ROMAN[casaConjuncion - 1]} (${CASAS[casaConjuncion - 1].tema}).`,
      `### ${FASES.salida.titulo}\n\n${FASES.salida.texto}\n\n**En tu carta:** Venus se detiene directo en tu casa ${ROMAN[casaDirecto - 1]} (${CASAS[casaDirecto - 1].tema}): ahí se asienta lo que has decidido.`,
      `### ${FASES.sombra.titulo}\n\n${FASES.sombra.texto}\n\n**En tu carta:** Venus recorre de nuevo, ya hacia delante, ${recorrido.length === 1 ? "tu casa" : "tus casas"} ${lista([...recorrido].reverse().map((h) => ROMAN[h - 1]))}.`,
    ].join("\n\n"),
  });

  secciones.push({
    titulo: "Fechas clave",
    texto: VENUS_CALENDAR.map((f) => `- **${f.fecha}.** ${f.texto}`).join("\n"),
  });

  const sol = chart.bodies.find((b) => b.id === "sun");
  const luna = chart.bodies.find((b) => b.id === "moon");
  const marte = chart.bodies.find((b) => b.id === "mars");
  const tuyos =
    sol && luna && marte
      ? ` En tu caso, un Sol en ${SIGN_NAMES[sol.sign]}, una Luna en ${SIGN_NAMES[luna.sign]} y un Marte en ${SIGN_NAMES[marte.sign]} responden a este tránsito de maneras muy distintas.`
      : "";

  const casaMarte = houseOf(120 + 3 + 6 / 60, cusps);
  const casaPluton = houseOf(EJE_MARTE_PLUTON.longitud, cusps);
  const eje = ` Además verás dónde cae la oposición de Marte con Plutón, que en este ciclo forma con Venus una T-cuadrada: en tu carta, entre tus casas ${ROMAN[casaMarte - 1]} y ${ROMAN[casaPluton - 1]}.`;

  return {
    nombre,
    ascendente,
    casa,
    aproximada,
    secciones,
    cta: {
      texto: `${TEXTO_CIERRE}${tuyos}${eje}\n\nCrea tu carta natal gratis y mírala completa. Después podrás preguntarle a Alshain, el asistente de El atlas de Tarazed, cómo afecta la Luna Nueva con Venus retrógrado en Escorpio a tu carta.`,
      boton: "Crear mi carta natal",
      ruta: `/registro?siguiente=${encodeURIComponent("/carta/nueva?origen=venus")}`,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Correo

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** **negrita** y *cursiva* sobre texto ya escapado. */
const inline = (s: string) => esc(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>");

const P = "margin:0 0 14px;";

/** El mismo formato de párrafos que RichText, pero como HTML de correo con estilos en línea. */
function bloquesHtml(texto: string) {
  return texto
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => {
      if (b.startsWith("### ")) return `<h3 style="font-size:18px;margin:22px 0 8px;color:#6b4f27">${inline(b.slice(4))}</h3>`;
      const lines = b.split("\n");
      if (lines.every((l) => l.trim().startsWith("- "))) {
        return `<ul style="margin:0 0 14px;padding-left:22px">${lines.map((l) => `<li style="margin-bottom:8px">${inline(l.trim().slice(2))}</li>`).join("")}</ul>`;
      }
      return `<p style="${P}">${inline(lines.join(" "))}</p>`;
    })
    .join("");
}

/** Correo con la guía. El nombre se escapa porque lo escribe quien rellena el formulario. */
export function guideEmail(g: GuideContent) {
  const secciones = g.secciones
    .map((s) => `<h2 style="font-size:22px;line-height:1.25;margin:34px 0 12px;padding-top:22px;border-top:1px solid #d9c9a8;color:#1a1204">${esc(s.titulo)}</h2>${bloquesHtml(s.texto)}`)
    .join("");
  const url = `${siteUrl}${g.cta.ruta}`;
  const html = `<div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.65;color:#1a1204;max-width:600px;margin:0 auto;padding:8px 4px">
<p style="font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:#8a6a3b;margin:0 0 6px">El atlas de Tarazed</p>
<h1 style="font-size:28px;line-height:1.2;margin:0 0 16px">Tu guía de la Luna Nueva con Venus retrógrado</h1>
<p style="${P}">${g.nombre ? `Hola, ${esc(g.nombre)}:` : "Hola:"}</p>
<p style="${P}">Esta guía lee el cielo del 10 de octubre y las semanas de Venus retrógrado sobre tu carta. Está hecha con tu fecha, tu hora y tu lugar de nacimiento. Tómate unos minutos: se lee en cinco.</p>
${secciones}
<div style="margin:34px 0 8px;padding:22px;background:#f7efdd;border:1px solid #d9c9a8;border-radius:10px">
${bloquesHtml(g.cta.texto)}
<p style="margin:18px 0 0"><a href="${esc(url)}" style="display:inline-block;background:#d5a66f;color:#1a1204;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px">${esc(g.cta.boton)} →</a></p>
</div>
<p style="${P}margin-top:26px">— El atlas de Tarazed<br><span style="font-size:14px;color:#6b4f27">El cielo como mapa. La astrología como traducción.</span></p>
</div>`;
  return { subject: "Tu guía de la Luna Nueva con Venus retrógrado", html };
}
