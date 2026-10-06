/**
 * Texto con los datos del clima personal que se entrega a la IA: la carta natal, el cielo al
 * empezar y al acabar el periodo, los aspectos lentos activos, lo que más pesa y el calendario
 * completo. Todo calculado aquí (lib/clima/transitos.ts); la IA solo interpreta, nunca calcula.
 */
import { chartFactsText } from "@/lib/engine/analysis";
import { ASPECT_LABELS, HOUSE_SYSTEM_LABELS, POINT_LABELS, ROMAN, SIGN_NAMES, formatOrb, formatPosition } from "@/lib/engine/labels";
import type { Chart } from "@/lib/engine/types";
import { topEvents, type ClimateData, type TransitEvent } from "./transitos";

const name = (id: string) => POINT_LABELS[id]?.name ?? id;
const natal = (id: string) => `${name(id)} natal`;
const aspectName = (type: keyof typeof ASPECT_LABELS) => ASPECT_LABELS[type].name.toLowerCase();
/** «una conjunción», «un sextil», «una cuadratura», «un trígono», «una oposición». */
const anAspect = (type: keyof typeof ASPECT_LABELS) => `${type === "sextile" || type === "trine" ? "un" : "una"} ${aspectName(type)}`;

const WEEKDAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

/** «2026-10-08 05:17 UTC (jue)» */
export function formatInstant(ms: number) {
  const d = new Date(ms);
  return `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)} UTC (${WEEKDAYS[d.getUTCDay()]})`;
}

const dayCount = (ms: number) => Math.round(ms / 86_400_000);

/** Descripción de un evento, en una línea. */
export function describeEvent(e: TransitEvent): string {
  switch (e.kind) {
    case "aspect": {
      const passes = e.passes > 1 ? ` (paso ${e.pass} de ${e.passes}: el planeta pasa varias veces por este grado)` : "";
      return `${name(e.transit)}${e.retrograde ? " retrógrado" : ""} en ${aspectName(e.aspect)} a tu ${natal(e.natal)}, a ${formatPosition(e.lon)}${passes}`;
    }
    case "house":
      return `${name(e.transit)}${e.retrograde ? " retrógrado" : ""} entra en tu casa ${ROMAN[e.house - 1]}, a ${formatPosition(e.lon)}`;
    case "sign":
      return `${name(e.transit)}${e.retrograde ? " retrógrado" : ""} entra en ${SIGN_NAMES[e.sign]}`;
    case "station": {
      const contact = e.contact ? `; a ${formatOrb(e.contact.orb)} de ${anAspect(e.contact.aspect)} a tu ${natal(e.contact.natal)}` : "";
      return `${name(e.transit)} estaciona ${e.direction === "retrograde" ? "retrógrado" : "directo"} a ${formatPosition(e.lon)}${e.house ? `, en tu casa ${ROMAN[e.house - 1]}` : ""}${contact}`;
    }
    case "lunation": {
      const contacts = e.contacts.length ? `; contactos con tu carta: ${e.contacts.map((c) => `${aspectName(c.aspect)} a tu ${natal(c.natal)} (${formatOrb(c.orb)})`).join(", ")}` : "";
      const eclipse = e.eclipse ? ` (ECLIPSE ${e.eclipse === "partial" ? "parcial" : e.eclipse === "total" ? "total" : e.eclipse === "annular" ? "anular" : "penumbral"})` : "";
      return `${e.phase === "new" ? "Luna nueva" : "Luna llena"}${eclipse} a ${formatPosition(e.lon)}${e.house ? `, en tu casa ${ROMAN[e.house - 1]}` : ""}${contacts}`;
    }
  }
}

/** Datos del clima personal: carta natal + periodo + tránsitos, listos para la IA. */
export function climateFactsText(chart: Chart, chartName: string, birth: string, data: ClimateData): string {
  const lines: string[] = [];
  lines.push(chartFactsText(chart, chartName, birth));
  lines.push("");
  lines.push("════ CLIMA PERSONAL: TRÁNSITOS SOBRE ESTA CARTA ════");

  const days = dayCount(data.endMs - data.startMs);
  lines.push(`Periodo: del ${formatInstant(data.startMs)} al ${formatInstant(data.endMs)} (${days} días).`);
  if (data.endMs > data.requestedEndMs) {
    const extra = dayCount(data.endMs - data.requestedEndMs);
    lines.push(`El periodo base es de 30 días y se ha ampliado ${extra} días para cerrarlo en un evento importante: ${data.extensionEvents.map((e) => `${formatInstant(e.at)} ${describeEvent(e)}`).join("; ")}.`);
  } else {
    lines.push("El periodo es de 30 días.");
  }
  lines.push(
    data.hasHouses
      ? `Casas: ${HOUSE_SYSTEM_LABELS[data.houseSystemUsed as keyof typeof HOUSE_SYSTEM_LABELS] ?? data.houseSystemUsed} (las de la propia carta). «Tu casa N» es la casa natal de esta persona por la que pasa cada tránsito.`
      : "Hora de nacimiento desconocida: no hay casas ni ángulos. No hables de casas, Ascendente ni Medio Cielo; usa solo signos y aspectos.",
  );
  lines.push("Todas las horas están en UTC. Los tránsitos se indican con el cuerpo que se mueve (Sol, Mercurio… Quirón) frente a un punto de la carta natal.");

  const sky = (positions: ClimateData["skyStart"]) => positions.map((p) => `- ${name(p.id)}: ${formatPosition(p.lon)}${p.retrograde ? " (retrógrado)" : ""}${p.house ? `, casa ${ROMAN[p.house - 1]}` : ""}`);
  lines.push("");
  lines.push(`CIELO AL EMPEZAR (${formatInstant(data.startMs)}):`);
  lines.push(...sky(data.skyStart));
  lines.push("");
  lines.push(`CIELO AL ACABAR (${formatInstant(data.endMs)}):`);
  lines.push(...sky(data.skyEnd));

  lines.push("");
  lines.push("ASPECTOS DE LOS PLANETAS LENTOS Y QUIRÓN A LA CARTA, ACTIVOS EN EL PERIODO (orbe al empezar / al acabar):");
  if (!data.background.length) lines.push("- Ninguno dentro de 3°.");
  for (const b of data.background) {
    const trend = Math.abs(b.orbEnd) < Math.abs(b.orbStart) ? "se estrecha" : "se abre";
    lines.push(`- ${name(b.transit)} en ${aspectName(b.aspect)} a tu ${natal(b.natal)}: ${formatOrb(b.orbStart)} / ${formatOrb(b.orbEnd)} (${trend})${b.exactInWindow ? ", exacto dentro del periodo" : ""}`);
  }

  lines.push("");
  lines.push("LO QUE MÁS PESA EN ESTA CARTA (orden orientativo; el hilo del periodo suele estar aquí):");
  topEvents(data.events, 12).forEach((e, i) => lines.push(`${i + 1}. ${formatInstant(e.at)} · ${describeEvent(e)}`));

  lines.push("");
  lines.push("CALENDARIO COMPLETO (orden cronológico):");
  // Si hubiera demasiados eventos, se descartan los de menos peso para no ahogar al modelo.
  const MAX_EVENTS = 110;
  let calendar = data.events;
  if (calendar.length > MAX_EVENTS) {
    const keep = new Set(topEvents(calendar, MAX_EVENTS));
    calendar = calendar.filter((e) => keep.has(e));
  }
  for (const e of calendar) lines.push(`- ${formatInstant(e.at)} · ${describeEvent(e)}`);
  return lines.join("\n");
}
