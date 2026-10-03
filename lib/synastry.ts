import { chartFromRow, getMyChart, listMyCharts, type ChartRow } from "@/lib/charts";
import { ENGINE_VERSION, findCrossAspects, houseOf } from "@/lib/engine";
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
  created_at: string;
};

export const SYNASTRY_COLUMNS = "id, chart_a_id, chart_b_id, relationship_type, created_at";

/** Cupo mensual: solo Premium, 3 sinastrías al mes (ver synastry_status() en la base de datos). */
export type SynastryStatus = { plan: string; isAdmin: boolean; used: number; limit: number; remaining: number };

export async function getSynastryStatus(): Promise<SynastryStatus | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.rpc("synastry_status").maybeSingle<{ plan: string; is_admin: boolean; used: number; synastry_limit: number; remaining: number }>();
  if (!data) return null;
  return { plan: data.plan, isAdmin: data.is_admin, used: data.used, limit: data.synastry_limit, remaining: data.remaining };
}

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
