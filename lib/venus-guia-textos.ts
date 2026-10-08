/**
 * Textos de la guía «Venus retrógrado» (octubre-noviembre de 2026).
 * Formato de los párrafos: el de components/RichText.tsx (**negrita**, *cursiva*, listas con «- »).
 * Los datos del cielo salen de herramientas/efemerides.py.
 */

/** La Luna Nueva del 10 de octubre (17°22′ de Libra) según la casa donde cae. */
export const CASAS: { tema: string; luna: string; preguntas: [string, string]; venus: string }[] = [
  {
    tema: "la identidad, el cuerpo y la imagen",
    luna: "La Luna Nueva siembra en tu casa I, la del cuerpo, la imagen y la manera de entrar en cualquier lugar. Libra busca equilibrio y, con Venus retrógrado, ese equilibrio empieza por ti: cuánto de lo que muestras es elección y cuánto es lo que esperan de ti. Es un buen momento para un cambio de imagen que no sea un disfraz y para notar qué cedes cuando buscas gustar.",
    preguntas: ["¿Quién eres dentro de tus vínculos y quién eres cuando estás a solas?", "¿Qué parte de ti has ido cediendo para sostenerlos?"],
    venus: "Se revisa cómo te presentas y cuánto de ti has puesto al servicio de gustar.",
  },
  {
    tema: "los valores, los recursos y la autoestima",
    luna: "La Luna Nueva siembra en tu casa II, la de lo que valoras y de lo que te das. Con Venus retrógrado en Escorpio, la pregunta es cuánto vale para ti lo que das y lo que aceptas a cambio, en tiempo, en cariño y en recursos. Es un ciclo para ordenar tu relación con lo que tienes y con lo que crees merecer, sin dramatismo.",
    preguntas: ["¿Qué valor te das en un vínculo?", "¿Qué aceptas hoy porque crees que no mereces más?"],
    venus: "Se revisan tus valores, lo que das y lo que aceptas por poco, en cariño y en recursos.",
  },
  {
    tema: "la conversación y el entorno cercano",
    luna: "La Luna Nueva siembra en tu casa III, la de la palabra, los hermanos, los vecinos y los trayectos cortos. Libra pide diálogo y Venus retrógrado devuelve conversaciones pendientes: mensajes sin responder, explicaciones a medias, personas que reaparecen. Este ciclo favorece decir lo que has callado, con calma y sin ensayar la réplica.",
    preguntas: ["¿Qué no estás diciendo en voz alta a las personas que tienes cerca?", "¿Qué conversación llevas tiempo aplazando?"],
    venus: "Se revisan las conversaciones pendientes y la manera de decir lo que sientes.",
  },
  {
    tema: "el hogar, la familia y las raíces",
    luna: "La Luna Nueva siembra en tu casa IV, la del hogar, la familia y la memoria emocional. Con Venus retrógrado, lo que aprendiste en tu infancia sobre el amor vuelve a mirarse: quién cuidaba, quién se callaba, qué se daba por hecho. Es un ciclo para decidir qué quieres que sea «casa» y qué patrón heredado ya no tiene que seguir.",
    preguntas: ["¿Qué patrón de tu familia reconoces en cómo te vinculas?", "¿Qué entiendes por «hogar» en una relación?"],
    venus: "Se revisa el hogar emocional: de dónde vienes y qué quieres que sea «casa».",
  },
  {
    tema: "el amor, el deseo y el placer",
    luna: "La Luna Nueva siembra en tu casa V, la del amor que se elige, el juego, la creatividad y el placer. Con Venus retrógrado en Escorpio, el deseo se examina con lupa: qué te enciende de verdad, qué es costumbre y qué es miedo a perder. Un buen ciclo para recuperar el disfrute sin exigirle resultados.",
    preguntas: ["Lo que sientes, ¿es deseo, costumbre o miedo a perder?", "¿Dónde has dejado de disfrutar?"],
    venus: "Se revisa qué te da placer de verdad y qué es deseo, costumbre o miedo a perder.",
  },
  {
    tema: "la rutina, el trabajo diario y el cuidado",
    luna: "La Luna Nueva siembra en tu casa VI, la de la rutina, el trabajo cotidiano y el cuidado del cuerpo. Libra lleva el equilibrio a los hábitos: cuánto das a los demás y cuánto te queda a ti. Con Venus retrógrado, la revisión es práctica: horarios, cargas, quién hace qué. Pequeños ajustes de organización pueden cambiar más tus vínculos que una gran conversación.",
    preguntas: ["En tu día a día con los demás, ¿qué es cuidado y qué es obligación?", "¿Dónde das más de lo que puedes sostener?"],
    venus: "Se revisa la rutina del cuidado: lo que haces por los demás y lo que te debes.",
  },
  {
    tema: "la pareja, los socios y los acuerdos",
    luna: "La Luna Nueva siembra en tu casa VII, la de la pareja, los socios y los acuerdos con quien tienes enfrente. Es el lugar natural de Libra, así que esta Luna Nueva te toca de lleno. Con Venus retrógrado, lo pactado se vuelve a leer: qué se prometió, qué se cumple y qué quedó sin decir. Un ciclo para renovar o corregir un acuerdo, no para romperlo por impulso.",
    preguntas: ["Este vínculo, ¿es reciprocidad o costumbre?", "¿Qué pides de verdad y qué das esperando recibir algo a cambio?"],
    venus: "Se revisan los acuerdos y la pareja: qué se pactó, qué se cumple y qué quedó sin decir.",
  },
  {
    tema: "la intimidad, lo compartido y lo que no se dice",
    luna: "La Luna Nueva siembra en tu casa VIII, la de la intimidad, lo que se comparte y lo que se esconde. Escorpio, el signo que la tradición asocia a esta casa, es donde Venus retrocede, así que el tránsito te queda muy cerca: celos, lealtades, deudas emocionales, secretos. Es un ciclo para decir una verdad que pesa y para soltar lo que ya no se sostiene en común.",
    preguntas: ["¿Qué celo, deseo o lealtad no has dicho aún?", "¿Qué compartes sin querer compartirlo?"],
    venus: "Se revisa lo compartido: intimidad, deudas emocionales, lealtades y lo que no se dice.",
  },
  {
    tema: "las creencias, los viajes y el sentido",
    luna: "La Luna Nueva siembra en tu casa IX, la de las creencias, los viajes largos y la búsqueda de sentido. Libra pregunta qué es justo y Venus retrógrado revisa lo que heredaste sobre el amor y la libertad. Es un ciclo para ampliar la mirada: leer, viajar o hablar con alguien que piense distinto, y comprobar qué ideas siguen siendo tuyas.",
    preguntas: ["¿Qué idea sobre el amor heredaste y ya no te sirve?", "¿Qué vínculo te pide ampliar la mirada?"],
    venus: "Se revisan las creencias sobre el amor y las distancias que pones o aceptas.",
  },
  {
    tema: "la vocación y el lugar en el mundo",
    luna: "La Luna Nueva siembra en tu casa X, la de la vocación y la imagen pública. Con Venus retrógrado, la revisión pasa por los vínculos que acompañan lo que quieres construir: colegas, socios, mentores. Es un ciclo para alinear lo que haces con lo que vales y para ver qué relaciones profesionales se sostienen en la reciprocidad y cuáles en la costumbre.",
    preguntas: ["¿Qué vínculos acompañan el lugar que quieres ocupar y cuáles lo frenan?", "¿Qué te atreves a sostener en público?"],
    venus: "Se revisa qué vínculos acompañan lo que quieres construir y cuáles lo frenan.",
  },
  {
    tema: "las amistades, los grupos y los proyectos",
    luna: "La Luna Nueva siembra en tu casa XI, la de las amistades, los grupos y los proyectos compartidos. Libra busca equilibrio entre iguales y Venus retrógrado pregunta quién te devuelve lo que das. Es un ciclo para elegir mejor tus compañías: mantener a quien te acompaña y soltar, sin reproche, los grupos que frecuentas por inercia.",
    preguntas: ["¿Qué amistades te devuelven lo que das?", "¿Qué grupo sigues frecuentando por inercia?"],
    venus: "Se revisan amistades, grupos y proyectos compartidos: quién devuelve lo que recibe.",
  },
  {
    tema: "lo oculto, la soledad y los finales",
    luna: "La Luna Nueva siembra en tu casa XII, la de lo que no se ve: el descanso, la soledad, los finales. Es una siembra silenciosa. Con Venus retrógrado, lo que ya terminó por dentro pide un cierre que quizá nadie vea. Es un ciclo para el silencio, la terapia, la escritura o el descanso, y para dejar ir sin anunciarlo.",
    preguntas: ["¿Qué vínculo mantienes por inercia cuando por dentro ya terminó?", "¿Qué necesitas soltar en silencio?"],
    venus: "Se revisa lo que ya terminó por dentro, lo que se sostiene por inercia y lo que necesita cerrarse en silencio.",
  },
];

