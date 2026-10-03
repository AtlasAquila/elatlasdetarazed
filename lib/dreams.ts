import { createClient } from "@/lib/supabase/server";

export type DreamRow = {
  id: string;
  dream_date: string; // YYYY-MM-DD
  title: string | null;
  content: string;
  emotions: string[];
  recurring: boolean;
  chart_id: string | null;
  interpretation: string | null;
  summary: string | null;
  symbols: string[];
  interpreted_at: string | null;
  created_at: string;
};

export const DREAM_COLUMNS = "id, dream_date, title, content, emotions, recurring, chart_id, interpretation, summary, symbols, interpreted_at, created_at";

/**
 * El diario de sueños queda fuera del proyecto por ahora (28 sep 2026). Con esto en `false`,
 * las páginas de /suenos devuelven 404, la API no interpreta nada y no se puede crear ni borrar
 * ningún sueño. No se ha borrado código ni datos: para reactivarlo basta con volver a poner `true`.
 */
export const DREAMS_ENABLED = false;

/** Emociones que se pueden marcar al anotar un sueño. */
export const EMOTIONS = ["calma", "alegría", "asombro", "deseo", "nostalgia", "confusión", "tristeza", "miedo", "angustia", "rabia", "culpa", "vergüenza"] as const;

/**
 * Límites del diario. Por ahora iguales para todas las cuentas; cuando se decida el reparto
 * gratuito / Premium, se cambian aquí.
 */
export const DREAM_LIMITS = {
  /** Interpretaciones con IA al mes por cuenta. */
  interpretationsPerMonth: 60,
  /** Sueños que hacen falta para el primer análisis de patrones. */
  minForPatterns: 3,
  /** Sueños anteriores que se dan como memoria a cada interpretación. */
  memoryDreams: 40,
};

export async function listMyDreams(limit = 500): Promise<DreamRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.from("dreams").select(DREAM_COLUMNS).order("dream_date", { ascending: false }).order("created_at", { ascending: false }).limit(limit);
  return (data as DreamRow[] | null) ?? [];
}

export async function getMyDream(id: string): Promise<DreamRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.from("dreams").select(DREAM_COLUMNS).eq("id", id).maybeSingle();
  return (data as DreamRow | null) ?? null;
}

const dateFmt = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
export const formatDreamDate = (iso: string) => dateFmt.format(new Date(iso + "T12:00:00Z"));

/** Título que se muestra: el propio o el principio del texto. */
export function dreamTitle(d: Pick<DreamRow, "title" | "content">) {
  if (d.title) return d.title;
  const t = d.content.replace(/\s+/g, " ").trim();
  return t.length > 60 ? t.slice(0, 60).replace(/\s\S*$/, "") + "…" : t;
}

/** Símbolos más repetidos del diario, de más a menos. */
export function symbolCounts(dreams: Pick<DreamRow, "symbols">[]) {
  const counts = new Map<string, number>();
  for (const d of dreams) for (const s of new Set(d.symbols)) counts.set(s, (counts.get(s) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"));
}

/** Memoria de sueños anteriores en texto, para la IA. */
export function dreamMemoryText(dreams: DreamRow[]) {
  return dreams
    .map((d) => {
      const parts = [`- ${d.dream_date}${d.recurring ? " (recurrente)" : ""}: ${d.summary ?? dreamTitle(d)}`];
      if (d.symbols.length) parts.push(`  símbolos: ${d.symbols.join(", ")}`);
      if (d.emotions.length) parts.push(`  emociones: ${d.emotions.join(", ")}`);
      return parts.join("\n");
    })
    .join("\n");
}

export function todayMadrid() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
