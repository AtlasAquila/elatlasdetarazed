/**
 * Validación del motor astronómico frente a una referencia independiente (Swiss Ephemeris en modo Moshier y
 * la base de husos de Python), generada fuera del repositorio con herramientas/referencia_motor.py.
 * Las tolerancias y los errores máximos medidos están en el README (sección del motor).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as A from "@/lib/engine/vendor/astronomy";
import { __test, angleDiff, computeSolarReturn, houseOf } from "@/lib/engine";
import { localToUtc } from "@/lib/engine/time";
import type { BodyId } from "@/lib/engine/types";

type RefChart = {
  name: string;
  utc: string;
  lat: number;
  lon: number;
  bodies: Record<string, { lon: number; speed: number }>;
  asc: number;
  mc: number;
  placidus: number[] | null;
  porphyry: number[];
  houses: Record<string, number>;
};
type Ref = {
  charts: RefChart[];
  timezones: { zone: string; local: string; utc: string; exists: boolean; repeated: boolean }[];
  solarReturns: { natalSun: number; year: number; birthMonth: number; birthDay: number; returnUtc: string }[];
  sky2026: Record<string, { utc: string; lon: number; phase?: string }[]>;
};

const REF: Ref = JSON.parse(readFileSync(new URL("./fixtures/referencia-swisseph.json", import.meta.url), "utf8"));
const arcsec = (a: number, b: number) => Math.abs(angleDiff(a, b)) * 3600;

/** Tolerancias en segundos de arco. Lilith verdadera y media dependen del modelo lunar (ver README). */
const TOL: Record<string, number> = {
  sun: 20, moon: 30, mercury: 20, venus: 30, mars: 20, jupiter: 20, saturn: 20, uranus: 20, neptune: 20, pluto: 30,
  meanNode: 5, trueNode: 60, meanLilith: 900, trueLilith: 1800,
};
const WORST: Record<string, { err: number; where: string }> = {};
const track = (k: string, err: number, where: string) => {
  if (!WORST[k] || err > WORST[k].err) WORST[k] = { err, where };
};

test("posiciones de Sol, Luna, planetas, nodos y Lilith dentro de tolerancia", () => {
  const fns: Record<string, (t: A.AstroTime) => number> = {
    meanNode: __test.meanNodeLon,
    trueNode: __test.trueNodeLon,
    meanLilith: __test.meanLilithLon,
    trueLilith: __test.trueLilithLon,
  };
  for (const [id, body] of __test.PLANETS) fns[id] = (t) => __test.eclipticLongitude(body, t);
  // Se miden todas las cartas antes de comprobar nada: así el informe de errores máximos cubre siempre las 55,
  // aunque alguna falle (una ejecución que se detenía en el primer fallo dejaba el informe incompleto).
  const failures: string[] = [];
  for (const c of REF.charts) {
    const t = A.MakeTime(new Date(c.utc));
    // Más allá de 2050 manda la extrapolación de ΔT, distinta en cada efeméride (la Luna recorre ~0,5″ por segundo).
    const future = new Date(c.utc).getUTCFullYear() > 2050;
    for (const [id, fn] of Object.entries(fns)) {
      const err = arcsec(fn(t), c.bodies[id].lon);
      track(future ? `${id} >2050` : id, err, c.name);
      const tol = future && id === "moon" ? 90 : TOL[id];
      if (err > tol) failures.push(`${c.name} ${id}: ${err.toFixed(1)}″ > ${tol}″`);
    }
  }
  assert.deepEqual(failures, []);
});

test("dirección del movimiento (retrógrado o directo) igual que la referencia", () => {
  for (const c of REF.charts) {
    const t = A.MakeTime(new Date(c.utc));
    for (const [id, body] of __test.PLANETS) {
      const ref = c.bodies[id].speed;
      if (Math.abs(ref) < 1e-4) continue; // planeta prácticamente estacionario: el signo no es significativo
      const lon = (dt: number) => __test.eclipticLongitude(body, t.AddDays(dt));
      const speed = angleDiff(lon(0.5), lon(-0.5));
      assert.equal(speed < 0, ref < 0, `${c.name} ${id}: velocidad ${speed} frente a ${ref}`);
    }
  }
});

