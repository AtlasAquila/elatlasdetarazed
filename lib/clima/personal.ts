import { createClient } from "@/lib/supabase/server";

/** Climas personales guardados (lectura del usuario; los inserta el servidor al generar la compra). */
export type ClimateRow = {
  id: string;
  chart_id: string;
  starts_at: string;
  ends_at: string;
  requested_ends_at: string;
  content: string;
  created_at: string;
};

export const CLIMATE_COLUMNS = "id, chart_id, starts_at, ends_at, requested_ends_at, content, created_at";

/** Climas de una carta, el más reciente primero. */
export async function listClimates(chartId: string): Promise<ClimateRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.from("monthly_climates").select(CLIMATE_COLUMNS).eq("chart_id", chartId).order("starts_at", { ascending: false });
  return (data as ClimateRow[] | null) ?? [];
}

export async function getClimate(id: string): Promise<ClimateRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.from("monthly_climates").select(CLIMATE_COLUMNS).eq("id", id).maybeSingle();
  return (data as ClimateRow | null) ?? null;
}

/** El clima vigente de la carta (su periodo aún no ha terminado), si lo hay. */
export async function activeClimate(chartId: string): Promise<ClimateRow | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("monthly_climates")
    .select(CLIMATE_COLUMNS)
    .eq("chart_id", chartId)
    .gt("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as ClimateRow | null) ?? null;
}

const dayFmt = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" });
const dayShortFmt = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", timeZone: "Europe/Madrid" });

/** «6 de octubre al 14 de noviembre de 2026» */
export function climatePeriodLabel(c: Pick<ClimateRow, "starts_at" | "ends_at">) {
  const start = new Date(c.starts_at);
  const end = new Date(c.ends_at);
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  return `${sameYear ? dayShortFmt.format(start) : dayFmt.format(start)} al ${dayFmt.format(end)}`;
}
