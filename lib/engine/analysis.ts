/**
 * Análisis de la carta para las lecturas: configuraciones (stelliums, T-cuadradas, grandes trígonos,
 * grandes cruces), planetas angulares, regente de la carta, equilibrio de elementos y hemisferios.
 * Todo se calcula aquí; la IA solo interpreta estos datos, nunca calcula posiciones.
 */
import { angleDiff } from "./index";
import { ASPECT_LABELS, BODY_LABELS, ELEMENT_NAMES, HOUSE_SYSTEM_LABELS, MODALITY_NAMES, POINT_LABELS, ROMAN, SIGN_ELEMENT, SIGN_NAMES, formatDegree } from "./labels";
import type { BodyId, Chart } from "./types";

const PERSONAL: BodyId[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];

/** Regentes tradicionales y modernos de cada signo. */
const RULERS: { traditional: BodyId; modern?: BodyId }[] = [
  { traditional: "mars" },
  { traditional: "venus" },
  { traditional: "mercury" },
  { traditional: "moon" },
  { traditional: "sun" },
  { traditional: "mercury" },
  { traditional: "venus" },
  { traditional: "mars", modern: "pluto" },
  { traditional: "jupiter" },
  { traditional: "saturn" },
  { traditional: "saturn", modern: "uranus" },
  { traditional: "jupiter", modern: "neptune" },
];

export type Pattern = { kind: "stellium" | "tcuadrada" | "gran-trigono" | "gran-cruz"; description: string };

export type ChartAnalysis = {
  patterns: Pattern[];
  angular: string[];
  ruler: string | null;
  elements: number[];
  modalities: number[];
  dominantElement: string;
  missingElements: string[];
  dominantModality: string;
  hemispheres: string | null;
};

const name = (id: string) => POINT_LABELS[id]?.name ?? id;