/** Tu Venus natal, según su signo. */
export const VENUS_SIGNOS = [
  "Tu Venus en Aries ama de frente: te atrae lo que se conquista y se apaga ante lo que se da por hecho. Con Venus retrógrado el impulso se frena y la pregunta cambia: ya no es a quién quieres, sino qué sostienes cuando se acaba la novedad. Mira dónde confundes intensidad con vínculo.",
  "Tu Venus en Tauro ama despacio y con los sentidos: necesita tiempo, tacto y constancia. Es uno de sus signos, y el retrógrado le pide revisar lo que se ha vuelto comodidad. Mira qué conservas porque te hace bien y qué porque cambiarlo da pereza.",
  "Tu Venus en Géminis seduce con la palabra y la curiosidad. Con el retrógrado, lo dicho vuelve: mensajes antiguos, explicaciones pendientes, personas que reaparecen. Observa qué conversaciones te dan vida y cuáles son solo ingenio para no sentir.",
  "Tu Venus en Cáncer ama cuidando y necesita sentirse en casa con quien quiere. El retrógrado remueve la memoria: vínculos antiguos, costumbres familiares, lo que aprendiste sobre cómo se recibe el cariño. Mira dónde cuidas por miedo a que se vayan.",
  "Tu Venus en Leo ama con generosidad y quiere que se vea lo que da. Marte atraviesa Leo estos días, así que el orgullo está especialmente despierto, y el retrógrado lo pone a prueba. Mira dónde esperas que te pidan perdón antes de acercarte, y qué ganarías dando tú el primer paso.",
  "Tu Venus en Virgo ama con gestos pequeños y atención al detalle, y se exige mucho a sí misma. El retrógrado afina esa mirada hacia dentro: revisa dónde la crítica sustituye a la ternura. Mira qué tiene que ocurrir, en ti y en los demás, para que algo cuente como «bien».",
  "Tu Venus en Libra está en casa, y esta Luna Nueva cae en tu propio signo. Revisar es tu terreno: equilibrio, reciprocidad, lo que se da y lo que se recibe. El riesgo es el de siempre: decir que sí por no incomodar. Mira dónde la armonía es un acuerdo y dónde es un silencio.",
  "Tu Venus en Escorpio ama a fondo o no ama: intensidad, lealtad, verdad. Este retrógrado ocurre en tu propio signo, así que lo vives de cerca: celos, secretos, lo que se quiso controlar. Mira qué se sostiene por miedo a perder y qué por verdad.",
  "Tu Venus en Sagitario necesita aire y honestidad: ama lo que amplía. El retrógrado pone a prueba la libertad que reclamas y la que das. Mira dónde llamas «libertad» a evitar un compromiso, y dónde llamas «compromiso» a lo que te encoge.",
  "Tu Venus en Capricornio ama con constancia y tarda en mostrarlo. El retrógrado revisa el precio de esa reserva: qué vínculos siguen por deber o por conveniencia y cuáles por afecto. Mira dónde te cuesta pedir sin haberlo «merecido» antes.",
  "Tu Venus en Acuario ama desde la amistad y la libertad mutua. El retrógrado revisa la distancia: dónde es espacio y dónde es desapego. Mira qué has dejado sin decir por parecer razonable.",
  "Tu Venus en Piscis, su signo de exaltación, ama sin fronteras y se funde con quien quiere. El retrógrado pide límites: dónde das sin medida y dónde idealizas. Mira a quién ves como es y a quién como te gustaría que fuera.",
];

