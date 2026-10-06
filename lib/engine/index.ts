/**
 * Motor de cálculo de Biblioteca Aquila.
 *
 * Posiciones de Sol, Luna y planetas: Astronomy Engine (MIT), posiciones aparentes geocéntricas
 * en la eclíptica verdadera de la fecha (zodiaco tropical).
 * Todo lo demás es propio: casas, ángulos, nodos, Lilith, Quirón (NASA JPL), estrellas fijas y aspectos.
 */

import * as A from "./vendor/astronomy";
import chironData from "./data/chiron.json";
import { FIXED_STARS } from "./stars";
import { localToUtc } from "./time";
import type { Aspect, AspectType, BodyId, BodyPosition, Chart, ChartInput, FixedStarContact, HouseSystem } from "./types";

export const ENGINE_VERSION = 1;

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

export const norm360 = (x: number) => ((x % 360) + 360) % 360;
/** Diferencia angular con signo en (-180, 180]. */
export const angleDiff = (a: number, b: number) => {
  const d = norm360(a - b);
  return d > 180 ? d - 360 : d;
};

// ─────────────────────────────────────────────────────────────
// Planetas

const PLANETS: [BodyId, A.Body][] = [
  ["sun", A.Body.Sun],
  ["moon", A.Body.Moon],
  ["mercury", A.Body.Mercury],
  ["venus", A.Body.Venus],
  ["mars", A.Body.Mars],
  ["jupiter", A.Body.Jupiter],
  ["saturn", A.Body.Saturn],
  ["uranus", A.Body.Uranus],
  ["neptune", A.Body.Neptune],
  ["pluto", A.Body.Pluto],
];

function eclipticLongitude(body: A.Body, time: A.AstroTime) {
  const vec = body === A.Body.Moon ? A.GeoMoon(time) : A.GeoVector(body, time, true);
  return A.Ecliptic(vec).elon;
}

function withSpeed(fn: (t: A.AstroTime) => number, time: A.AstroTime, stepDays: number) {
  const lon = fn(time);
  const before = fn(time.AddDays(-stepDays));
  const after = fn(time.AddDays(stepDays));
  const speed = angleDiff(after, before) / (2 * stepDays);
  return { lon, speed };
}

// ─────────────────────────────────────────────────────────────
// Nodos lunares y Lilith

/** Constante gravitatoria Tierra + Luna en UA³/día². */
const GM_EARTH_MOON = (403503.235502 * 86400 * 86400) / Math.pow(149597870.7, 3);

function moonStateEcliptic(time: A.AstroTime) {
  const s = A.GeoMoonState(time);
  const rot = A.Rotation_EQJ_ECT(time);
  const r = A.RotateVector(rot, new A.Vector(s.x, s.y, s.z, time));
  const v = A.RotateVector(rot, new A.Vector(s.vx, s.vy, s.vz, time));
  return { r: [r.x, r.y, r.z], v: [v.x, v.y, v.z] };
}

const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

function trueNodeLon(time: A.AstroTime) {
  const { r, v } = moonStateEcliptic(time);
  const h = cross(r, v);
  return norm360(Math.atan2(h[0], -h[1]) * RAD);
}

function trueLilithLon(time: A.AstroTime) {
  const { r, v } = moonStateEcliptic(time);
  const h = cross(r, v);
  const vxh = cross(v, h);
  const rn = Math.hypot(r[0], r[1], r[2]);
  const e = [0, 1, 2].map((i) => vxh[i] / GM_EARTH_MOON - r[i] / rn);
  // El apogeo está en la dirección opuesta al perigeo (vector excentricidad).
  return norm360(Math.atan2(-e[1], -e[0]) * RAD);
}

/** Siglos julianos TT desde J2000. */
const centuries = (time: A.AstroTime) => time.tt / 36525;

/** Nutación en longitud (grados): los elementos medios se refieren al equinoccio verdadero de la fecha. */
const nutationLon = (time: A.AstroTime) => A.e_tilt(time).dpsi / 3600;

function meanNodeLon(time: A.AstroTime) {
  const T = centuries(time);
  return norm360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441 - (T * T * T * T) / 60616000 + nutationLon(time));
}

