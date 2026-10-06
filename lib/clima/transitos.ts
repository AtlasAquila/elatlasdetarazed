/**
 * Tránsitos personales: el cielo de una ventana de días colocado sobre una carta natal.
 *
 * Busca (por bisección, al minuto) los ingresos de los planetas en las casas y los signos, sus
 * aspectos exactos a la carta natal, las estaciones y las lunaciones, y pesa cada evento.
 * Las casas son las de la propia carta (Placidus). No interpreta nada: solo calcula y ordena;
 * la lectura la escribe la IA con estos datos (ver lib/clima/facts.ts).
 *
 * La ventana es de 30 días desde el instante en que se pide, con un margen de hasta 10 días más
 * si justo después cae un evento importante (ver `isImportant`): una lunación, una estación, el
 * ingreso de un planeta lento en un signo o una casa, o un aspecto fuerte a un punto clave de la
 * carta. Se amplía hasta cubrir el primero que caiga en el margen y los que le sigan casi pegados.
 */
import { angleDiff, bodyLongitude, houseOf, norm360 } from "@/lib/engine";
import { eclipsesBetween, lunationsBetween, type EclipseKind } from "@/lib/engine/events";
import type { AspectType, BodyId, Chart } from "@/lib/engine/types";

const DAY = 86_400_000;
/** Paso de la rejilla de búsqueda: 12 h basta para que ningún cruce quede entre dos muestras. */
const STEP = DAY / 2;
/** Mitad del paso con el que se estima la velocidad (en días). */
const SPEED_HALF_STEP = 0.1;

export const BASE_DAYS = 30;
export const MARGIN_DAYS = 10;
/** Un evento importante a menos de estos días del último que ya amplió la ventana también la amplía. */
const EXTENSION_GAP_DAYS = 2;
/** Peso de un aspecto a partir del cual cuenta como importante (p. ej. Saturno conjunción al Sol natal). */
const IMPORTANT_ASPECT_WEIGHT = 9;

export type TransitBody = "sun" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "chiron";

export const TRANSIT_BODIES: TransitBody[] = ["sun", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "chiron"];

/** Planetas lentos: sus tránsitos marcan etapas, no días. */
const SLOW = new Set<TransitBody>(["jupiter", "saturn", "uranus", "neptune", "pluto"]);

const ASPECT_DEFS: { type: AspectType; angle: number }[] = [
  { type: "conjunction", angle: 0 },
  { type: "sextile", angle: 60 },
  { type: "square", angle: 90 },
  { type: "trine", angle: 120 },
  { type: "opposition", angle: 180 },
];

// ─────────────────────────────────────────────────────────────
// Tipos

export type NatalPoint = { id: string; lon: number };

export type Contact = { natal: string; aspect: AspectType; orb: number };

type Base = { at: number; weight: number };
export type AspectEvent = Base & {
  kind: "aspect";
  transit: TransitBody;
  natal: string;
  aspect: AspectType;
  lon: number;
  retrograde: boolean;
  /** Número de paso por este aspecto en la ventana (un planeta retrógrado puede pasar hasta tres veces). */
  pass: number;
  passes: number;
};
export type HouseEvent = Base & { kind: "house"; transit: TransitBody; house: number; lon: number; retrograde: boolean };
export type SignEvent = Base & { kind: "sign"; transit: TransitBody; sign: number; retrograde: boolean };
export type StationEvent = Base & {
  kind: "station";
  transit: TransitBody;
  direction: "retrograde" | "direct";
  lon: number;
  house: number | null;
  /** Punto natal más cercano (aspecto duro con orbe de hasta 2°), si lo hay. */
  contact: Contact | null;
};
export type LunationEvent = Base & {
  kind: "lunation";
  phase: "new" | "full";
  lon: number;
  house: number | null;
  eclipse: EclipseKind | null;
  /** Contactos con la carta natal (conjunción, oposición o cuadratura a menos de 3°). */
  contacts: Contact[];
};
export type TransitEvent = AspectEvent | HouseEvent | SignEvent | StationEvent | LunationEvent;

export type SkyPosition = { id: TransitBody; lon: number; retrograde: boolean; house: number | null };

/** Aspecto lento (o de Quirón) a la carta natal que está activo al principio o al final de la ventana. */
export type BackgroundAspect = {
  transit: TransitBody;
  natal: string;
  aspect: AspectType;
  orbStart: number;
  orbEnd: number;
  exactInWindow: boolean;
};

