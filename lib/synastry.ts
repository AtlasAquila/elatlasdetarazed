import { birthSummary, chartFromRow, getMyChart, listMyCharts, type ChartRow } from "@/lib/charts";
import { ENGINE_VERSION, findCrossAspects, houseOf } from "@/lib/engine";
import { chartFactsText } from "@/lib/engine/analysis";
import { ASPECT_LABELS, BODY_LABELS, ROMAN, formatOrb } from "@/lib/engine/labels";
import type { Aspect, BodyId, Chart } from "@/lib/engine/types";
import { createClient } from "@/lib/supabase/server";

export type RelationshipType = "pareja" | "familia" | "amistad" | "trabajo" | "otro";

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  pareja: "Pareja",
  familia: "Familia",
  amistad: "Amistad",
  trabajo: "Trabajo o socios",
  otro: "Otro vínculo",
};

export type SynastryRow = {
  id: string;
  chart_a_id: string;
  chart_b_id: string;
  relationship_type: RelationshipType;
  /** Lectura extensa; null si aún no se ha generado (la compra sigue pagada y sin usar). */
  reading: string | null;
  created_at: string;
};

export const SYNASTRY_COLUMNS = "id, chart_a_id, chart_b_id, relationship_type, reading, created_at";

export async function listMySynastries(): Promise<SynastryRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.from("synastries").select(SYNASTRY_COLUMNS).order("created_at", { ascending: false });
  return (data as SynastryRow[] | null) ?? [];
}

export async function getSynastry(id: string): Promise<SynastryRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.from("synastries").select(SYNASTRY_COLUMNS).eq("id", id).maybeSingle();
  return (data as SynastryRow | null) ?? null;
}

/** Todos los elementos que entran en la sinastría: los diez planetas más Quirón, el Nodo y Lilith (variantes medias). */
export const SYNASTRY_BODIES: BodyId[] = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
  "chiron",
  "meanNode",
  "meanLilith",
];

export type SynastryOverlayEntry = { bodyId: BodyId; house: number };

export type SynastryData = {
  chartA: Chart;
  chartB: Chart;
  /** Aspectos entre los planetas de A y los de B (A primero en cada aspecto). */
  crossAspects: Aspect[];
  /** En qué casa de A cae cada planeta de B (solo si A tiene casas calculadas). */
  overlay: SynastryOverlayEntry[] | null;
};

/** Calcula la sinastría a partir de las dos cartas de referencia (siempre con la versión actual del motor). */
export function computeSynastryData(rowA: ChartRow, rowB: ChartRow): SynastryData {
  const chartA = chartFromRow(rowA);
  const chartB = chartFromRow(rowB);

  const pointsA = chartA.bodies.filter((b) => SYNASTRY_BODIES.includes(b.id)).map((b) => ({ id: b.id as string, lon: b.longitude, speed: b.speed }));
  const pointsB = chartB.bodies.filter((b) => SYNASTRY_BODIES.includes(b.id)).map((b) => ({ id: b.id as string, lon: b.longitude, speed: b.speed }));
  const crossAspects = findCrossAspects(pointsA, pointsB);

  const overlay = chartA.houses
    ? chartB.bodies.filter((b) => SYNASTRY_BODIES.includes(b.id)).map((b) => ({ bodyId: b.id, house: houseOf(b.longitude, chartA.houses!.cusps) }))
    : null;

  return { chartA, chartB, crossAspects, overlay };
}

export { ENGINE_VERSION };

/** Cartas de la cuenta que se pueden elegir para una sinastría (cualquier par). */
export async function listChartsForSynastry() {
  return listMyCharts();
}

export async function getSynastryCharts(row: SynastryRow): Promise<{ a: ChartRow; b: ChartRow } | null> {
  const [a, b] = await Promise.all([getMyChart(row.chart_a_id), getMyChart(row.chart_b_id)]);
  if (!a || !b) return null;
  return { a, b };
}

/** Datos de las dos cartas y de la sinastría, juntos, para la lectura de la IA (casas superpuestas en las dos direcciones). */
export function synastryFactsText(rowA: ChartRow, rowB: ChartRow, data: SynastryData, relationship: RelationshipType): string {
  const { chartA, chartB, crossAspects } = data;
  const lines: string[] = [];
  lines.push(`TIPO DE VÍNCULO ENTRE LAS DOS PERSONAS: ${RELATIONSHIP_LABELS[relationship]}.`);
  lines.push("");
  lines.push("════ PRIMERA PERSONA ════");
  lines.push(chartFactsText(chartA, rowA.name, birthSummary(rowA)));
  lines.push("");
  lines.push("════ SEGUNDA PERSONA ════");
  lines.push(chartFactsText(chartB, rowB.name, birthSummary(rowB)));
  lines.push("");
  lines.push(`════ SINASTRÍA: ${rowA.name} (primera) y ${rowB.name} (segunda) ════`);
  lines.push("ASPECTOS ENTRE LAS DOS CARTAS (cada uno, de un planeta de la primera persona a uno de la segunda; orbe en grados):");
  if (!crossAspects.length) lines.push("- Ninguno dentro de orbe.");
  for (const a of crossAspects.slice(0, 60)) {
    lines.push(`- ${BODY_LABELS[a.a as BodyId].name} de ${rowA.name} en ${ASPECT_LABELS[a.type].name.toLowerCase()} a ${BODY_LABELS[a.b as BodyId].name} de ${rowB.name} (${formatOrb(a.orb)}${a.applying === true ? ", aplicativo" : a.applying === false ? ", separativo" : ""})`);
  }
  const overlay = (from: Chart, to: Chart, fromName: string, toName: string) => {
    if (!to.houses) return;
    lines.push("");
    lines.push(`CASAS SUPERPUESTAS: planetas de ${fromName} en las casas de ${toName}:`);
    for (const b of from.bodies.filter((x) => SYNASTRY_BODIES.includes(x.id))) lines.push(`- ${BODY_LABELS[b.id].name} de ${fromName}: casa ${ROMAN[houseOf(b.longitude, to.houses!.cusps) - 1]} de ${toName}`);
  };
  overlay(chartB, chartA, rowB.name, rowA.name);
  overlay(chartA, chartB, rowA.name, rowB.name);
  return lines.join("\n");
}