/** Lilith media (apogeo medio de la órbita lunar). Difiere unos minutos de arco de otras efemérides según el modelo lunar. */
function meanLilithLon(time: A.AstroTime) {
  const T = centuries(time);
  const perigee = 83.3532465 + 4069.0137287 * T - 0.01032 * T * T - (T * T * T) / 80053 + (T * T * T * T) / 18999000;
  return norm360(perigee + 180 + nutationLon(time));
}

// ─────────────────────────────────────────────────────────────
// Quirón (NASA JPL Horizons, polinomios de Chebyshev)

type ChironData = { t0: number; seglen: number; scale: number; segs: number[][][] };
const CHIRON = chironData as ChironData;
const LIGHT_DAYS_PER_AU = 1 / 173.1446326846693;

function chebyshev(coeffs: number[], x: number, scale: number) {
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = coeffs.length - 1; i >= 0; i--) {
    b2 = b1;
    b1 = b0;
    b0 = 2 * x * b1 - b2 + coeffs[i] / scale;
  }
  return b0 - x * b1;
}

function chironHelio(ttDays: number): number[] | null {
  const s = Math.floor((ttDays - CHIRON.t0) / CHIRON.seglen);
  if (s < 0 || s >= CHIRON.segs.length) return null;
  const a = CHIRON.t0 + s * CHIRON.seglen;
  const x = ((ttDays - a) / CHIRON.seglen) * 2 - 1;
  return CHIRON.segs[s].map((c) => chebyshev(c, x, CHIRON.scale));
}

/** 1900-01-01 a 2100-12-31 (TT días desde J2000). */
const CHIRON_MIN = -36524;
const CHIRON_MAX = 36890;

function chironLon(time: A.AstroTime): number {
  const earth = A.HelioVector(A.Body.Earth, time);
  let tau = 0;
  let geo = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    const p = chironHelio(time.tt - tau);
    if (!p) return NaN;
    geo = [p[0] - earth.x, p[1] - earth.y, p[2] - earth.z];
    tau = Math.hypot(geo[0], geo[1], geo[2]) * LIGHT_DAYS_PER_AU;
  }
  return A.Ecliptic(new A.Vector(geo[0], geo[1], geo[2], time)).elon;
}

// ─────────────────────────────────────────────────────────────
// Casas

function ascendant(ramc: number, eps: number, lat: number) {
  const r = ramc * DEG;
  const e = eps * DEG;
  const f = lat * DEG;
  return norm360(Math.atan2(Math.cos(r), -(Math.sin(r) * Math.cos(e) + Math.tan(f) * Math.sin(e))) * RAD);
}

function midheaven(ramc: number, eps: number) {
  const r = ramc * DEG;
  return norm360(Math.atan2(Math.sin(r), Math.cos(r) * Math.cos(eps * DEG)) * RAD);
}

/** Ascensión recta → longitud del punto de la eclíptica con esa ascensión recta. */
const raToLon = (ra: number, eps: number) => norm360(Math.atan2(Math.sin(ra * DEG), Math.cos(ra * DEG) * Math.cos(eps * DEG)) * RAD);
const declination = (lon: number, eps: number) => Math.asin(Math.sin(eps * DEG) * Math.sin(lon * DEG)) * RAD;

function porphyry(asc: number, mc: number) {
  const cusps = new Array<number>(12);
  const q1 = norm360(asc - mc); // MC → ASC (casas 10-12)
  const q2 = norm360(mc + 180 - asc); // ASC → IC (casas 1-3)
  cusps[9] = mc;
  cusps[10] = norm360(mc + q1 / 3);
  cusps[11] = norm360(mc + (2 * q1) / 3);
  cusps[0] = asc;
  cusps[1] = norm360(asc + q2 / 3);
  cusps[2] = norm360(asc + (2 * q2) / 3);
  for (let i = 0; i < 6; i++) cusps[i + 6] = norm360(cusps[i] + 180);
  return cusps;
}

