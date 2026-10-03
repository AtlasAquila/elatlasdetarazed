/**
 * Conversión de la hora local de nacimiento a UTC con la historia completa de husos horarios
 * (base de datos IANA incluida en Node/Intl). Cubre cambios de horario históricos,
 * horarios de verano y horas locales de antes de la normalización.
 */

export type UtcResult = {
  date: Date;
  /** Diferencia con UTC aplicada, en minutos (positiva al este). */
  offsetMinutes: number;
  notes: string[];
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string) {
  let f = formatterCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatterCache.set(timeZone, f);
  }
  return f;
}

/** Desfase (minutos) de la zona en un instante UTC dado. */
export function zoneOffsetMinutes(timeZone: string, utcMillis: number): number {
  const parts = formatter(timeZone).formatToParts(new Date(utcMillis));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const year = get("year");
  // Intl devuelve años astronómicos correctos para el rango que nos ocupa (1800-2200).
  const asUtc = Date.UTC(year, get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - Math.floor(utcMillis / 1000) * 1000) / 60000);
}

export function isValidTimeZone(timeZone: string) {
  try {
    formatter(timeZone);
    return true;
  } catch {
    return false;
  }
}

/** Hora local → UTC. Detecta horas inexistentes (salto de primavera) y ambiguas (retroceso de otoño). */
export function localToUtc(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): UtcResult {
  const notes: string[] = [];
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute);

  // Posibles desfases alrededor de esa fecha (antes y después de un cambio de hora).
  const candidates = new Set<number>();
  for (const probe of [-36, -12, 0, 12, 36]) {
    candidates.add(zoneOffsetMinutes(timeZone, localAsUtc + probe * 3600_000));
  }

  const valid: number[] = [];
  for (const off of candidates) {
    const utc = localAsUtc - off * 60_000;
    if (zoneOffsetMinutes(timeZone, utc) === off) valid.push(off);
  }

  if (valid.length === 0) {
    // Hora inexistente: el reloj saltó hacia delante. Usamos el desfase anterior al salto.
    const before = zoneOffsetMinutes(timeZone, localAsUtc - 36 * 3600_000);
    notes.push("Esa hora no existió en el lugar de nacimiento por un cambio de horario; se ha interpretado con el horario anterior al cambio.");
    return { date: new Date(localAsUtc - before * 60_000), offsetMinutes: before, notes };
  }
  if (valid.length > 1) {
    notes.push("Esa hora se repitió en el lugar de nacimiento por un cambio de horario; se ha tomado la primera vez que ocurrió.");
  }
  // Ante una hora repetida, la primera ocurrencia es la del desfase mayor (horario de verano).
  const offset = Math.max(...valid);
  return { date: new Date(localAsUtc - offset * 60_000), offsetMinutes: offset, notes };
}
