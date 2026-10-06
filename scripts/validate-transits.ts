/**
 * Calcula el clima personal (tránsitos sobre una carta natal) y lo imprime, para revisarlo o
 * compararlo con otra efeméride.
 *
 * Uso: npx tsx scripts/validate-transits.ts [AAAA-MM-DDTHH:MMZ] [--json] [--facts] [--sin-hora]
 *  - Sin fecha: empieza ahora. La carta de ejemplo es Madrid, 15-03-1990 09:30 (con --sin-hora, sin hora).
 *  - --json: imprime los eventos como JSON (para el comparador con Swiss Ephemeris).
 *  - --facts: imprime el texto de datos que recibe la IA para escribir el clima personal.
 */
import { computeChart } from "../lib/engine";
import { ASPECT_LABELS, POINT_LABELS, ROMAN, SIGN_NAMES, formatPosition } from "../lib/engine/labels";
import { climateFactsText } from "../lib/clima/facts";
import { computeClimate, topEvents, type TransitEvent } from "../lib/clima/transitos";

const args = process.argv.slice(2);
const json = args.includes("--json");
const facts = args.includes("--facts");
const noTime = args.includes("--sin-hora");
const startArg = args.find((a) => !a.startsWith("--"));
const from = startArg ? new Date(startArg) : new Date();

const chart = computeChart({
  year: 1990,
  month: 3,
  day: 15,
  hour: 9,
  minute: 30,
  timeZone: "Europe/Madrid",
  latitude: 40.4168,
  longitude: -3.7038,
  houseSystem: "placidus",
  timeUnknown: noTime,
});

const t0 = Date.now();
const data = computeClimate(chart, from);
const elapsed = Date.now() - t0;

const name = (id: string) => POINT_LABELS[id]?.name ?? id;
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 16) + "Z";

function describe(e: TransitEvent): string {
  switch (e.kind) {
    case "aspect":
      return `${name(e.transit)}${e.retrograde ? " (R)" : ""} ${ASPECT_LABELS[e.aspect].name.toLowerCase()} a ${name(e.natal)} natal, a ${formatPosition(e.lon)}${e.passes > 1 ? ` · paso ${e.pass} de ${e.passes}` : ""}`;
    case "house":
      return `${name(e.transit)}${e.retrograde ? " (R)" : ""} entra en la casa ${ROMAN[e.house - 1]}`;
    case "sign":
      return `${name(e.transit)}${e.retrograde ? " (R)" : ""} entra en ${SIGN_NAMES[e.sign]}`;
    case "station":
      return `${name(e.transit)} estaciona ${e.direction === "retrograde" ? "retrógrado" : "directo"} a ${formatPosition(e.lon)}${e.house ? `, casa ${ROMAN[e.house - 1]}` : ""}${e.contact ? ` (${ASPECT_LABELS[e.contact.aspect].name.toLowerCase()} a ${name(e.contact.natal)} natal, ${e.contact.orb.toFixed(1)}°)` : ""}`;
    case "lunation":
      return `${e.phase === "new" ? "Luna nueva" : "Luna llena"}${e.eclipse ? ` (eclipse ${e.eclipse})` : ""} a ${formatPosition(e.lon)}${e.house ? `, casa ${ROMAN[e.house - 1]}` : ""}${e.contacts.length ? ` · contactos: ${e.contacts.map((c) => `${ASPECT_LABELS[c.aspect].name.toLowerCase()} a ${name(c.natal)} (${c.orb.toFixed(1)}°)`).join(", ")}` : ""}`;
  }
}

if (facts) {
  console.log(climateFactsText(chart, "Carta de ejemplo", "15 de marzo de 1990 · 09:30 · Madrid", data));
} else if (json) {
  console.log(JSON.stringify({ startMs: data.startMs, endMs: data.endMs, requestedEndMs: data.requestedEndMs, events: data.events }, null, 1));
} else {
  console.log(`Ventana: ${iso(data.startMs)} → ${iso(data.endMs)} (base ${iso(data.requestedEndMs)}${data.extensionEvents.length ? `, ampliada por ${data.extensionEvents.length} evento(s)` : ", sin ampliar"}) · calculado en ${elapsed} ms`);
  console.log(`Casas: ${data.hasHouses ? data.houseSystemUsed : "sin hora, no hay casas"}`);
  if (data.extensionEvents.length) for (const e of data.extensionEvents) console.log(`  amplía: ${iso(e.at)} ${describe(e)}`);
  console.log("\nCielo al empezar:");
  for (const s of data.skyStart) console.log(`  ${name(s.id).padEnd(10)} ${formatPosition(s.lon)}${s.retrograde ? " R" : ""}${s.house ? ` · casa ${ROMAN[s.house - 1]}` : ""}`);
  console.log("\nAspectos lentos activos (orbe al empezar / al acabar):");
  for (const b of data.background) console.log(`  ${name(b.transit)} ${ASPECT_LABELS[b.aspect].name.toLowerCase()} a ${name(b.natal)} natal · ${b.orbStart.toFixed(2)}° / ${b.orbEnd.toFixed(2)}°${b.exactInWindow ? " · exacto en la ventana" : ""}`);
  console.log(`\nLo que más pesa:`);
  for (const e of topEvents(data.events, 10)) console.log(`  [${e.weight}] ${iso(e.at)} ${describe(e)}`);
  console.log(`\nTodos los eventos (${data.events.length}):`);
  for (const e of data.events) console.log(`  [${String(e.weight).padStart(2)}] ${iso(e.at)} ${describe(e)}`);
}