/** Placidus. Devuelve null si el cálculo no es posible (latitudes polares). */
function placidus(ramc: number, eps: number, lat: number, asc: number, mc: number): number[] | null {
  const tanPhi = Math.tan(lat * DEG);
  const cusp = (fraction: number, below: boolean) => {
    let lon = below ? norm360(asc + fraction * 90) : norm360(mc + fraction * 90);
    for (let i = 0; i < 50; i++) {
      const x = tanPhi * Math.tan(declination(lon, eps) * DEG);
      if (Math.abs(x) >= 1) return NaN;
      const ad = Math.asin(x) * RAD;
      const sda = 90 + ad;
      const ra = below ? ramc + sda + fraction * (180 - sda) : ramc + fraction * sda;
      const next = raToLon(ra, eps);
      if (Math.abs(angleDiff(next, lon)) < 1e-9) return next;
      lon = next;
    }
    return lon;
  };
  const c11 = cusp(1 / 3, false);
  const c12 = cusp(2 / 3, false);
  const c2 = cusp(1 / 3, true);
  const c3 = cusp(2 / 3, true);
  if ([c11, c12, c2, c3].some((c) => Number.isNaN(c))) return null;
  const cusps = [asc, c2, c3, norm360(mc + 180), 0, 0, 0, 0, 0, mc, c11, c12];
  for (let i = 0; i < 3; i++) cusps[i + 3] = norm360(cusps[i + 9] + 180);
  cusps[4] = norm360(c11 + 180);
  cusps[5] = norm360(c12 + 180);
  cusps[6] = norm360(asc + 180);
  cusps[7] = norm360(c2 + 180);
  cusps[8] = norm360(c3 + 180);
  return cusps;
}

/** Koch (casas del lugar de nacimiento). */
function koch(ramc: number, eps: number, lat: number, asc: number, mc: number): number[] | null {
  const x = Math.tan(lat * DEG) * Math.tan(declination(mc, eps) * DEG);
  if (Math.abs(x) >= 1) return null;
  const ad = Math.asin(x) * RAD;
  // El arco semidiurno del grado del MC se divide en tres (casas 11 y 12); el arco nocturno
  // del grado del IC, que tiene la misma duración, da las casas 2 y 3.
  const oaMc = ramc - ad;
  const sda = 90 + ad;
  const at = (oa: number) => ascendant(oa - 90, eps, lat);
  const c11 = at(oaMc + sda / 3);
  const c12 = at(oaMc + (2 * sda) / 3);
  const c2 = at(ramc + 90 + sda / 3);
  const c3 = at(ramc + 90 + (2 * sda) / 3);
  const cusps = [asc, c2, c3, norm360(mc + 180), norm360(c11 + 180), norm360(c12 + 180), norm360(asc + 180), norm360(c2 + 180), norm360(c3 + 180), mc, c11, c12];
  return cusps;
}

function computeHouses(time: A.AstroTime, lat: number, lon: number, system: HouseSystem) {
  const eps = A.e_tilt(time).tobl;
  const ramc = norm360(A.SiderealTime(time) * 15 + lon);
  const asc = ascendant(ramc, eps, lat);
  const mc = midheaven(ramc, eps);
  let cusps: number[] | null = null;
  let used: HouseSystem | "porphyry" = system;
  if (system === "placidus") cusps = placidus(ramc, eps, lat, asc, mc);
  else if (system === "koch") cusps = koch(ramc, eps, lat, asc, mc);
  else if (system === "equal") cusps = Array.from({ length: 12 }, (_, i) => norm360(asc + 30 * i));
  else cusps = Array.from({ length: 12 }, (_, i) => norm360(Math.floor(asc / 30) * 30 + 30 * i));
  if (!cusps) {
    cusps = porphyry(asc, mc);
    used = "porphyry";
  }
  return { asc, mc, cusps, used };
}

export function houseOf(lon: number, cusps: number[]) {
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end = cusps[(i + 1) % 12];
    const span = norm360(end - start);
    if (norm360(lon - start) < span) return i + 1;
  }
  return 1;
}

// ─────────────────────────────────────────────────────────────
// Aspectos

const ASPECTS: { type: AspectType; angle: number }[] = [
  { type: "conjunction", angle: 0 },
  { type: "sextile", angle: 60 },
  { type: "square", angle: 90 },
  { type: "trine", angle: 120 },
  { type: "opposition", angle: 180 },
];

const BASE_ORB: Record<AspectType, number> = { conjunction: 8, opposition: 8, trine: 7, square: 6, sextile: 4 };
const LUMINARY_BONUS = 2;
const MINOR_POINTS = new Set(["chiron", "meanNode", "trueNode", "meanLilith", "trueLilith"]);