export function analyzeChart(chart: Chart): ChartAnalysis {
  const planets = chart.bodies.filter((b) => PERSONAL.includes(b.id));
  const patterns: Pattern[] = [];

  // Stelliums: 3 o más planetas en el mismo signo o casa.
  for (let s = 0; s < 12; s++) {
    const inSign = planets.filter((p) => p.sign === s);
    if (inSign.length >= 3) patterns.push({ kind: "stellium", description: `Stellium en ${SIGN_NAMES[s]}: ${inSign.map((p) => name(p.id)).join(", ")}.` });
  }
  if (chart.houses) {
    for (let h = 1; h <= 12; h++) {
      const inHouse = planets.filter((p) => p.house === h);
      if (inHouse.length >= 3) patterns.push({ kind: "stellium", description: `Stellium en la casa ${ROMAN[h - 1]}: ${inHouse.map((p) => name(p.id)).join(", ")}.` });
    }
  }

  // Configuraciones de aspectos entre los diez planetas.
  const has = (a: string, b: string, type: string) => chart.aspects.some((x) => x.type === type && ((x.a === a && x.b === b) || (x.a === b && x.b === a)));
  const ids = planets.map((p) => p.id as string);
  const seen = new Set<string>();
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      for (let k = j + 1; k < ids.length; k++) {
        const [a, b, c] = [ids[i], ids[j], ids[k]];
        if (has(a, b, "trine") && has(b, c, "trine") && has(a, c, "trine")) {
          const key = `gt-${[a, b, c].sort().join()}`;
          if (!seen.has(key)) {
            seen.add(key);
            patterns.push({ kind: "gran-trigono", description: `Gran trígono entre ${name(a)}, ${name(b)} y ${name(c)}.` });
          }
        }
        for (const [x, y, apex] of [
          [a, b, c],
          [a, c, b],
          [b, c, a],
        ]) {
          if (has(x, y, "opposition") && has(x, apex, "square") && has(y, apex, "square")) {
            const key = `tq-${[x, y].sort().join()}-${apex}`;
            if (!seen.has(key)) {
              seen.add(key);
              patterns.push({ kind: "tcuadrada", description: `T-cuadrada: ${name(x)} en oposición a ${name(y)}, ambos en cuadratura con ${name(apex)} (planeta focal).` });
            }
          }
        }
      }
    }
  }
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++)
      for (let k = j + 1; k < ids.length; k++)
        for (let l = k + 1; l < ids.length; l++) {
          const q = [ids[i], ids[j], ids[k], ids[l]];
          const opp = q.flatMap((x, xi) => q.slice(xi + 1).map((y) => [x, y])).filter(([x, y]) => has(x, y, "opposition"));
          if (opp.length === 2 && q.flatMap((x, xi) => q.slice(xi + 1).map((y) => [x, y])).filter(([x, y]) => has(x, y, "square")).length === 4) {
            patterns.push({ kind: "gran-cruz", description: `Gran cruz entre ${q.map(name).join(", ")}.` });
          }
        }

  // Planetas angulares: a menos de 8° de un ángulo.
  const angular: string[] = [];
  if (chart.angles) {
    const angles: [string, number][] = [
      ["Ascendente", chart.angles.asc],
      ["Medio Cielo", chart.angles.mc],
      ["Descendente", chart.angles.dsc],
      ["Fondo del Cielo", chart.angles.ic],
    ];
    for (const p of planets)
      for (const [label, lon] of angles) {
        const orb = Math.abs(angleDiff(p.longitude, lon));
        if (orb <= 8) angular.push(`${name(p.id)} junto al ${label} (a ${orb.toFixed(1)}°)`);
      }
  }

  // Regente de la carta: regente del signo del Ascendente.
  let ruler: string | null = null;
  if (chart.angles) {
    const ascSign = Math.floor(chart.angles.asc / 30);
    const r = RULERS[ascSign];
    const describe = (id: BodyId) => {
      const b = chart.bodies.find((x) => x.id === id);
      return b ? `${name(id)} en ${SIGN_NAMES[b.sign]}${b.house ? `, casa ${ROMAN[b.house - 1]}` : ""}` : name(id);
    };
    ruler = `Ascendente en ${SIGN_NAMES[ascSign]}; regente tradicional ${describe(r.traditional)}${r.modern ? `; regente moderno ${describe(r.modern)}` : ""}.`;
  }

  // Elementos y modalidades (10 planetas + Ascendente; Sol y Luna cuentan doble).
  const elements = [0, 0, 0, 0];
  const modalities = [0, 0, 0];
  for (const p of planets) {
    const w = p.id === "sun" || p.id === "moon" ? 2 : 1;
    elements[SIGN_ELEMENT[p.sign]] += w;
    modalities[p.sign % 3] += w;
  }
  if (chart.angles) {
    const s = Math.floor(chart.angles.asc / 30);
    elements[SIGN_ELEMENT[s]] += 2;
    modalities[s % 3] += 2;
  }
  const maxEl = Math.max(...elements);
  const maxMod = Math.max(...modalities);

  // Hemisferios (casas): arriba/abajo del horizonte, este/oeste.
  let hemispheres: string | null = null;
  if (chart.houses) {
    const above = planets.filter((p) => p.house && p.house >= 7).length;
    const east = planets.filter((p) => p.house && (p.house >= 10 || p.house <= 3)).length;
    const parts: string[] = [];
    if (above >= 7) parts.push("mayoría de planetas sobre el horizonte (casas VII-XII: vida pública, relaciones)");
    if (above <= 3) parts.push("mayoría de planetas bajo el horizonte (casas I-VI: vida personal e interior)");
    if (east >= 7) parts.push("énfasis en el hemisferio oriental (iniciativa propia)");
    if (east <= 3) parts.push("énfasis en el hemisferio occidental (vida a través de los demás)");
    hemispheres = parts.join("; ") || null;
  }

  return {
    patterns,
    angular,
    ruler,
    elements,
    modalities,
    dominantElement: ELEMENT_NAMES[elements.indexOf(maxEl)],
    missingElements: ELEMENT_NAMES.filter((_, i) => elements[i] === 0),
    dominantModality: MODALITY_NAMES[modalities.indexOf(maxMod)],
    hemispheres,
  };
}

