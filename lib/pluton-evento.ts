/**
 * Datos del evento «Plutón directo en Acuario» (octubre de 2026) y cruces de Plutón con una carta natal.
 * Las fechas de las estaciones salen de herramientas/efemerides.py; los cruces se calculan con el motor
 * de la web (`bodyLongitude`), día a día, con una precisión de un día.
 */

import { angleDiff, bodyLongitude, norm360 } from "@/lib/engine";

const ACU = 300;
const gr = (g: number, m: number) => ACU + g + m / 60;

/** Estaciones de Plutón en torno a la marea de 2026-2027 (horas en UTC). */
export const ESTACIONES = {
  retroceso: { iso: "2026-05-06T15:34:00Z", lon: gr(5, 31), texto: "6 de mayo de 2026", grado: "5°31′ de Acuario" },
  directo: { iso: "2026-10-16T02:40:00Z", lon: gr(3, 4), texto: "16 de octubre de 2026", grado: "3°04′ de Acuario" },
  retroceso2: { iso: "2027-05-08T12:54:00Z", lon: gr(7, 11), texto: "8 de mayo de 2027", grado: "7°11′ de Acuario" },
  directo2: { iso: "2027-10-18T03:53:00Z", lon: gr(4, 45), texto: "18 de octubre de 2027", grado: "4°45′ de Acuario" },
} as const;

/** Entrada definitiva en Acuario (19/11/2024 20:46 UTC) y salida hacia Piscis (19/01/2044 09:52 UTC). */
export const ENTRADA_ACUARIO = "19 de noviembre de 2024";
export const SALIDA_ACUARIO = "19 de enero de 2044";

/** Tramo de la marea baja (retrógrado) y de la marea alta (directo), en longitud. */
export const MAREA_BAJA = { desde: ESTACIONES.directo.lon, hasta: ESTACIONES.retroceso.lon };
export const MAREA_ALTA = { desde: ESTACIONES.directo.lon, hasta: ESTACIONES.retroceso2.lon };
/** Todo el recorrido de la marea: de 3°04′ a 7°11′ de Acuario. */
export const RECORRIDO = { desde: ESTACIONES.directo.lon, hasta: ESTACIONES.retroceso2.lon };

const DIA = 86400000;
const INICIO = Date.parse(ESTACIONES.retroceso.iso);
const FIN = Date.parse(ESTACIONES.directo2.iso);

export type Muestra = { t: number; lon: number };
let cache: Muestra[] | null = null;

/** Longitud de Plutón cada 12 horas entre el 6 de mayo de 2026 y el 18 de octubre de 2027. */
export function trayectoria(): Muestra[] {
  if (cache) return cache;
  const out: Muestra[] = [];
  for (let t = INICIO; t <= FIN; t += DIA / 2) out.push({ t, lon: bodyLongitude("pluto", new Date(t)) });
  cache = out;
  return out;
}

export type Cruce = {
  /** Instante aproximado (UTC). */
  fecha: Date;
  /** «directo» si Plutón avanza al pasar; «retrogrado» si retrocede. */
  sentido: "directo" | "retrogrado";
  /** Fase de la marea: antes o después del 16 de octubre de 2026. */
  fase: "baja" | "alta" | "siguiente";
};

/**
 * Instantes en que Plutón pasa por una longitud dada entre el 6 de mayo de 2026 y el 18 de octubre de 2027.
 * La fase es «baja» antes del 16/10/2026, «alta» hasta el 8/05/2027 y «siguiente» después.
 */
export function cruces(objetivo: number): Cruce[] {
  const m = trayectoria();
  const out: Cruce[] = [];
  const tDirecto = Date.parse(ESTACIONES.directo.iso);
  const tRetro2 = Date.parse(ESTACIONES.retroceso2.iso);
  for (let i = 1; i < m.length; i++) {
    const a = angleDiff(m[i - 1].lon, objetivo);
    const b = angleDiff(m[i].lon, objetivo);
    if (a === b || Math.abs(a) > 20 || Math.abs(b) > 20) continue;
    if (a === 0 || a * b < 0) {
      const frac = a === b ? 0 : Math.abs(a) / (Math.abs(a) + Math.abs(b));
      const t = m[i - 1].t + frac * (m[i].t - m[i - 1].t);
      const sentido = b > a ? "directo" : "retrogrado";
      out.push({ fecha: new Date(t), sentido, fase: t < tDirecto ? "baja" : t <= tRetro2 ? "alta" : "siguiente" });
    }
  }
  return out;
}

/** Distancia (°) de una longitud al tramo [desde, hasta] medido sobre el círculo; 0 si cae dentro. */
export function distanciaAlRecorrido(lon: number, tramo = RECORRIDO) {
  const ancho = tramo.hasta - tramo.desde;
  const dentro = norm360(lon - tramo.desde);
  if (dentro <= ancho) return 0;
  return Math.min(dentro - ancho, 360 - dentro);
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** «7 de noviembre de 2026» (día en UTC). */
export function fechaLarga(d: Date) {
  return `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}
/** «7 de noviembre» */
export function fechaCorta(d: Date) {
  return `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`;
}
