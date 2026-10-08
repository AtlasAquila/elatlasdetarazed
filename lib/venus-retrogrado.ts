/**
 * Campaña «Venus retrógrado» (octubre-noviembre de 2026).
 * Los datos del cielo salen de herramientas/efemerides.py (horas de Madrid).
 * La guía personal está en lib/venus-guia.ts y sus textos en lib/venus-guia-textos.ts.
 */

/** Identificador del evento que Alshain puede interpretar y pregunta que se le sugiere desde la guía. */
export const EVENTO_VENUS = "venus-retrogrado";
export const VENUS_PREGUNTA = "¿Cómo afecta la Luna Nueva con Venus retrógrado en Escorpio a mi carta?";

/** Longitud eclíptica de la Luna Nueva del 10/10/2026: 17°22' Libra. */
export const NEW_MOON_LONGITUDE = 180 + 17 + 22 / 60;

/** Calendario de Venus, de su estación retrógrada al fin de su sombra. Horas de Madrid. */
export const VENUS_CALENDAR: { fecha: string; texto: string }[] = [
  { fecha: "3 de octubre", texto: "Venus se estaciona retrógrado a 8°29' Escorpio (09:16). Empieza la revisión." },
  { fecha: "10 de octubre", texto: "Luna Nueva a 17°22' Libra (17:50) y cuadratura exacta de Venus a Marte en Leo (23:31)." },
  { fecha: "20 de octubre", texto: "Venus en cuadratura a Plutón (08:56): lo que se revisa toca el poder y el control en el vínculo." },
  { fecha: "24 de octubre", texto: "Conjunción inferior de Venus con el Sol (05:44), el centro del ciclo: lo que estaba oculto se ve." },
  { fecha: "25 de octubre", texto: "Venus retrógrado vuelve a Libra (10:10), su propio signo, para repasar los acuerdos." },
  { fecha: "28 de octubre", texto: "Venus en oposición a Quirón (08:50): aparece la herida detrás de lo que pides." },
  { fecha: "10 de noviembre", texto: "Venus sextil a Marte (07:48): deseo y acción se vuelven a entender." },
  { fecha: "14 de noviembre", texto: "Venus se estaciona directo a 22°52' Libra (01:27). Termina la retrogradación." },
  { fecha: "4 de diciembre", texto: "Venus, ya directo, vuelve a entrar en Escorpio (09:13)." },
  { fecha: "15 de diciembre", texto: "Venus sale de su sombra: se cierra el ciclo y se puede decidir con lo aprendido." },
];