export type ClimateData = {
  startMs: number;
  endMs: number;
  /** Fin de los 30 días base, antes de ampliar la ventana. */
  requestedEndMs: number;
  /** Eventos importantes que han ampliado la ventana (vacío si no se amplió). */
  extensionEvents: TransitEvent[];
  hasHouses: boolean;
  houseSystemUsed: string | null;
  skyStart: SkyPosition[];
  skyEnd: SkyPosition[];
  background: BackgroundAspect[];
  /** Todos los eventos de la ventana, en orden cronológico. */
  events: TransitEvent[];
};

// ─────────────────────────────────────────────────────────────
// Pesos

const NATAL_WEIGHT: Record<string, number> = { sun: 3, moon: 3, asc: 3, mc: 3, mercury: 2, venus: 2, mars: 2, jupiter: 1, saturn: 1, uranus: 1, neptune: 1, pluto: 1, chiron: 1 };
const TRANSIT_WEIGHT: Record<TransitBody, number> = { sun: 1, mercury: 0, venus: 1, mars: 1, jupiter: 3, saturn: 3, uranus: 3, neptune: 3, pluto: 3, chiron: 2 };
const ASPECT_WEIGHT: Record<AspectType, number> = { conjunction: 3, opposition: 3, square: 3, trine: 2, sextile: 1 };

function houseWeight(body: TransitBody) {
  if (SLOW.has(body)) return 8;
  return { chiron: 6, sun: 5, mars: 4, venus: 4, mercury: 3 }[body as "chiron" | "sun" | "mars" | "venus" | "mercury"];
}

function signWeight(body: TransitBody) {
  if (SLOW.has(body)) return 8;
  return { chiron: 6, mars: 4, venus: 4, mercury: 4, sun: 3 }[body as "chiron" | "mars" | "venus" | "mercury" | "sun"];
}

/**
 * ¿Es lo bastante importante para ampliar la ventana de 30 días? Las lunaciones y las estaciones
 * siempre; los ingresos solo de planetas lentos; los aspectos, solo los de mucho peso.
 */
export function isImportant(e: TransitEvent): boolean {
  switch (e.kind) {
    case "lunation":
    case "station":
      return true;
    case "sign":
    case "house":
      return SLOW.has(e.transit);
    case "aspect":
      return e.weight >= IMPORTANT_ASPECT_WEIGHT;
  }
}

/** Asigna los pasos de cada aspecto y el peso de cada evento. */
function finalize(events: TransitEvent[]): TransitEvent[] {
  const groups = new Map<string, AspectEvent[]>();
  for (const e of events) {
    if (e.kind !== "aspect") continue;
    const key = `${e.transit}|${e.natal}|${e.aspect}`;
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => a.at - b.at);
    list.forEach((e, i) => {
      e.pass = i + 1;
      e.passes = list.length;
    });
  }
  for (const e of events) {
    switch (e.kind) {
      case "aspect":
        e.weight = ASPECT_WEIGHT[e.aspect] + TRANSIT_WEIGHT[e.transit] + (NATAL_WEIGHT[e.natal] ?? 1) + (e.retrograde ? 1 : 0) + (e.passes > 1 ? 1 : 0);
        break;
      case "house":
        e.weight = houseWeight(e.transit);
        break;
      case "sign":
        e.weight = signWeight(e.transit);
        break;
      case "station":
        e.weight = 8 + (e.contact ? 2 : 0);
        break;
      case "lunation":
        e.weight = 8 + (e.eclipse ? 3 : 0) + (e.contacts.length ? 2 : 0);
        break;
    }
  }
  return events.sort((a, b) => a.at - b.at);
}

// ─────────────────────────────────────────────────────────────
// Utilidades de cálculo

const lonAt = (id: BodyId, ms: number) => bodyLongitude(id, new Date(ms));

/** Velocidad en grados por día (negativa = retrógrado). */
function speedAt(id: BodyId, ms: number) {
  const h = SPEED_HALF_STEP * DAY;
  return angleDiff(lonAt(id, ms + h), lonAt(id, ms - h)) / (2 * SPEED_HALF_STEP);
}

function grid(start: number, end: number) {
  const n = Math.max(1, Math.ceil((end - start) / STEP));
  return Array.from({ length: n + 1 }, (_, i) => start + ((end - start) * i) / n);
}

/** Instante (ms) en que `f` cambia de signo entre a y b, con precisión de 30 s. */
function bisect(f: (ms: number) => number, a: number, b: number) {
  let fa = f(a);
  for (let i = 0; i < 40 && b - a > 30_000; i++) {
    const m = (a + b) / 2;
    const fm = f(m);
    if (fm < 0 === fa < 0) {
      a = m;
      fa = fm;
    } else {
      b = m;
    }
  }
  return (a + b) / 2;
}

const targetsOf = (angle: number) => (angle === 0 || angle === 180 ? [angle] : [angle, 360 - angle]);
const signOf = (lon: number) => Math.floor(norm360(lon) / 30) % 12;