export const VENUS_NATAL_RETROGRADO =
  "Naciste con Venus retrógrado, así que este tránsito te resulta, en el fondo, familiar: revisar los vínculos antes de entregarte es tu manera natural de amar. Es probable que lo notes con más claridad que otras personas.";

/** Puntos del cielo que se comparan con tu carta. Grados de herramientas/efemerides.py. */
export type PuntoCielo = { id: string; nombre: string; fecha: string; longitud: number; grado: string };

export const PUNTOS_CIELO: PuntoCielo[] = [
  { id: "luna-nueva", nombre: "la Luna Nueva", fecha: "10 de octubre", longitud: 180 + 17 + 22 / 60, grado: "17°22′ de Libra" },
  { id: "venus-retro", nombre: "Venus al detenerse retrógrado", fecha: "3 de octubre", longitud: 210 + 8 + 29 / 60, grado: "8°29′ de Escorpio" },
  { id: "cuadratura", nombre: "Venus en su cuadratura exacta con Marte", fecha: "10 de octubre", longitud: 210 + 7 + 21 / 60, grado: "7°21′ de Escorpio" },
  { id: "conjuncion", nombre: "la conjunción inferior de Venus con el Sol", fecha: "24 de octubre", longitud: 210 + 45 / 60, grado: "0°45′ de Escorpio" },
  { id: "venus-directo", nombre: "Venus al detenerse directo", fecha: "14 de noviembre", longitud: 180 + 22 + 52 / 60, grado: "22°52′ de Libra" },
];

