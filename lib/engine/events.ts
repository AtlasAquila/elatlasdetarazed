/**
 * Búsqueda de lunaciones y eclipses en un intervalo, con Astronomy Engine.
 * Devuelve fechas y datos simples: quien lo usa no necesita conocer la librería.
 */
import * as A from "./vendor/astronomy";

const DAY = 86_400_000;

export type Lunation = { date: Date; phase: "new" | "full" };
export type EclipseKind = "total" | "partial" | "annular" | "penumbral";
export type Eclipse = { date: Date; type: "solar" | "lunar"; kind: EclipseKind };

/** Lunas nuevas y llenas entre dos instantes, en orden cronológico. */
export function lunationsBetween(from: Date, to: Date): Lunation[] {
  const out: Lunation[] = [];
  const phases: [number, Lunation["phase"]][] = [
    [0, "new"],
    [180, "full"],
  ];
  for (const [target, phase] of phases) {
    let cursor = from;
    for (let i = 0; i < 12; i++) {
      const found = A.SearchMoonPhase(target, cursor, 40);
      if (!found || found.date.getTime() > to.getTime()) break;
      out.push({ date: found.date, phase });
      cursor = new Date(found.date.getTime() + 20 * DAY);
    }
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Eclipses de Sol y de Luna entre dos instantes, en orden cronológico. */
export function eclipsesBetween(from: Date, to: Date): Eclipse[] {
  const out: Eclipse[] = [];
  let lunar = A.SearchLunarEclipse(from);
  for (let i = 0; i < 12 && lunar.peak.date.getTime() <= to.getTime(); i++) {
    out.push({ date: lunar.peak.date, type: "lunar", kind: String(lunar.kind) as EclipseKind });
    lunar = A.NextLunarEclipse(lunar.peak);
  }
  let solar = A.SearchGlobalSolarEclipse(from);
  for (let i = 0; i < 12 && solar.peak.date.getTime() <= to.getTime(); i++) {
    out.push({ date: solar.peak.date, type: "solar", kind: String(solar.kind) as EclipseKind });
    solar = A.NextGlobalSolarEclipse(solar.peak);
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}
