import { computeSolarReturn, ENGINE_VERSION, findCrossAspects, houseOf } from "@/lib/engine";
import { chartFactsText } from "@/lib/engine/analysis";
import { ASPECT_LABELS, POINT_LABELS, ROMAN, formatOrb } from "@/lib/engine/labels";
import { zoneOffsetMinutes } from "@/lib/engine/time";
import type { BodyId, Chart, HouseSystem } from "@/lib/engine/types";
import { createClient } from "@/lib/supabase/server";
import { birthSummary, chartFromRow, type ChartRow } from "@/lib/charts";

export type SolarReturnRow = {
  id: string;
  chart_id: string;
  year: number;
  place_name: string;
  latitude: number;
  longitude: number;
  time_zone: string;
  house_system: HouseSystem;
  return_utc: string;
  /** Lectura extensa; null si aún no se ha generado (la compra sigue pagada y sin usar). */
  reading: string | null;
  created_at: string;
};

export const SOLAR_RETURN_COLUMNS = "id, chart_id, year, place_name, latitude, longitude, time_zone, house_system, return_utc, reading, created_at";

export async function listSolarReturns(chartId: string): Promise<SolarReturnRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.from("solar_returns").select(SOLAR_RETURN_COLUMNS).eq("chart_id", chartId).order("year", { ascending: false }).order("created_at", { ascending: false });
  return (data as SolarReturnRow[] | null) ?? [];
}

export async function getSolarReturn(id: string): Promise<SolarReturnRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.from("solar_returns").select(SOLAR_RETURN_COLUMNS).eq("id", id).maybeSingle();
  return (data as SolarReturnRow | null) ?? null;
}

/** Longitud eclíptica del Sol natal, a partir de la carta natal de referencia. */
export function natalSunLongitude(natalRow: ChartRow): number {
  const natalChart = chartFromRow(natalRow);
  return natalChart.bodies.find((b) => b.id === "sun")!.longitude;
}

/** Calcula la revolución solar a partir de la fila guardada y la carta natal de referencia (siempre con la versión actual del motor). */
export function solarReturnFromRow(row: SolarReturnRow, natalRow: ChartRow, houseSystem?: HouseSystem): Chart {
  const [, natalMonth, natalDay] = natalRow.birth_date.split("-").map(Number);
  return computeSolarReturn({
    natalSunLongitude: natalSunLongitude(natalRow),
    year: row.year,
    birthMonth: natalMonth,
    birthDay: natalDay,
    latitude: row.latitude,
    longitude: row.longitude,
    houseSystem: houseSystem ?? row.house_system,
  });
}

export { ENGINE_VERSION };

/** Fecha y hora civiles (YYYY-MM-DD / HH:MM) del instante de la revolución, en la zona del lugar elegido. */
export function solarReturnLocalParts(row: SolarReturnRow): { date: string; time: string } {
  const utcMillis = new Date(row.return_utc).getTime();
  const offset = zoneOffsetMinutes(row.time_zone, utcMillis);
  const local = new Date(utcMillis + offset * 60_000);
  const date = `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, "0")}-${String(local.getUTCDate()).padStart(2, "0")}`;
  const time = `${String(local.getUTCHours()).padStart(2, "0")}:${String(local.getUTCMinutes()).padStart(2, "0")}`;
  return { date, time };
}

const dateFmt = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

export function solarReturnSummary(row: SolarReturnRow) {
  const date = dateFmt.format(new Date(row.return_utc));
  return `${date} UTC · ${row.place_name}`;
}

const SR_BODIES: BodyId[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "chiron"];

/** Datos de la carta natal y de la revolución solar, juntos, para la lectura de la IA. */
export function solarReturnFactsText(natalRow: ChartRow, row: SolarReturnRow): string {
  const natal = chartFromRow(natalRow);
  const sr = solarReturnFromRow(row, natalRow);
  const local = solarReturnLocalParts(row);
  const lines: string[] = [];
  lines.push(chartFactsText(natal, natalRow.name, birthSummary(natalRow)));
  lines.push("");
  lines.push("════ REVOLUCIÓN SOLAR ════");
  lines.push(`Año: ${row.year}. Instante exacto en que el Sol vuelve a su grado natal: ${local.date} ${local.time} (hora local de ${row.place_name}) · ${new Date(row.return_utc).toISOString().slice(0, 16)} UTC.`);
  lines.push(`Lugar de la revolución: ${row.place_name}. El lugar condiciona el Ascendente, los ángulos y las casas de la revolución.`);
  lines.push("");
  lines.push(chartFactsText(sr, `Revolución solar ${row.year}`, `${local.date} · ${local.time} · ${row.place_name}`).replace("CARTA NATAL DE:", "CARTA DE LA REVOLUCIÓN SOLAR:").replace("Nacimiento:", "Instante y lugar:"));

  if (natal.houses) {
    lines.push("");
    lines.push("PLANETAS DE LA REVOLUCIÓN EN LAS CASAS DE LA CARTA NATAL:");
    for (const b of sr.bodies.filter((x) => SR_BODIES.includes(x.id))) lines.push(`- ${POINT_LABELS[b.id].name} de la revolución: casa natal ${ROMAN[houseOf(b.longitude, natal.houses.cusps) - 1]}`);
    if (sr.angles) {
      lines.push(`- Ascendente de la revolución: casa natal ${ROMAN[houseOf(sr.angles.asc, natal.houses.cusps) - 1]}`);
      lines.push(`- Medio Cielo de la revolución: casa natal ${ROMAN[houseOf(sr.angles.mc, natal.houses.cusps) - 1]}`);
    }
  }

  const points = (chart: Chart) => {
    const list = chart.bodies.filter((b) => SR_BODIES.includes(b.id)).map((b) => ({ id: b.id as string, lon: b.longitude, speed: b.speed }));
    if (chart.angles) list.push({ id: "asc", lon: chart.angles.asc, speed: 0 }, { id: "mc", lon: chart.angles.mc, speed: 0 });
    return list;
  };
  lines.push("");
  lines.push("ASPECTOS ENTRE LA REVOLUCIÓN Y LA CARTA NATAL (orbe en grados):");
  const cross = findCrossAspects(points(sr), points(natal)).slice(0, 45);
  if (!cross.length) lines.push("- Ninguno dentro de orbe.");
  for (const a of cross) lines.push(`- ${POINT_LABELS[a.a].name} de la revolución en ${ASPECT_LABELS[a.type].name.toLowerCase()} a tu ${POINT_LABELS[a.b].name} natal (${formatOrb(a.orb)})`);
  return lines.join("\n");
}
