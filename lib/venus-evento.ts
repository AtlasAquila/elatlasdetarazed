/**
 * Datos del evento «Luna Nueva con Venus retrógrado» (octubre-diciembre de 2026) que se le dan a Alshain
 * cuando la persona llega desde la guía de la campaña. Los datos del cielo salen de herramientas/efemerides.py;
 * las horas están en UTC.
 */

import { houseOf } from "@/lib/engine";
import type { Chart } from "@/lib/engine/types";
import { ASPECTOS, PUNTOS_CIELO } from "@/lib/venus-guia-textos";
import { casasDelRecorrido, contactos, grados, posicion, ROMAN } from "@/lib/venus-guia";

const CIELO = `Cielo en la Luna Nueva del sáb 10/10/2026 15:50 UTC: Sol y Luna a 17°22′ de Libra · Venus a 7°25′ de Escorpio, retrógrado (en exilio) · Marte a 7°13′ de Leo · Mercurio a 12°19′ de Escorpio · Júpiter a 21°15′ de Leo · Saturno a 10°49′ de Aries, retrógrado · Urano a 5°20′ de Géminis, retrógrado · Neptuno a 2°36′ de Aries, retrógrado · Plutón a 3°05′ de Acuario, retrógrado · Quirón a 29°03′ de Aries, retrógrado.
Configuración: T-cuadrada con vértice en Venus (Marte ☍ Plutón; Venus □ Marte; Venus □ Plutón). El Sol, en Libra, está en recepción mutua con Saturno en Aries.

Fechas del ciclo de Venus retrógrado (horas en UTC):
- 31/08/2026: Venus entra en su sombra previa.
- 03/10 07:16: Venus se detiene retrógrado a 8°29′ de Escorpio.
- 10/10 15:50: Luna Nueva a 17°22′ de Libra. Ese día, a las 21:31, cuadratura exacta de Venus (Escorpio, retrógrado) a Marte (Leo), a 7°21′.
- 20/10 06:56: Venus cuadratura Plutón a 3°04′ de Escorpio/Acuario.
- 24/10 03:44: conjunción inferior de Venus con el Sol a 0°45′ de Escorpio (centro del ciclo; Venus pasa entre la Tierra y el Sol y pasa del cielo del atardecer al del amanecer). Ese día, Mercurio se detiene retrógrado a 20°59′ de Escorpio (07:13).
- 25/10 09:10: Venus retrógrado vuelve a Libra. El 26/10 04:12, Luna Llena a 2°46′ de Tauro.
- 28/10 07:50: Venus oposición Quirón a 28°14′ de Libra/Aries.
- 09/11 07:02: Luna Nueva a 16°53′ de Escorpio. El 10/11 06:48, Venus sextil Marte (Marte en Leo, hasta el 26/11).
- 14/11 00:27: Venus se detiene directo a 22°52′ de Libra.
- 04/12 08:13: Venus, ya directo, vuelve a entrar en Escorpio. 15/12: Venus sale de su sombra posterior y el ciclo se cierra.
Venus retrógrado recorre, hacia atrás, desde 8°29′ de Escorpio hasta 22°52′ de Libra.`;

/** Texto de datos del evento y de cómo toca la carta de esta persona. */
export function venusEventFactsText(chart: Chart) {
  const out: string[] = [CIELO, "", "CÓMO TOCA EL EVENTO LA CARTA DE ESTA PERSONA (calculado)"];
  const [lunaNueva, venusRetro, , conjuncion, venusDirecto] = PUNTOS_CIELO;

  if (chart.houses && chart.angles && !chart.input.timeUnknown) {
    const { cusps } = chart.houses;
    const casa = (lon: number) => `casa ${ROMAN[houseOf(lon, cusps) - 1]}`;
    out.push(`- La Luna Nueva (${lunaNueva.grado}) cae en su ${casa(lunaNueva.longitud)}.`);
    out.push(`- Venus se detiene retrógrado (${venusRetro.grado}) en su ${casa(venusRetro.longitud)}, y directo (${venusDirecto.grado}) en su ${casa(venusDirecto.longitud)}.`);
    out.push(`- Casas que recorre Venus retrógrado, en orden: ${casasDelRecorrido(venusRetro.longitud, venusDirecto.longitud, cusps).map((h) => ROMAN[h - 1]).join(", ")}.`);
    out.push(`- La conjunción inferior de Venus con el Sol (${conjuncion.grado}) cae en su ${casa(conjuncion.longitud)}.`);
    if (chart.houses.systemUsed !== "placidus") out.push("- Las casas son aproximadas (Placidus no se puede calcular en esa latitud).");
  } else {
    out.push("- Esta persona no tiene hora de nacimiento: no hay casas ni ascendente. No hables de casas.");
  }

  const venus = chart.bodies.find((b) => b.id === "venus");
  if (venus) out.push(`- Su Venus natal está en ${posicion(venus.longitude)}${venus.house ? `, casa ${ROMAN[venus.house - 1]}` : ""}${venus.retrograde ? " y es retrógrado (nació con Venus retrógrado)" : ""}.`);

  const toques = contactos(chart);
  if (toques.length) {
    out.push("- Contactos por grado (conjunción, cuadratura u oposición; orbe máximo 3°, 2° con el ascendente):");
    for (const t of toques) {
      const nombre = t.cuerpo === "asc" ? "Ascendente" : t.cuerpo === "sun" ? "Sol" : t.cuerpo === "moon" ? "Luna" : t.cuerpo === "mercury" ? "Mercurio" : t.cuerpo === "venus" ? "Venus" : "Marte";
      out.push(`  · ${nombre} natal (${posicion(t.natal)}) ${ASPECTOS[t.aspecto]} ${t.punto.nombre} (${t.punto.fecha}, ${t.punto.grado}), orbe ${grados(t.orbe)}.`);
    }
  } else {
    out.push("- Ningún punto personal (Sol, Luna, Mercurio, Venus, Marte, ascendente) recibe un contacto exacto por grado. El evento se vive sobre todo por las casas.");
  }
  return out.join("\n");
}