/** Descripción en texto de todos los datos de la carta, para que la IA los interprete. */
export function chartFactsText(chart: Chart, chartName: string, birth: string): string {
  const a = analyzeChart(chart);
  const lines: string[] = [];
  lines.push(`CARTA NATAL DE: ${chartName}`);
  lines.push(`Nacimiento: ${birth}`);
  if (chart.timeNotes.length) lines.push(`Notas: ${chart.timeNotes.join(" ")}`);
  lines.push("");
  lines.push("POSICIONES (zodiaco tropical):");
  for (const b of chart.bodies) {
    if (b.id === "trueNode" || b.id === "trueLilith") continue;
    lines.push(`- ${BODY_LABELS[b.id].name}: ${formatDegree(b.longitude)} ${SIGN_NAMES[b.sign]}${b.house ? `, casa ${ROMAN[b.house - 1]}` : ""}${b.retrograde ? ", retrógrado" : ""}`);
  }
  if (chart.angles && chart.houses) {
    lines.push(`- Ascendente: ${formatDegree(chart.angles.asc)} ${SIGN_NAMES[Math.floor(chart.angles.asc / 30)]}`);
    lines.push(`- Medio Cielo: ${formatDegree(chart.angles.mc)} ${SIGN_NAMES[Math.floor(chart.angles.mc / 30)]}`);
    lines.push("");
    lines.push(`CÚSPIDES DE LAS CASAS (${HOUSE_SYSTEM_LABELS[chart.houses.systemUsed]}):`);
    lines.push(chart.houses.cusps.map((c, i) => `${ROMAN[i]} ${formatDegree(c)} ${SIGN_NAMES[Math.floor(c / 30)]}`).join(" · "));
  } else {
    lines.push("Hora de nacimiento desconocida: sin Ascendente ni casas. No interpretes casas ni ángulos.");
  }
  lines.push("");
  lines.push("ASPECTOS (orbe en grados):");
  for (const x of chart.aspects) {
    if ([x.a, x.b].some((id) => id === "trueNode" || id === "trueLilith")) continue;
    lines.push(`- ${name(x.a)} ${ASPECT_LABELS[x.type].name.toLowerCase()} ${name(x.b)} (${x.orb.toFixed(1)}°${x.applying === true ? ", aplicativo" : x.applying === false ? ", separativo" : ""})`);
  }
  lines.push("");
  lines.push("CONFIGURACIONES Y DOMINANTES:");
  for (const p of a.patterns) lines.push(`- ${p.description}`);
  if (!a.patterns.length) lines.push("- Sin configuraciones mayores (stellium, T-cuadrada, gran trígono o gran cruz).");
  if (a.ruler) lines.push(`- Regente de la carta: ${a.ruler}`);
  for (const x of a.angular) lines.push(`- Planeta angular: ${x}`);
  lines.push(`- Elementos (ponderados): ${ELEMENT_NAMES.map((n, i) => `${n} ${a.elements[i]}`).join(", ")}. Dominante: ${a.dominantElement}.${a.missingElements.length ? ` Sin planetas en: ${a.missingElements.join(", ")}.` : ""}`);
  lines.push(`- Modalidades (ponderadas): ${MODALITY_NAMES.map((n, i) => `${n} ${a.modalities[i]}`).join(", ")}. Dominante: ${a.dominantModality}.`);
  if (a.hemispheres) lines.push(`- Hemisferios: ${a.hemispheres}.`);
  if (chart.fixedStars.length) lines.push(`- Estrellas fijas en conjunción (orbe ≤ 1°): ${chart.fixedStars.map((f) => `${f.star} con ${name(f.point)}`).join("; ")}.`);
  return lines.join("\n");
}
