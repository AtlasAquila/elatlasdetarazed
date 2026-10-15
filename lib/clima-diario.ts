import { createClient } from "@/lib/supabase/server";

export type ClimaDia = {
  day: string;
  icon: string;
  headline: string;
  tags: string[];
  body: string;
  closing: string;
};

const COLUMNS = "day, icon, headline, tags, body, closing";
const madridDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" });
const dayFormat = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** El día de hoy en Madrid, como AAAA-MM-DD. */
export const todayInMadrid = (now = new Date()) => madridDay.format(now);

/** «jueves 15 de octubre de 2026» con la inicial en mayúscula. */
export function climaDayLabel(day: string) {
  const text = dayFormat.format(new Date(day + "T12:00:00Z"));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Las lecturas ya llegadas (la de hoy y las anteriores), de la más reciente a la más antigua. */
export async function getRecentClimaDiario(limit = 15): Promise<ClimaDia[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.from("clima_diario").select(COLUMNS).lte("day", todayInMadrid()).order("day", { ascending: false }).limit(limit);
  return (data as ClimaDia[] | null) ?? [];
}
