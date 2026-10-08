/**
 * Campaña «Venus retrógrado» (octubre-noviembre de 2026).
 * Los datos del cielo salen de herramientas/efemerides.py (horas de Madrid).
 */

/** Longitud eclíptica de la Luna Nueva del 10/10/2026: 17°22' Libra. */
export const NEW_MOON_LONGITUDE = 180 + 17 + 22 / 60;

export const SIGN_NAMES = ["Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo", "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis"];

/** Para cada casa donde cae la Luna Nueva: el tema y la pregunta que trae. */
export const HOUSE_QUESTIONS: { tema: string; pregunta: string }[] = [
  { tema: "la identidad, el cuerpo y la imagen", pregunta: "¿Quién eres dentro de tus vínculos y quién eres cuando estás a solas? ¿Qué parte de ti has ido cediendo para sostenerlos?" },
  { tema: "los valores, los recursos y la autoestima", pregunta: "¿Qué valor te das en un vínculo? ¿Qué aceptas hoy porque crees que no mereces más?" },
  { tema: "la conversación y el entorno cercano", pregunta: "¿Qué no estás diciendo en voz alta a las personas que tienes cerca? ¿Qué conversación llevas tiempo aplazando?" },
  { tema: "el hogar, la familia y las raíces", pregunta: "¿Qué patrón de tu familia reconoces en cómo te vinculas? ¿Qué entiendes por «hogar» en una relación?" },
  { tema: "el amor, el deseo y el placer", pregunta: "Lo que sientes, ¿es deseo, costumbre o miedo a perder? ¿Dónde has dejado de disfrutar?" },
  { tema: "la rutina, el trabajo diario y el cuidado", pregunta: "En tu día a día con los demás, ¿qué es cuidado y qué es obligación? ¿Dónde das más de lo que puedes sostener?" },
  { tema: "la pareja, los socios y los acuerdos", pregunta: "Este vínculo, ¿es reciprocidad o costumbre? ¿Qué pides de verdad y qué das esperando recibir algo a cambio?" },
  { tema: "la intimidad, lo compartido y lo que no se dice", pregunta: "¿Qué celo, deseo o lealtad no has dicho aún? ¿Qué compartes sin querer compartirlo?" },
  { tema: "las creencias, los viajes y el sentido", pregunta: "¿Qué idea sobre el amor heredaste y ya no te sirve? ¿Qué vínculo te pide ampliar la mirada?" },
  { tema: "la vocación y el lugar en el mundo", pregunta: "¿Qué vínculos acompañan el lugar que quieres ocupar y cuáles lo frenan? ¿Qué estás dispuesto a sostener en público?" },
  { tema: "las amistades, los grupos y los proyectos", pregunta: "¿Qué amistades te devuelven lo que das? ¿Qué grupo sigues frecuentando por inercia?" },
  { tema: "lo oculto, la soledad y los finales", pregunta: "¿Qué vínculo mantienes por inercia cuando por dentro ya terminó? ¿Qué necesitas soltar en silencio?" },
];

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

export type Guide = {
  nombre: string;
  ascendente: number; // 0 = Aries … 11 = Piscis
  casa: number; // 1-12
  /** Si el sistema Placidus no se pudo aplicar en esa latitud. */
  aproximada: boolean;
};

export function guideSummary(g: Guide) {
  const q = HOUSE_QUESTIONS[g.casa - 1];
  return {
    ascendente: SIGN_NAMES[g.ascendente],
    casa: g.casa,
    tema: q.tema,
    pregunta: q.pregunta,
  };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Correo con la guía. El nombre se escapa porque lo escribe quien rellena el formulario. */
export function guideEmail(g: Guide) {
  const s = guideSummary(g);
  const nombre = esc(g.nombre);
  const calendario = VENUS_CALENDAR.map((c) => `<li><strong>${esc(c.fecha)}.</strong> ${esc(c.texto)}</li>`).join("");
  const aviso = g.aproximada ? "<p><em>En la latitud de tu lugar de nacimiento las casas Placidus no se pueden calcular con exactitud; la casa es una aproximación.</em></p>" : "";
  const html = `<div style="font-family:Georgia,serif;font-size:17px;line-height:1.6;color:#1a1204;max-width:560px">
<p>Hola, ${nombre}:</p>
<p>Esta es tu guía de la Luna Nueva del 10 de octubre, con Venus retrógrado.</p>
<h2 style="font-size:20px">Tu ascendente es ${esc(s.ascendente)}</h2>
<p>La Luna Nueva cae a 17°22' de Libra, en tu <strong>casa ${s.casa}</strong>: ${esc(s.tema)}.</p>
<p><strong>La pregunta que te trae:</strong> ${esc(s.pregunta)}</p>
${aviso}
<h2 style="font-size:20px">Calendario de Venus retrógrado</h2>
<ul>${calendario}</ul>
<p>Es una guía general por tu ascendente: habla de tendencias, no de destinos. En tu carta natal completa vemos qué planeta personal te está tocando Venus, y una lectura profunda sobre cómo te afecta este tránsito.</p>
<p>— El atlas de Tarazed</p>
</div>`;
  return { subject: "Tu guía de la Luna Nueva con Venus retrógrado", html };
}
