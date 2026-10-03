import { computeChart } from "@/lib/engine";
import type { Chart, HouseSystem } from "@/lib/engine/types";
import { createClient } from "@/lib/supabase/server";

export type ChartRow = {
  id: string;
  name: string;
  birth_date: string; // YYYY-MM-DD
  birth_time: string | null; // HH:MM:SS
  time_unknown: boolean;
  place_name: string;
  latitude: number;
  longitude: number;
  time_zone: string;
  house_system: HouseSystem;
  is_self: boolean;
  created_at: string;
};

export const CHART_COLUMNS = "id, name, birth_date, birth_time, time_unknown, place_name, latitude, longitude, time_zone, house_system, is_self, created_at";

export const FREE_CHART_LIMIT = 3;
export const PREMIUM_CHART_LIMIT = 10;

export async function listMyCharts(): Promise<ChartRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.from("charts").select(CHART_COLUMNS).order("is_self", { ascending: false }).order("created_at");
  return (data as ChartRow[] | null) ?? [];
}

export async function getMyChart(id: string): Promise<ChartRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.from("charts").select(CHART_COLUMNS).eq("id", id).maybeSingle();
  return (data as ChartRow | null) ?? null;
}

/** Calcula la carta a partir de los datos guardados (siempre con la versión actual del motor). */
export function chartFromRow(row: ChartRow, houseSystem?: HouseSystem): Chart {
  const [year, month, day] = row.birth_date.split("-").map(Number);
  const [hour, minute] = (row.birth_time ?? "12:00").split(":").map(Number);
  return computeChart({
    year,
    month,
    day,
    hour,
    minute,
    timeZone: row.time_zone,
    latitude: row.latitude,
    longitude: row.longitude,
    houseSystem: houseSystem ?? row.house_system,
    timeUnknown: row.time_unknown,
  });
}

const dateFmt = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function birthSummary(row: ChartRow) {
  const date = dateFmt.format(new Date(row.birth_date + "T12:00:00Z"));
  const time = row.time_unknown || !row.birth_time ? "hora desconocida" : row.birth_time.slice(0, 5);
  return `${date} · ${time} · ${row.place_name}`;
}
