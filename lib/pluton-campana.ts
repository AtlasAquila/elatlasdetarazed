/**
 * Campaña «Plutón directo en Acuario» (octubre de 2026 a octubre de 2027): evento que Alshain puede interpretar
 * cuando la persona llega desde la guía. Los datos del cielo salen de herramientas/efemerides.py (horas de Madrid);
 * la guía personal está en lib/pluton-guia.ts y sus textos en lib/pluton-guia-textos.ts.
 */

import type { Chart } from "@/lib/engine/types";
import { calcularBase, materialCasas, plutonFactsText } from "@/lib/pluton-guia";

/** Identificador del evento y pregunta que se le sugiere a la persona desde la guía. */
export const EVENTO_PLUTON = "pluton-acuario";
export const PLUTON_PREGUNTA = "¿Cómo afecta la estación directa de Plutón en Acuario a mi carta?";

const CIELO = `Cielo de la campaña (horas de Madrid): Plutón entró en Acuario de forma definitiva el 19 de noviembre de 2024 y saldrá hacia Piscis el 19 de enero de 2044. Se detuvo retrógrado el 6 de mayo de 2026 a 5°31′ de Acuario (marea baja) y se detiene directo el 16 de octubre de 2026 a las 04:40 a 3°04′ de Acuario (marea alta). Estará directo hasta el 8 de mayo de 2027, cuando se detenga retrógrado a 7°11′ de Acuario (204 días directo), y volverá a ir directo el 18 de octubre de 2027 a 4°45′ de Acuario.`;

/** Datos del evento y de cómo toca la carta de esta persona, para el asistente. */
export function plutonEventFactsText(chart: Chart) {
  if (!chart.houses || !chart.angles || chart.input.timeUnknown) {
    return `${CIELO}\n\nCÓMO TOCA EL EVENTO LA CARTA DE ESTA PERSONA\n- Esta persona no tiene hora de nacimiento: no hay casas ni ascendente. No hables de casas ni de la casa de la estación.`;
  }
  const base = calcularBase(chart, "");
  return `${plutonFactsText(base)}\n\nMATERIAL BASE (idea de partida: desarróllala con tus palabras)\n${materialCasas(base)}`;
}