test("Ascendente, Medio Cielo y cúspides Placidus (o Porfirio en latitudes polares)", () => {
  const failures: string[] = [];
  const check = (ok: boolean, msg: string) => {
    if (!ok) failures.push(msg);
  };
  for (const c of REF.charts) {
    const t = A.MakeTime(new Date(c.utc));
    const h = __test.computeHouses(t, c.lat, c.lon, "placidus");
    track("ASC", arcsec(h.asc, c.asc), c.name);
    track("MC", arcsec(h.mc, c.mc), c.name);
    check(arcsec(h.asc, c.asc) < 5, `${c.name} ASC ${h.asc} frente a ${c.asc}`);
    check(arcsec(h.mc, c.mc) < 5, `${c.name} MC`);
    if (c.placidus) {
      check(h.used === "placidus", `${c.name}: el motor cae a ${h.used} y Swiss Ephemeris sí calcula Placidus`);
      h.cusps.forEach((cusp, i) => {
        track("Placidus", arcsec(cusp, c.placidus![i]), `${c.name} casa ${i + 1}`);
        check(arcsec(cusp, c.placidus![i]) < 5, `${c.name} cúspide ${i + 1}: ${cusp} frente a ${c.placidus![i]}`);
      });
    } else {
      check(h.used === "porphyry", `${c.name}: Swiss Ephemeris no puede calcular Placidus y el motor sí`);
      h.cusps.forEach((cusp, i) => {
        track("Porfirio", arcsec(cusp, c.porphyry[i]), `${c.name} casa ${i + 1}`);
        check(arcsec(cusp, c.porphyry[i]) < 5, `${c.name} Porfirio ${i + 1}`);
      });
    }
  }
  assert.deepEqual(failures, []);
});

test("cada planeta cae en la misma casa que en la referencia", () => {
  for (const c of REF.charts) {
    const t = A.MakeTime(new Date(c.utc));
    const h = __test.computeHouses(t, c.lat, c.lon, "placidus");
    const cusps = c.placidus ?? c.porphyry;
    for (const [id, body] of __test.PLANETS) {
      const lon = __test.eclipticLongitude(body, t);
      // A menos de 30″ de una cúspide, la casa depende de la precisión: no se exige.
      const nearCusp = cusps.some((k) => arcsec(lon, k) < 30);
      if (nearCusp) continue;
      assert.equal(houseOf(lon, h.cusps), c.houses[id as BodyId], `${c.name} ${id}`);
    }
  }
});

test("hora local → UTC con la historia de husos horarios (mismo resultado que zoneinfo)", () => {
  for (const z of REF.timezones) {
    const [date, time] = z.local.split(" ");
    const [y, m, d] = date.split("-").map(Number);
    const [hh, mm] = time.split(":").map(Number);
    const r = localToUtc(y, m, d, hh, mm, z.zone);
    // zoneinfo trabaja al segundo (hora media local antes de 1901); el motor, al minuto.
    const diffSec = Math.abs(r.date.getTime() - new Date(z.utc).getTime()) / 1000;
    assert.ok(diffSec < 60, `${z.zone} ${z.local}: motor ${r.date.toISOString()} frente a ${z.utc}`);
    if (!z.exists) assert.ok(r.notes.some((n) => n.includes("no existió")), `${z.zone} ${z.local}: falta la nota de hora inexistente`);
    if (z.repeated) assert.ok(r.notes.some((n) => n.includes("repitió")), `${z.zone} ${z.local}: falta la nota de hora repetida`);
  }
});

test("revolución solar: el instante coincide con Swiss Ephemeris (menos de 1 minuto)", () => {
  for (const s of REF.solarReturns) {
    const sr = computeSolarReturn({ natalSunLongitude: s.natalSun, year: s.year, birthMonth: s.birthMonth, birthDay: s.birthDay, latitude: 40, longitude: -3.7 });
    const diff = Math.abs(new Date(sr.utc).getTime() - new Date(s.returnUtc).getTime()) / 1000;
    assert.ok(diff < 60, `revolución ${s.year}: ${sr.utc} frente a ${s.returnUtc}`);
  }
});

test("informe de errores máximos", () => {
  const rows = Object.entries(WORST).map(([k, v]) => `  ${k.padEnd(11)} ${v.err.toFixed(1).padStart(7)}″  (${v.where})`);
  console.log(`\nError máximo frente a Swiss Ephemeris, ${REF.charts.length} cartas:\n${rows.join("\n")}`);
});