/** Puntos de la carta natal con los que se cruzan los tránsitos: planetas, Quirón y, si hay hora, AC y MC. */
export function natalPoints(chart: Chart): NatalPoint[] {
  const ids: BodyId[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "chiron"];
  const points: NatalPoint[] = chart.bodies.filter((b) => ids.includes(b.id)).map((b) => ({ id: b.id, lon: b.longitude }));
  if (chart.angles) points.push({ id: "asc", lon: chart.angles.asc }, { id: "mc", lon: chart.angles.mc });
  return points;
}

/** Aspectos (los de `types`) de un punto del cielo a la carta natal con orbe de hasta `maxOrb`. */
function contactsOf(lon: number, natal: NatalPoint[], maxOrb: number, types: AspectType[]): Contact[] {
  const out: Contact[] = [];
  for (const p of natal) {
    const sep = Math.abs(angleDiff(lon, p.lon));
    for (const def of ASPECT_DEFS) {
      if (!types.includes(def.type)) continue;
      const orb = Math.abs(sep - def.angle);
      if (orb <= maxOrb) out.push({ natal: p.id, aspect: def.type, orb });
    }
  }
  return out.sort((a, b) => a.orb - b.orb);
}

// ─────────────────────────────────────────────────────────────
// Búsqueda de eventos

function scanEvents(chart: Chart, start: number, end: number): TransitEvent[] {
  const natal = natalPoints(chart);
  const cusps = chart.houses?.cusps ?? null;
  const times = grid(start, end);
  const events: TransitEvent[] = [];

  for (const body of TRANSIT_BODIES) {
    const lons = times.map((t) => lonAt(body, t));
    if (lons.some((l) => Number.isNaN(l))) continue; // Quirón solo se calcula entre 1900 y 2100

    // Aspectos exactos a la carta natal.
    for (const np of natal) {
      for (const def of ASPECT_DEFS) {
        for (const target of targetsOf(def.angle)) {
          const dist = (lon: number) => angleDiff(norm360(lon - np.lon), target);
          const vals = lons.map(dist);
          for (let i = 0; i < times.length - 1; i++) {
            if (vals[i] < 0 !== vals[i + 1] < 0 && Math.abs(vals[i]) < 30 && Math.abs(vals[i + 1]) < 30) {
              const at = bisect((t) => dist(lonAt(body, t)), times[i], times[i + 1]);
              events.push({ kind: "aspect", at, weight: 0, transit: body, natal: np.id, aspect: def.type, lon: lonAt(body, at), retrograde: speedAt(body, at) < 0, pass: 1, passes: 1 });
            }
          }
        }
      }
    }

    // Estaciones.
    if (body !== "sun") {
      const speeds = times.map((t) => speedAt(body, t));
      for (let i = 0; i < times.length - 1; i++) {
        if (speeds[i] < 0 !== speeds[i + 1] < 0) {
          const at = bisect((t) => speedAt(body, t), times[i], times[i + 1]);
          const lon = lonAt(body, at);
          events.push({
            kind: "station",
            at,
            weight: 0,
            transit: body,
            direction: speeds[i + 1] < 0 ? "retrograde" : "direct",
            lon,
            house: cusps ? houseOf(lon, cusps) : null,
            contact: contactsOf(lon, natal, 2, ["conjunction", "opposition", "square"])[0] ?? null,
          });
        }
      }
    }

    // Ingresos en signos.
    for (let i = 0; i < times.length - 1; i++) {
      const s0 = signOf(lons[i]);
      const s1 = signOf(lons[i + 1]);
      if (s0 === s1) continue;
      const diff = (s1 - s0 + 12) % 12;
      if (diff !== 1 && diff !== 11) continue;
      const retrograde = diff === 11;
      const boundary = (retrograde ? s0 : s1) * 30;
      const at = bisect((t) => angleDiff(lonAt(body, t), boundary), times[i], times[i + 1]);
      events.push({ kind: "sign", at, weight: 0, transit: body, sign: s1, retrograde });
    }

    // Ingresos en las casas de la carta natal.
    if (cusps) {
      for (let i = 0; i < times.length - 1; i++) {
        const h0 = houseOf(lons[i], cusps);
        const h1 = houseOf(lons[i + 1], cusps);
        if (h0 === h1) continue;
        const diff = (h1 - h0 + 12) % 12;
        if (diff !== 1 && diff !== 11) continue;
        const retrograde = diff === 11;
        const boundary = cusps[(retrograde ? h0 : h1) - 1];
        const at = bisect((t) => angleDiff(lonAt(body, t), boundary), times[i], times[i + 1]);
        events.push({ kind: "house", at, weight: 0, transit: body, house: h1, lon: lonAt(body, at), retrograde });
      }
    }
  }

  // Lunaciones y eclipses.
  const eclipses = eclipsesBetween(new Date(start - DAY), new Date(end + DAY));
  for (const l of lunationsBetween(new Date(start), new Date(end))) {
    const at = l.date.getTime();
    const lon = lonAt("moon", at);
    const eclipse = eclipses.find((e) => Math.abs(e.date.getTime() - at) < DAY / 2);
    events.push({
      kind: "lunation",
      at,
      weight: 0,
      phase: l.phase,
      lon,
      house: cusps ? houseOf(lon, cusps) : null,
      eclipse: eclipse ? eclipse.kind : null,
      contacts: contactsOf(lon, natal, 3, ["conjunction", "opposition", "square"]),
    });
  }

  return finalize(events);
}

