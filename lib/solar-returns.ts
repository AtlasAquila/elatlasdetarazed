import { computeSolarReturn, ENGINE_VERSION } from "@/lib/engine";
import { zoneOffsetMinutes } from "@/lib/engine/time";
import type { Chart, HouseSystem } from "@/lib/engine/types";
import { createClient } from "@/lib/supabase/server";
import { chartFromRow, type ChartRow } from "@/lib/charts";

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
  created_at: string;
};

export const SOLAR_RETURN_COLUMNS = "id, chart_id, year, place_name, latitude, longitude, time_zone, house_system, return_utc, created_at";

/** Cupo mensual: solo Premium, 2 revoluciones al mes (ver solar_return_status() en la base de datos). */
export type SolarReturnStatus = { plan: string; isAdmin: boolean; used: number; limit: number; remaining: number };

export async function getSolarReturnStatus(): Promise<SolarReturnStatus | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.rpc("solar_return_status").maybeSingle<{ plan: string; is_admin: boolean; used: number; sr_limit: number; remaining: number }>();
  if (!data) return null;
  return { plan: data.plan, isAdmin: data.is_admin, used: data.used, limit: data.sr_limit, remaining: data.remaining };
}

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
