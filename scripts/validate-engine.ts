/**
 * Validación del motor de Biblioteca Aquila frente a valores de referencia.
 *
 * Uso: npx tsx scripts/validate-engine.ts reference.json [chiron-apparent.json]
 *  - reference.json: posiciones calculadas con Swiss Ephemeris (solo como referencia externa de pruebas).
 *  - chiron-apparent.json: longitudes aparentes de Quirón de NASA JPL Horizons.
 */
import { readFileSync } from "node:fs";
import * as A from "../lib/engine/vendor/astronomy";
import { __test, angleDiff, computeChart, fixedStarLongitudes } from "../lib/engine";
import { localToUtc } from "../lib/engine/time";

const arcsec = (a: number, b: number) => Math.abs(angleDiff(a, b)) * 3600;
const refPath = process.argv[2];
const chironPath = process.argv[3];

type Ref = {
  name: string;
  utc: [number, number, number, number];
  lat: number;
  lon: number;
  bodies: Record<string, { lon: number; speed: number }>;
  houses_P: number[];
  houses_K: number[];
  houses_E: number[];
  houses_W: number[];
  asc: number;
  mc: number;
};

const worst: Record<string, { err: number; where: string }> = {};
const track = (key: string, err: number, where: string) => {
  if (!worst[key] || err > worst[key].err) worst[key] = { err, where };
};

if (refPath) {
  const refs: Ref[] = JSON.parse(readFileSync(refPath, "utf8"));
  for (const r of refs) {
    const [y, m, d, h] = r.utc;
    const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0) + h * 3600_000);
    const t = A.MakeTime(date);
    for (const [id, body] of __test.PLANETS) track(id, arcsec(__test.eclipticLongitude(body, t), r.bodies[id].lon), r.name);
    track("meanNode", arcsec(__test.meanNodeLon(t), r.bodies.meanNode.lon), r.name);
    track("trueNode", arcsec(__test.trueNodeLon(t), r.bodies.trueNode.lon), r.name);
    track("meanLilith", arcsec(__test.meanLilithLon(t), r.bodies.meanLilith.lon), r.name);
    track("trueLilith", arcsec(__test.trueLilithLon(t), r.bodies.trueLilith.lon), r.name);
    const systems: [string, "placidus" | "koch" | "equal" | "whole"][] = [
      ["P", "placidus"],
      ["K", "koch"],
      ["E", "equal"],
      ["W", "whole"],
    ];
    for (const [code, sys] of systems) {
      const hs = __test.computeHouses(t, r.lat, r.lon, sys);
      const ref = r[`houses_${code}` as "houses_P"];
      if (hs.used !== sys) {
        console.log(`  ${r.name} ${sys}: usado ${hs.used}`);
        continue;
      }
      hs.cusps.forEach((c, i) => track(`casas ${sys}`, arcsec(c, ref[i]), `${r.name} casa ${i + 1}`));
      track("ASC", arcsec(hs.asc, r.asc), r.name);
      track("MC", arcsec(hs.mc, r.mc), r.name);
    }
  }
}

if (chironPath) {
  const c = JSON.parse(readFileSync(chironPath, "utf8")) as { jd0: number; step: number; scale: number; lon: number[] };
  for (let i = 0; i < c.lon.length; i += 7) {
    const jd = c.jd0 + i * c.step;
    const date = new Date((jd - 2440587.5) * 86400_000);
    const lon = __test.chironLon(A.MakeTime(date));
    if (Number.isNaN(lon)) continue;
    track("chiron (NASA)", arcsec(lon, c.lon[i] / c.scale), new Date(date).toISOString().slice(0, 10));
  }
}

console.log("\nError máximo por elemento (segundos de arco):");
for (const [k, v] of Object.entries(worst)) console.log(`  ${k.padEnd(16)} ${v.err.toFixed(1).padStart(8)}″   (${v.where})`);

console.log("\nHusos horarios:");
const tz = (label: string, ...args: Parameters<typeof localToUtc>) => {
  const r = localToUtc(...args);
  console.log(`  ${label.padEnd(34)} UTC ${r.date.toISOString()}  desfase ${r.offsetMinutes} min ${r.notes.length ? "· " + r.notes.join(" ") : ""}`);
};
tz("Madrid 1942-06-01 12:00", 1942, 6, 1, 12, 0, "Europe/Madrid");
tz("Madrid 1975-01-01 12:00", 1975, 1, 1, 12, 0, "Europe/Madrid");
tz("Madrid 1930-07-01 12:00", 1930, 7, 1, 12, 0, "Europe/Madrid");
tz("Madrid 2024-03-31 02:30 (salto)", 2024, 3, 31, 2, 30, "Europe/Madrid");
tz("Madrid 2024-10-27 02:30 (repetida)", 2024, 10, 27, 2, 30, "Europe/Madrid");
tz("Canarias 1990-07-01 12:00", 1990, 7, 1, 12, 0, "Atlantic/Canary");
tz("Buenos Aires 2001-09-11 09:46", 2001, 9, 11, 9, 46, "America/Argentina/Buenos_Aires");
tz("México 1975-11-20 17:15", 1975, 11, 20, 17, 15, "America/Mexico_City");

console.log("\nEstrellas fijas en 2000 (longitud tropical):");
for (const s of fixedStarLongitudes(new Date(Date.UTC(2000, 0, 1, 12)))) {
  const sign = ["Ari", "Tau", "Gem", "Can", "Leo", "Vir", "Lib", "Sco", "Sag", "Cap", "Aqu", "Pis"][Math.floor(s.longitude / 30)];
  const deg = s.longitude % 30;
  console.log(`  ${s.name.padEnd(20)} ${Math.floor(deg)}°${String(Math.round((deg % 1) * 60)).padStart(2, "0")}′ ${sign}`);
}

console.log("\nCarta completa de ejemplo (Madrid, 15-03-1990 09:30):");
const chart = computeChart({ year: 1990, month: 3, day: 15, hour: 9, minute: 30, timeZone: "Europe/Madrid", latitude: 40.4168, longitude: -3.7038 });
console.log(`  UTC ${chart.utc} · ${chart.bodies.length} cuerpos · ${chart.aspects.length} aspectos · estrellas: ${chart.fixedStars.map((f) => `${f.star}-${f.point}`).join(", ") || "ninguna"}`);
console.log(`  ASC ${chart.angles?.asc.toFixed(3)} MC ${chart.angles?.mc.toFixed(3)} · notas: ${chart.timeNotes.join(" ") || "—"}`);
