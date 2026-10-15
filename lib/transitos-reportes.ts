import { eventSummary } from "@/lib/avisos";
import { birthSummary, chartFromRow, type ChartRow } from "@/lib/charts";
import { describeEvent, formatInstant } from "@/lib/clima/facts";
import { computeClimate, isImportant, type ClimateData, type TransitEvent } from "@/lib/clima/transitos";
import { chartFactsText } from "@/lib/engine/analysis";
import { ASPECT_LABELS, POINT_LABELS } from "@/lib/engine/labels";
import { createClient } from "@/lib/supabase/server";

const DAY = 86_400_000;

/** Hasta cuántos días atrás y adelante se puede abrir el reporte de un evento. */
export const PAST_DAYS = 3;
export const AHEAD_DAYS = 14;

export type TransitReport = { id: string; chart_id: string; event_key: string; event_at: string; title: string; content: string };

/**
 * Identificador de un evento sobre una carta, apto para una dirección: «station.pluto.direct.20742».
 * Acaba en el día (UTC) y no en el minuto: la hora exacta cambia un poco según desde qué día se calcule.
 */
export function eventKey(e: TransitEvent): string {
  const day = Math.floor(e.at / DAY);
  switch (e.kind) {
    case "lunation":
      return `lunation.${e.phase}.${day}`;
    case "station":
      return `station.${e.transit}.${e.direction}.${day}`;
    case "sign":
      return `sign.${e.transit}.${e.sign}.${day}`;
    case "house":
      return `house.${e.transit}.${e.house}.${day}`;
    case "aspect":
      return `aspect.${e.transit}.${e.aspect}.${e.natal}.${day}`;
  }
}

export const eventPath = (chartId: string, e: TransitEvent) => `/transitos/${eventKey(e)}?carta=${chartId}`;

/** Eventos importantes sobre la carta entre `fromMs` y `toMs`, en orden cronológico. */
export function importantEvents(data: ClimateData, fromMs: number, toMs: number): TransitEvent[] {
  return data.events.filter((e) => e.at >= fromMs && e.at <= toMs && isImportant(e));
}

/** El cielo de la carta desde unos días atrás, para cubrir también los eventos recién pasados. */
export function skyForEvents(row: ChartRow, now: Date): ClimateData {
  return computeClimate(chartFromRow(row), new Date(now.getTime() - PAST_DAYS * DAY));
}

/** Busca el evento de una clave, solo si es importante y cae dentro de la ventana permitida. */
export function findEvent(row: ChartRow, key: string, now = new Date()): { event: TransitEvent; data: ClimateData } | null {
  const data = skyForEvents(row, now);
  const cut = key.lastIndexOf(".");
  const prefix = key.slice(0, cut + 1);
  const day = Number(key.slice(cut + 1));
  // Se admite un día de diferencia por si el evento cae justo en el cambio de día.
  const event = importantEvents(data, now.getTime() - PAST_DAYS * DAY, now.getTime() + AHEAD_DAYS * DAY)
    .filter((e) => eventKey(e).startsWith(prefix) && Math.abs(Math.floor(e.at / DAY) - day) <= 1)
    .sort((a, b) => Math.abs(a.at / DAY - day) - Math.abs(b.at / DAY - day))[0];
  return event ? { event, data } : null;
}

const COLUMNS = "id, chart_id, event_key, event_at, title, content";

export async function getReport(chartId: string, key: string): Promise<TransitReport | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.from("transit_reports").select(COLUMNS).eq("chart_id", chartId).eq("event_key", key).maybeSingle();
  return (data as TransitReport | null) ?? null;
}

export async function listReports(chartId: string, limit = 30): Promise<TransitReport[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.from("transit_reports").select(COLUMNS).eq("chart_id", chartId).order("event_at", { ascending: false }).limit(limit);
  return (data as TransitReport[] | null) ?? [];
}

/** Datos que se entregan a la IA: la carta, el evento, lo que lo rodea y los aspectos lentos de fondo. */
export function eventFactsText(row: ChartRow, event: TransitEvent, data: ClimateData): string {
  const chart = chartFromRow(row);
  const lines: string[] = [chartFactsText(chart, row.name, birthSummary(row)), "", "════ EVENTO DEL REPORTE ════"];
  lines.push(`${formatInstant(event.at)} · ${describeEvent(event)}`);
  lines.push(`Titular: ${eventSummary(event)}.`);
  lines.push(data.hasHouses ? "Casas: Placidus, las de la propia carta. «Tu casa N» es la casa natal por la que pasa el tránsito." : "Hora de nacimiento desconocida: no hay casas ni ángulos. No hables de casas, Ascendente ni Medio Cielo.");
  lines.push("Las horas están en UTC.");
  const near = data.events
    .filter((e) => e !== event && Math.abs(e.at - event.at) <= 5 * DAY && (isImportant(e) || e.weight >= 6))
    .sort((a, b) => b.weight - a.weight || a.at - b.at)
    .slice(0, 6)
    .sort((a, b) => a.at - b.at);
  if (near.length) {
    lines.push("", "OTROS EVENTOS CERCANOS (±5 días), para dar contexto sin desviarte del evento principal:");
    for (const e of near) lines.push(`- ${formatInstant(e.at)} · ${describeEvent(e)}`);
  }
  if (data.background.length) {
    lines.push("", "ASPECTOS LENTOS A LA CARTA ACTIVOS ESTOS DÍAS:");
    for (const b of data.background.slice(0, 6)) lines.push(`- ${POINT_LABELS[b.transit]?.name ?? b.transit} en ${ASPECT_LABELS[b.aspect].name.toLowerCase()} a tu ${POINT_LABELS[b.natal]?.name ?? b.natal} natal`);
  }
  return lines.join("\n");
}