function orbFor(type: AspectType, a: string, b: string) {
  let orb = BASE_ORB[type];
  if (a === "sun" || a === "moon" || b === "sun" || b === "moon") orb += LUMINARY_BONUS;
  if (MINOR_POINTS.has(a) || MINOR_POINTS.has(b)) orb = Math.min(orb, type === "conjunction" || type === "opposition" ? 3 : 2);
  if (a === "asc" || a === "mc" || b === "asc" || b === "mc") orb = Math.min(orb, 5);
  return orb;
}

type AspectPoint = { id: string; lon: number; speed: number };

function findAspects(points: AspectPoint[]): Aspect[] {
  const out: Aspect[] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const p = points[i];
      const q = points[j];
      const sep = Math.abs(angleDiff(p.lon, q.lon));
      for (const asp of ASPECTS) {
        const orb = Math.abs(sep - asp.angle);
        if (orb <= orbFor(asp.type, p.id, q.id)) {
          // ¿Se está formando? Miramos la separación un poco más tarde.
          const dt = 0.01;
          const later = Math.abs(angleDiff(p.lon + p.speed * dt, q.lon + q.speed * dt));
          const applying = p.speed === 0 && q.speed === 0 ? null : Math.abs(later - asp.angle) < orb;
          out.push({ a: p.id, b: q.id, type: asp.type, angle: asp.angle, orb: Math.round(orb * 100) / 100, applying });
          break;
        }
      }
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}

/**
 * Aspectos entre los cuerpos de dos cartas distintas (sinastría): cada punto de `pointsA` contra
 * cada punto de `pointsB`, con las mismas reglas de orbe que `findAspects`. A diferencia de una
 * carta única, aquí sí se incluye la conjunción entre los mismos puntos (p. ej. Sol con Sol).
 */