function sky(chart: Chart, ms: number): SkyPosition[] {
  const cusps = chart.houses?.cusps ?? null;
  const out: SkyPosition[] = [];
  for (const id of TRANSIT_BODIES) {
    const lon = lonAt(id, ms);
    if (Number.isNaN(lon)) continue;
    out.push({ id, lon, retrograde: speedAt(id, ms) < 0, house: cusps ? houseOf(lon, cusps) : null });
  }
  return out;
}

/** Aspectos de los planetas lentos y de Quirón a la carta natal con orbe de hasta 3° al empezar o al acabar. */
function backgroundAspects(chart: Chart, startMs: number, endMs: number, events: TransitEvent[]): BackgroundAspect[] {
  const natal = natalPoints(chart);
  const out: BackgroundAspect[] = [];
  for (const body of [...SLOW, "chiron" as const]) {
    const l0 = lonAt(body, startMs);
    const l1 = lonAt(body, endMs);
    if (Number.isNaN(l0) || Number.isNaN(l1)) continue;
    for (const p of natal) {
      for (const def of ASPECT_DEFS) {
        const orbStart = Math.abs(Math.abs(angleDiff(l0, p.lon)) - def.angle);
        const orbEnd = Math.abs(Math.abs(angleDiff(l1, p.lon)) - def.angle);
        if (Math.min(orbStart, orbEnd) > 3) continue;
        const exactInWindow = events.some((e) => e.kind === "aspect" && e.transit === body && e.natal === p.id && e.aspect === def.type);
        out.push({ transit: body, natal: p.id, aspect: def.type, orbStart, orbEnd, exactInWindow });
      }
    }
  }
  return out.sort((a, b) => Math.min(a.orbStart, a.orbEnd) - Math.min(b.orbStart, b.orbEnd));
}

/**
 * Calcula el clima personal de una carta: la ventana de 30 días desde `from` (ampliada hasta 10 días
 * si justo después hay un evento importante) con todos sus eventos, pesados y en orden cronológico.
 */
export function computeClimate(chart: Chart, from: Date): ClimateData {
  const startMs = from.getTime();
  const requestedEndMs = startMs + BASE_DAYS * DAY;
  const scanEndMs = requestedEndMs + MARGIN_DAYS * DAY;

  const scanned = scanEvents(chart, startMs, scanEndMs);
  // Se amplía hasta cubrir el primer evento importante del margen y los que le sigan a menos de
  // EXTENSION_GAP_DAYS (para no cortar justo antes de un eclipse), con medio día de margen.
  const candidates = scanned.filter((e) => e.at > requestedEndMs && e.at <= scanEndMs && isImportant(e));
  let last = candidates.length ? candidates[0].at : null;
  for (const e of candidates.slice(1)) {
    if (last !== null && e.at - last <= EXTENSION_GAP_DAYS * DAY) last = e.at;
    else break;
  }
  const endMs = last === null ? requestedEndMs : Math.min(scanEndMs, last + DAY / 2);

  // Los pasos y los pesos se recalculan solo con lo que queda dentro de la ventana final.
  const events = finalize(scanned.filter((e) => e.at <= endMs).map((e) => ({ ...e })));
  return {
    startMs,
    endMs,
    requestedEndMs,
    extensionEvents: events.filter((e) => e.at > requestedEndMs && isImportant(e)),
    hasHouses: Boolean(chart.houses),
    houseSystemUsed: chart.houses?.systemUsed ?? null,
    skyStart: sky(chart, startMs),
    skyEnd: sky(chart, endMs),
    background: backgroundAspects(chart, startMs, endMs, events),
    events,
  };
}

/** Los eventos que más pesan (desempate: el más cercano al principio), en orden de peso. */
export function topEvents(events: TransitEvent[], n: number): TransitEvent[] {
  return [...events].sort((a, b) => b.weight - a.weight || a.at - b.at).slice(0, n);
}
