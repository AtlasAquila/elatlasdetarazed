import { ASPECT_LABELS, POINT_LABELS, ROMAN, SIGN_NAMES } from "@/lib/engine/labels";
import type { Chart } from "@/lib/engine/types";
import { computeClimate, isImportant, type TransitEvent } from "@/lib/clima/transitos";
import type { PushMessage } from "@/lib/push";

/** Las tareas diarias se encadenan sin huecos: cada una mira las siguientes 24 horas. */
const ALERT_WINDOW_MS = 24 * 3_600_000;

const name = (id: string) => POINT_LABELS[id]?.name ?? id;
const madridDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" });

/** El evento importante más pesado de las próximas 24 h sobre la carta, y cuántos más hay. */
export function upcomingEvent(chart: Chart, now: Date): { event: TransitEvent; others: number } | null {
  const from = now.getTime();
  const inWindow = computeClimate(chart, now).events.filter((e) => e.at >= from && e.at < from + ALERT_WINDOW_MS && isImportant(e));
  if (inWindow.length === 0) return null;
  const [event] = [...inWindow].sort((a, b) => b.weight - a.weight || a.at - b.at);
  return { event, others: inWindow.length - 1 };
}

const house = (h: number | null) => (h ? `, en tu casa ${ROMAN[h - 1]}` : "");

function summary(e: TransitEvent): string {
  switch (e.kind) {
    case "lunation": {
      const sign = SIGN_NAMES[Math.floor(e.lon / 30) % 12];
      const label = e.eclipse ? `Eclipse ${e.phase === "new" ? "solar" : "lunar"}` : e.phase === "new" ? "Luna nueva" : "Luna llena";
      return `${label} en ${sign}${house(e.house)}`;
    }
    case "station":
      return `${name(e.transit)} se detiene y pasa a ser ${e.direction === "retrograde" ? "retrógrado" : "directo"}${house(e.house)}`;
    case "sign":
      return `${name(e.transit)} entra en ${SIGN_NAMES[e.sign]}`;
    case "house":
      return `${name(e.transit)} entra en tu casa ${ROMAN[e.house - 1]}`;
    case "aspect":
      return `${name(e.transit)} en ${ASPECT_LABELS[e.aspect].name.toLowerCase()} con tu ${name(e.natal)} natal`;
  }
}

export function alertMessage(found: { event: TransitEvent; others: number }, now: Date): PushMessage {
  const today = madridDay.format(now) === madridDay.format(new Date(found.event.at));
  const more = found.others > 0 ? ` · y ${found.others} más` : "";
  return { title: today ? "Tu cielo, hoy" : "Tu cielo, mañana", body: `${summary(found.event)}${more}`, url: "/carta" };
}