export function findCrossAspects(pointsA: AspectPoint[], pointsB: AspectPoint[]): Aspect[] {
  const out: Aspect[] = [];
  for (const p of pointsA) {
    for (const q of pointsB) {
      const sep = Math.abs(angleDiff(p.lon, q.lon));
      for (const asp of ASPECTS) {
        const orb = Math.abs(sep - asp.angle);
        if (orb <= orbFor(asp.type, p.id, q.id)) {
          const dt = 0.01;
          const later = Math.abs(angleDiff(p.lon + p.speed * dt, q.lon + q.speed * dt));
          const applying = p.speed === 0 && q.speed === 0 ? null : Math.abs(later - asp.angle) < orb;
          out.push({ a: p.id, b: q.id, type: asp.type, angle: asp.angle, orb: Math.round(orb * 100) / 100, applying });
          break;
        }
      }
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}



function starLongitude(raHours: number, decDeg: number, time: A.AstroTime) {
  const sphere = new A.Spherical(decDeg, raHours * 15, 1);
  const vec = A.VectorFromSphere(sphere, time);
  return A.Ecliptic(vec).elon;
}

export function fixedStarLongitudes(date: Date) {
  const time = A.MakeTime(date);
  return FIXED_STARS.map((s) => ({ ...s, longitude: starLongitude(s.ra, s.dec, time) }));
}

// ─────────────────────────────────────────────────────────────
// Carta completa

type ChartCoreOptions = {
  latitude: number;
  longitude: number;
  houseSystem: HouseSystem;
  timeUnknown?: boolean;
  notes?: string[];
};

/**
 * Núcleo compartido: a partir de un instante UTC ya resuelto y un lugar, calcula cuerpos,
 * ángulos, casas, aspectos y estrellas fijas. Lo usan tanto `computeChart` (carta natal, que
 * primero resuelve el instante a partir de fecha/hora/zona horaria civiles) como
 * `computeSolarReturn` (que ya parte de un instante UTC exacto).
 */
function computeChartCore(time: A.AstroTime, dateForStars: Date, opts: ChartCoreOptions) {
  const notes = [...(opts.notes ?? [])];
  const timeUnknown = opts.timeUnknown ?? false;
  if (timeUnknown) notes.push("Sin hora de nacimiento: posiciones calculadas a mediodía; no se muestran casas ni ángulos, y la Luna puede variar unos 6°.");

  const raw: { id: BodyId; lon: number; speed: number }[] = [];
  for (const [id, body] of PLANETS) {
    const step = id === "moon" ? 0.05 : 0.5;
    const { lon, speed } = withSpeed((t) => eclipticLongitude(body, t), time, step);
    raw.push({ id, lon, speed });
  }
  if (time.tt >= CHIRON_MIN && time.tt <= CHIRON_MAX) {
    const { lon, speed } = withSpeed(chironLon, time, 0.5);
    if (!Number.isNaN(lon)) raw.push({ id: "chiron", lon, speed });
  } else {
    notes.push("Quirón solo se calcula para nacimientos entre 1900 y 2100.");
  }
  raw.push({ id: "meanNode", ...withSpeed(meanNodeLon, time, 0.5) });
  raw.push({ id: "trueNode", ...withSpeed(trueNodeLon, time, 0.05) });
  raw.push({ id: "meanLilith", ...withSpeed(meanLilithLon, time, 0.5) });
  raw.push({ id: "trueLilith", ...withSpeed(trueLilithLon, time, 0.05) });

  let houses: Chart["houses"] = null;
  let angles: Chart["angles"] = null;
  if (!timeUnknown) {
    const h = computeHouses(time, opts.latitude, opts.longitude, opts.houseSystem);
    houses = { system: opts.houseSystem, systemUsed: h.used, cusps: h.cusps };
    angles = { asc: h.asc, mc: h.mc, dsc: norm360(h.asc + 180), ic: norm360(h.mc + 180) };
    if (h.used !== opts.houseSystem) notes.push("En latitudes polares este sistema de casas no puede calcularse; se usa Porfirio.");
  }

  const bodies: BodyPosition[] = raw.map((b) => ({
    id: b.id,
    longitude: b.lon,
    speed: b.speed,
    // Los nodos y Lilith no se marcan como retrógrados: su movimiento es de otra naturaleza.
    retrograde: b.speed < 0 && !b.id.endsWith("Node") && !b.id.endsWith("Lilith"),
    sign: Math.floor(b.lon / 30),
    degreeInSign: b.lon % 30,
    house: houses ? houseOf(b.lon, houses.cusps) : null,
  }));

  // Se calculan todos; la página decide cuáles mostrar según las opciones elegidas.
  const aspectPoints: AspectPoint[] = raw.map((b) => ({ id: b.id, lon: b.lon, speed: b.speed }));
  if (angles) {
    aspectPoints.push({ id: "asc", lon: angles.asc, speed: 0 }, { id: "mc", lon: angles.mc, speed: 0 });
  }
  const aspects = findAspects(aspectPoints);

  const stars = fixedStarLongitudes(dateForStars);
  const contactPoints: { id: string; lon: number }[] = raw.filter((b) => !b.id.endsWith("Node") && !b.id.endsWith("Lilith")).map((b) => ({ id: b.id, lon: b.lon }));
  if (angles) contactPoints.push({ id: "asc", lon: angles.asc }, { id: "mc", lon: angles.mc }, { id: "dsc", lon: angles.dsc }, { id: "ic", lon: angles.ic });
  const fixedStars: FixedStarContact[] = [];
  for (const s of stars) {
    for (const p of contactPoints) {
      const orb = Math.abs(angleDiff(s.longitude, p.lon));
      if (orb <= 1) fixedStars.push({ star: s.name, starLongitude: s.longitude, point: p.id, orb: Math.round(orb * 100) / 100 });
    }
  }

  return { notes, bodies, angles, houses, aspects, fixedStars: fixedStars.sort((a, b) => a.orb - b.orb) };
}

export function computeChart(input: ChartInput): Chart {
  const system = input.houseSystem ?? "placidus";
  const utc = localToUtc(input.year, input.month, input.day, input.timeUnknown ? 12 : input.hour, input.timeUnknown ? 0 : input.minute, input.timeZone);
  const time = A.MakeTime(utc.date);
  const core = computeChartCore(time, utc.date, { latitude: input.latitude, longitude: input.longitude, houseSystem: system, timeUnknown: input.timeUnknown, notes: utc.notes });

  return {
    engine: { name: "biblioteca-aquila", version: ENGINE_VERSION },
    input: { ...input, houseSystem: system },
    utc: utc.date.toISOString(),
    julianDayUT: time.ut + 2451545,
    timeNotes: core.notes,
    bodies: core.bodies,
    angles: core.angles,
    houses: core.houses,
    aspects: core.aspects,
    fixedStars: core.fixedStars,
  };
}

// ─────────────────────────────────────────────────────────────
// Revolución solar

export type SolarReturnInput = {
  /** Longitud eclíptica exacta del Sol natal (chart.bodies natal, id "sun"). */
  natalSunLongitude: number;
  /** Año en que cae el cumpleaños que se quiere calcular. */
  year: number;
  /** Mes y día de nacimiento (calendario civil del lugar de nacimiento): el cumpleaños de ese año. */
  birthMonth: number;
  birthDay: number;
  /** Lugar donde se calcula la revolución (puede no ser el lugar de nacimiento). */
  latitude: number;
  longitude: number;
  houseSystem?: HouseSystem;
};

/**
 * Instante UTC exacto en que el Sol tránsito vuelve a la longitud eclíptica del Sol natal,
 * dentro del año dado. Se parte del cumpleaños civil como estimación inicial y se afina por
 * iteración de Newton con la velocidad real del Sol (converge en pocas iteraciones a precisión
 * de segundos, ya que el movimiento del Sol es casi uniforme).
 */
function findSolarReturnTime(natalSunLongitude: number, year: number, birthMonth: number, birthDay: number): A.AstroTime {
  let time = A.MakeTime(new Date(Date.UTC(year, birthMonth - 1, birthDay, 12, 0, 0)));
  for (let i = 0; i < 8; i++) {
    const { lon, speed } = withSpeed((t) => eclipticLongitude(A.Body.Sun, t), time, 0.1);
    const diff = angleDiff(natalSunLongitude, lon);
    if (Math.abs(diff) < 1e-8) break;
    time = time.AddDays(diff / speed);
  }
  return time;
}

export function computeSolarReturn(input: SolarReturnInput): Chart {
  const system = input.houseSystem ?? "placidus";
  const time = findSolarReturnTime(input.natalSunLongitude, input.year, input.birthMonth, input.birthDay);
  const date = time.date;
  const core = computeChartCore(time, date, { latitude: input.latitude, longitude: input.longitude, houseSystem: system });

  return {
    engine: { name: "biblioteca-aquila", version: ENGINE_VERSION },
    input: {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
      timeZone: "UTC",
      latitude: input.latitude,
      longitude: input.longitude,
      houseSystem: system,
    },
    utc: date.toISOString(),
    julianDayUT: time.ut + 2451545,
    timeNotes: core.notes,
    bodies: core.bodies,
    angles: core.angles,
    houses: core.houses,
    aspects: core.aspects,
    fixedStars: core.fixedStars,
  };
}

/**
 * Longitud eclíptica (°) de un cuerpo en un instante, sin casas ni aspectos. NaN si no se puede
 * calcular (Quirón fuera de 1900-2100). La usa el motor de tránsitos (`lib/clima`); no cambia
 * ningún cálculo de las cartas.
 */
export function bodyLongitude(id: BodyId, date: Date): number {
  const time = A.MakeTime(date);
  const planet = PLANETS.find(([pid]) => pid === id);
  if (planet) return eclipticLongitude(planet[1], time);
  if (id === "chiron") return time.tt >= CHIRON_MIN && time.tt <= CHIRON_MAX ? chironLon(time) : NaN;
  if (id === "meanNode") return meanNodeLon(time);
  if (id === "trueNode") return trueNodeLon(time);
  if (id === "meanLilith") return meanLilithLon(time);
  if (id === "trueLilith") return trueLilithLon(time);
  return NaN;
}

// Solo para pruebas.
export const __test ={ computeHouses, chironLon, meanNodeLon, trueNodeLon, meanLilithLon, trueLilithLon, eclipticLongitude, PLANETS };

/** Tiempo sidéreo local (horas) para un instante UTC y una longitud geográfica (este positivo). */
export function localSiderealTime(utcIso: string, longitude: number) {
  const gast = A.SiderealTime(new Date(utcIso));
  return (((gast + longitude / 15) % 24) + 24) % 24;
}