/** Qué significa que el tránsito toque cada punto personal de tu carta. */
export const PUNTOS_PERSONALES: Record<string, { nombre: string; texto: string }> = {
  sun: { nombre: "Sol", texto: "Se toca tu identidad y tu manera de brillar. Es un momento para revisar qué parte de ti pones en cada vínculo, no para defenderla." },
  moon: { nombre: "Luna", texto: "Se tocan tus emociones y tus necesidades: lo que llevas dentro sube a la superficie con más facilidad. Se nota en el ánimo y en lo que necesitas de los demás para sentirte a salvo." },
  mercury: { nombre: "Mercurio", texto: "Se tocan tu mente y tu palabra. Ideas, conversaciones y decisiones piden revisión antes que prisa; es un buen momento para releer, aclarar y decir lo que quedó a medias." },
  venus: { nombre: "Venus", texto: "Es el contacto más directo con el tránsito: se tocan lo que valoras y cómo quieres. Tus gustos, tus vínculos y tus valores pasan por un examen." },
  mars: { nombre: "Marte", texto: "Se tocan tu acción y tu deseo: lo que empujas y lo que contienes. Con Venus retrógrado en cuadratura a Marte, el impulso choca con lo que de verdad se quiere, y frenar antes de actuar te ahorra malentendidos." },
  asc: { nombre: "Ascendente", texto: "Se toca el modo en que te presentas y cómo te reciben. Este contacto depende mucho de la hora de nacimiento: si no la tienes segura, tómalo como una pista, no como un dato." },
};

/** El eje Marte–Plutón: oposición exacta el 3/10 a 3°06′ de Leo/Acuario; en la Luna Nueva, Marte a 7°13′ de Leo y Plutón a 3°05′ de Acuario. Solo se usa para Alshain. */
export const EJE_MARTE_PLUTON: PuntoCielo = { id: "marte-pluton", nombre: "el eje Marte–Plutón", fecha: "oposición exacta el 3 de octubre", longitud: 300 + 3 + 5 / 60, grado: "3°05′ de Acuario / Leo" };

export const ASPECTOS = {
  conjuncion: "en conjunción con",
  cuadratura: "en cuadratura con",
  oposicion: "en oposición a",
} as const;

export const ASPECTO_MATIZ = {
  conjuncion: "La conjunción es el contacto más intenso: el tránsito cae encima de ese punto y lo activa de lleno.",
  cuadratura: "La cuadratura añade tensión: te empuja a moverte y a decidir.",
  oposicion: "La oposición se nota a través de los demás: lo ves reflejado en otras personas o en situaciones externas.",
} as const;

export const SIN_CONTACTOS =
  "Ningún punto personal de tu carta (Sol, Luna, Mercurio, Venus, Marte, ascendente) recibe hoy un contacto exacto de estos cinco puntos del cielo. No significa que el tránsito te pase de largo: lo vivirás sobre todo por las casas, que es lo que cuentan las secciones anteriores.";

/** Las cuatro fases del ciclo. */
export const FASES = {
  apertura: {
    titulo: "Del 3 al 24 de octubre · La revisión se abre",
    texto:
      "Venus se detiene el 3 de octubre a 8°29′ de Escorpio y empieza a retroceder. El 10 llegan la Luna Nueva en Libra y la cuadratura exacta de Venus a Marte, y el 20, la cuadratura de Venus a Plutón. Es la parte más tensa: lo que quieres choca con cómo actúas y lo que estaba bajo la superficie pide verdad.\n\n**Qué mirar:** qué deseos y qué lealtades salen a la luz sin que los llames.\n\n**Qué cuidar:** las decisiones definitivas tomadas en caliente; esperar unos días las deja en su sitio.",
  },
  centro: {
    titulo: "Del 24 al 28 de octubre · El centro del ciclo",
    texto:
      "El 24 de octubre Venus pasa entre la Tierra y el Sol, en conjunción inferior a 0°45′ de Escorpio. Desde la Tierra se pierde unos días en el resplandor del Sol y reaparece en el cielo del amanecer. El 25 retrocede a Libra, su propio signo, y el 28 forma una oposición con Quirón, el punto de la herida.\n\n**Qué mirar:** lo que estaba oculto y ahora se ve; la herida que hay detrás de lo que pides.\n\n**Qué cuidar:** las conclusiones rápidas sobre alguien. Lo que se ve claro estos días necesita reposo antes de convertirse en una sentencia.",
  },
  salida: {
    titulo: "Del 28 de octubre al 14 de noviembre · La salida",
    texto:
      "Venus recorre Libra hacia atrás y vuelve a los acuerdos: qué se pactó y qué se cumple. El 9 de noviembre llega otra Luna Nueva, ahora en Escorpio. El 10, Venus forma un sextil con Marte, y el 14 se detiene directo a 22°52′ de Libra. Deseo y acción vuelven a entenderse.\n\n**Qué mirar:** qué ha quedado claro después de tres semanas y qué has decidido mantener.\n\n**Qué cuidar:** los reencuentros que nacen de la nostalgia. Venus retrógrado devuelve personas y no todas vuelven para quedarse.",
  },
  sombra: {
    titulo: "Del 14 de noviembre al 15 de diciembre · La sombra",
    texto:
      "Venus avanza otra vez, pero despacio: hasta el 15 de diciembre recorre de nuevo el tramo que ya conoce. El 4 de diciembre vuelve a entrar en Escorpio. Es la fase de decidir con lo aprendido.\n\n**Qué mirar:** qué acuerdos nuevos nacen de lo que viste.\n\n**Qué cuidar:** el vértigo de acelerar. Lo que se aclara en noviembre se consolida en diciembre.",
  },
};

export const INTRO_CIELO =
  "El 3 de octubre Venus se detuvo y empezó a retroceder en Escorpio, un signo que la tradición llama su exilio: allí ama a fondo o no ama. El 10, la Luna Nueva abre un ciclo a 17°22′ de Libra, el signo que Venus rige, mientras Venus (en Escorpio) y Marte (en Leo) forman una cuadratura exacta.\n\nUn retrógrado no es un castigo ni un presagio. Desde la Tierra, Venus parece ir marcha atrás y vuelve a pasar por los mismos grados; la astrología lee ese regreso como una invitación a revisar. Hasta el 14 de noviembre el cielo hace una sola pregunta: lo que quieres y lo que haces, ¿van en la misma dirección?";

export const TEXTO_CIERRE =
  "Esta guía parte de tu ascendente, tus casas y cinco puntos del cielo. Es una lectura general: habla de tendencias, no de destinos. Tu carta natal completa dice mucho más: cómo se relacionan entre sí tu Sol, tu Luna y tu Marte, qué planetas de tu cielo conversan con Venus y qué te piden estas semanas.";
