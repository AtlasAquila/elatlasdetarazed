/**
 * Textos de la guía «Plutón directo en Acuario» (octubre de 2026 a mayo de 2027).
 * Formato de los párrafos: el de components/RichText.tsx (**negrita**, *cursiva*, listas con «- »).
 * Los datos del cielo salen de herramientas/efemerides.py; las horas son de Madrid.
 * La interpretación de las casas y de los puntos es lectura simbólica; «marea baja / alta» es la metáfora de la guía.
 */

export type CasaPluton = {
  tema: string;
  /** Qué hace Plutón en esa casa (sección «Plutón cae en tu casa X»). */
  aqui: string;
  /** Qué pudo mostrar la marea baja (Plutón retrógrado, de mayo a octubre). */
  baja: string;
  /** Qué pide la marea alta (Plutón directo, de octubre a mayo). */
  alta: string;
  preguntas: [string, string];
  /** Una línea para cuando el recorrido solo pasa por esa casa. */
  pasa: string;
};

export const CASAS_PLUTON: CasaPluton[] = [
  {
    tema: "la identidad, el cuerpo y la imagen",
    aqui: "Plutón trabaja en tu casa I, la del cuerpo, la imagen y la manera de entrar en cualquier lugar. Con Acuario de fondo, la pregunta es cuánto de lo que muestras es tuyo y cuánto una versión ajustada para encajar en tu grupo, tu trabajo o tus redes. No viene a cambiarte por fuera: viene a quitar capas que ya no te representan.",
    baja: "Es probable que, entre mayo y octubre, hayas notado un desajuste entre cómo te ves y cómo te ven, o ganas de cambiar de imagen sin saber bien por qué. Lo que quedó a la vista fue la parte de tu presentación que se sostenía por costumbre.",
    alta: "La marea sube y pide decisión: qué conservas de esa imagen, qué dejas de explicar y qué parte de ti te permites mostrar sin pedir permiso. Los cambios más sólidos son los pequeños y constantes.",
    preguntas: ["¿Qué versión de ti muestras para encajar y cuál guardas para cuando estás a solas?", "¿Qué parte de ti has dejado de enseñar por miedo a quedarte fuera?"],
    pasa: "Se revisa tu imagen y tu manera de presentarte: cuánto es elección y cuánto expectativa ajena.",
  },
  {
    tema: "los valores, los recursos y la autoestima",
    aqui: "Plutón trabaja en tu casa II, la de lo que valoras y de lo que te das. Con Acuario, la pregunta es de dónde viene tu sentido del valor propio: de lo que tú estimas o de lo que tu entorno premia (el reconocimiento, las cifras, la comparación con los demás). Habla de tu relación con lo que tienes y con lo que crees merecer; no de decisiones económicas concretas.",
    baja: "Es probable que entre mayo y octubre hayas visto con más claridad dónde te mides con la vara de otros, o qué has aceptado porque creías no merecer más. Lo que quedó a la vista fue la parte de tu autoestima que dependía de la aprobación.",
    alta: "Ahora toca ordenar: decidir qué valoras de verdad y dejar de pagar, en tiempo o en ánimo, por lo que no. Es un reajuste lento de lo que das y de lo que aceptas a cambio.",
    preguntas: ["¿Qué valoras cuando nadie lo ve?", "¿Dónde mides tu valor con la vara de otros?"],
    pasa: "Se revisan tus valores, lo que das y lo que aceptas, y de dónde viene tu sensación de valer.",
  },
  {
    tema: "la conversación y el entorno cercano",
    aqui: "Plutón trabaja en tu casa III, la de la palabra, la información, los hermanos, los vecinos y los trayectos cortos. Con Acuario entran los grupos de mensajes, las redes y todo lo que se sabe y se dice a tu alrededor. La pregunta es quién controla lo que piensas y lo que te atreves a decir.",
    baja: "Es probable que entre mayo y octubre hayas notado conversaciones que pesan, silencios que ya no se sostienen o información que dejó de convencerte. Lo que quedó a la vista fue la distancia entre lo que dices y lo que piensas.",
    alta: "La marea sube y pide palabra: decir lo que callaste, elegir qué fuentes dejas entrar y soltar los chats y las conversaciones que ya no te aportan. Un mensaje claro y sin prisa vale más que una gran explicación.",
    preguntas: ["¿Qué estás callando para no incomodar a quienes tienes cerca?", "¿Qué fuentes mandan hoy en lo que piensas?"],
    pasa: "Se revisan las conversaciones, la información que consumes y lo que no estás diciendo.",
  },
  {
    tema: "el hogar, la familia y las raíces",
    aqui: "Plutón trabaja en tu casa IV, la del hogar, la familia y la memoria emocional. Con Acuario aparece la tensión entre la familia de origen y la que se elige. La pregunta es qué lealtades heredadas sigues sosteniendo y quién mandaba, de verdad, en la casa donde creciste.",
    baja: "Es probable que entre mayo y octubre te hayan salido recuerdos, silencios familiares o patrones que reconoces en cómo te vinculas. Lo que quedó a la vista fue lo que se daba por hecho en tu casa sin que nadie lo dijera.",
    alta: "Ahora toca decidir qué heredas y qué no: qué quieres que sea «hogar» y qué tradición dejas de repetir. Se hace con calma y sin romper puentes en caliente.",
    preguntas: ["¿Qué lealtad familiar sostienes aunque ya no sea tuya?", "¿Qué quieres que signifique «casa» para ti?"],
    pasa: "Se revisa el hogar emocional: de dónde vienes y qué lealtades sigues sosteniendo.",
  },
  {
    tema: "el amor, el deseo y el placer",
    aqui: "Plutón trabaja en tu casa V, la del amor que se elige, el juego, la creatividad, el placer y los hijos. Con Acuario, la pregunta es qué haces por gusto y qué por ser visto o aceptado. Habla del deseo y de la creatividad que se expone ante los demás.",
    baja: "Es probable que entre mayo y octubre hayas visto qué te da placer de verdad y qué haces para gustar, o que una afición, un proyecto creativo o un vínculo hayan perdido el brillo. Lo que quedó a la vista fue la parte del disfrute que dependía del aplauso.",
    alta: "La marea sube y pide decisión: recuperar lo que disfrutas sin exigirle resultados, y crear o amar sin esperar que lo aprueben. Es un buen ciclo para empezar algo pequeño y tuyo.",
    preguntas: ["¿Qué haces por placer y qué por ser visto?", "¿Qué dejaste de crear por miedo al juicio?"],
    pasa: "Se revisa qué te da placer de verdad y qué haces para ser visto o querido.",
  },
  {
    tema: "la rutina, el trabajo diario y el cuidado",
    aqui: "Plutón trabaja en tu casa VI, la de la rutina, el trabajo cotidiano y los hábitos. Con Acuario entran los sistemas, las herramientas y la tecnología que organizan tu día. La pregunta es qué parte de tu rutina decides tú y cuál te la imponen los horarios, las cargas o las expectativas del equipo.",
    baja: "Es probable que entre mayo y octubre hayas notado un reparto injusto de tareas, un cansancio acumulado o una rutina que ya no te sirve. Lo que quedó a la vista fue lo que sostenías por obligación y no por elección.",
    alta: "Ahora toca reorganizar con cambios pequeños y concretos: horarios, cargas, quién hace qué. Un ajuste de organización puede cambiar más que una gran decisión.",
    preguntas: ["¿Qué hábito sostienes por obligación y cuál por cuidado?", "¿Qué parte de tu día decide otra persona por ti?"],
    pasa: "Se revisa la rutina y el trabajo diario: lo que haces por obligación y lo que haces por cuidado.",
  },
  {
    tema: "la pareja, los socios y los acuerdos",
    aqui: "Plutón trabaja en tu casa VII, la de la pareja, los socios y los acuerdos con quien tienes enfrente. Con Acuario, la pregunta es quién decide en tus vínculos y cómo se llegó a ese reparto. Es el lugar donde se ve el poder en lo cotidiano: quién cede, quién calla y quién manda.",
    baja: "Es probable que entre mayo y octubre hayas visto un desequilibrio que antes pasaba desapercibido, o una conversación pendiente con una pareja o un socio. Lo que quedó a la vista fue lo pactado sin decirse.",
    alta: "La marea sube y pide renegociar: poner en voz alta lo que cada parte da y recibe. Es un ciclo para corregir un acuerdo, no para romperlo por impulso.",
    preguntas: ["¿Quién decide en este vínculo y cómo llegó a ser así?", "¿Qué cedes por mantener la paz?"],
    pasa: "Se revisan los acuerdos y la pareja: quién decide, quién cede y qué quedó sin decir.",
  },
  {
    tema: "la intimidad, lo compartido y lo que no se dice",
    aqui: "Plutón trabaja en tu casa VIII, la de la intimidad, lo que se comparte y lo que se esconde. Es la casa que la astrología moderna asocia a Plutón, así que aquí su trabajo es más hondo. Con Acuario, la pregunta es qué se comparte de verdad y quién controla lo que se sabe: secretos, deudas emocionales, lealtades, lo que une y lo que ata.",
    baja: "Es probable que entre mayo y octubre hayan salido celos, secretos o asuntos compartidos que se evitaban. Lo que quedó a la vista fue lo que pesaba en común y no se nombraba.",
    alta: "Ahora toca decir una verdad que pesa y soltar lo que ya no se sostiene en común. Lo hondo se mueve despacio: no hace falta resolverlo todo en un día.",
    preguntas: ["¿Qué compartes sin querer compartirlo?", "¿Qué verdad pesa más cuanto más tiempo la callas?"],
    pasa: "Se revisa lo compartido: intimidad, lealtades, deudas emocionales y lo que no se dice.",
  },
  {
    tema: "las creencias, los viajes y el sentido",
    aqui: "Plutón trabaja en tu casa IX, la de las creencias, los estudios, los viajes largos y la búsqueda de sentido. Es la casa donde decides qué es verdad para ti y qué has heredado sin examinarlo. Con Acuario, la pregunta de esta marea no es qué crees, sino por qué lo crees: cuánto lo has elegido y cuánto lo sostienes para seguir perteneciendo a un grupo, una familia o una época.",
    baja: "Es probable que entre mayo y octubre hayas notado ideas que ya no te cuadran, estudios o planes de viaje que se enfriaron, o discusiones sobre lo que está bien y lo que no. Lo que quedó a la vista fue la parte de tu mapa de creencias que se sostenía sin que la miraras.",
    alta: "La marea sube y pide decisión: replantear un estudio o un proyecto, dejar de defender una postura que ya no es tuya, o abrirte a una mirada que antes descartabas. No es una ruptura; es un reajuste lento.",
    preguntas: ["¿Qué creencia sostienes porque tu grupo la sostiene?", "¿Qué idea tuya has dejado de decir en voz alta para no quedarte fuera?"],
    pasa: "Se revisan tus creencias, tus estudios y tu búsqueda de sentido: qué ideas siguen siendo tuyas.",
  },
  {
    tema: "la vocación y el lugar en el mundo",
    aqui: "Plutón trabaja en tu casa X, la de la vocación, la imagen pública y el lugar que ocupas en el mundo. Con Acuario entran los equipos, las organizaciones y el reconocimiento colectivo. La pregunta es quién decide tu lugar: tú, la estructura donde trabajas o lo que se espera de ti.",
    baja: "Es probable que entre mayo y octubre hayas dudado del rumbo, notado quién manda de verdad en tu entorno profesional o sentido que el papel que desempeñas ya no te representa. Lo que quedó a la vista fue la distancia entre tu lugar y tu vocación.",
    alta: "Ahora toca decidir con qué estructura te quedas y con cuál no, y qué te atreves a sostener en público. Se avanza con pasos visibles y pequeños, no con grandes giros.",
    preguntas: ["¿Qué papel desempeñas porque esperan que lo hagas?", "¿Qué te atreves a sostener en público?"],
    pasa: "Se revisa tu vocación y tu lugar: quién decide tu papel y qué estructuras te sostienen.",
  },
  {
    tema: "las amistades, los grupos y los proyectos",
    aqui: "Plutón trabaja en tu casa XI, la de las amistades, los grupos y los proyectos compartidos. Es la casa que la tradición asocia a Acuario, así que Plutón trabaja aquí en terreno propio: la pertenencia, directamente. La pregunta es a qué grupos perteneces por afinidad y a cuáles por inercia, y quién tiene el poder dentro de ellos.",
    baja: "Es probable que entre mayo y octubre hayas notado un grupo donde ya no te reconoces, amistades que se enfriaron o dinámicas de poder que antes no veías. Lo que quedó a la vista fue lo que te unía a ciertas personas más allá del afecto.",
    alta: "La marea sube y pide decisión: dejar un grupo sin reproche, acercarte a quien comparte tus ideales o empezar un proyecto con personas que sí te reconocen. Pertenecer no tiene por qué costar ser quien eres.",
    preguntas: ["¿A qué grupo perteneces por afinidad y a cuál por inercia?", "¿Qué dirías en tu grupo si no temieras quedarte fuera?"],
    pasa: "Se revisan las amistades, los grupos y los proyectos compartidos: a cuáles perteneces por afinidad y a cuáles por inercia.",
  },
  {
    tema: "lo oculto, la soledad y los finales",
    aqui: "Plutón trabaja en tu casa XII, la de lo que no se ve: el descanso, la soledad, los finales y lo que se vive en silencio. Con Acuario, la pregunta es qué absorbes del ambiente sin darte cuenta y qué lealtades invisibles sostienes. Es una marea que trabaja hacia dentro y casi nunca se anuncia.",
    baja: "Es probable que entre mayo y octubre hayas sentido ganas de apartarte, necesidad de silencio o recuerdos que vuelven sin motivo. Lo que quedó a la vista fue lo que ya había terminado por dentro, aunque por fuera siguiera igual.",
    alta: "Ahora toca cerrar en silencio lo que ya terminó, sin anunciarlo ni justificarlo. Es un ciclo para el descanso, la escritura o la soledad elegida, y para soltar lo que sostienes por costumbre.",
    preguntas: ["¿Qué sostienes en silencio que ya terminó por dentro?", "¿Qué necesitas soltar sin anunciarlo?"],
    pasa: "Se revisa lo que ya terminó por dentro y lo que se sostiene en silencio por costumbre.",
  },
];

/** Qué significa que Plutón toque cada punto de tu carta. */
export const PUNTOS_PLUTON: Record<string, { nombre: string; texto: string }> = {
  sun: { nombre: "Sol", texto: "Se toca tu identidad y tu manera de brillar. Plutón pide revisar qué parte de ti has puesto al servicio de ser aceptado y cuál has dejado sin usar." },
  moon: { nombre: "Luna", texto: "Se tocan tus emociones y tu necesidad de seguridad. Lo que llevas dentro sube con más fuerza y se nota en el ánimo, en lo que necesitas de los demás y en lo que ya no estás dispuesto a sostener." },
  mercury: { nombre: "Mercurio", texto: "Se tocan tu mente y tu palabra. Las ideas, las conversaciones y lo que callas piden revisión: es un buen momento para decir con calma lo que quedó a medias." },
  venus: { nombre: "Venus", texto: "Se tocan lo que valoras y cómo quieres. Tus gustos, tus vínculos y el reparto de poder en ellos pasan por un examen profundo: la pregunta no es a quién quieres, sino desde dónde." },
  mars: { nombre: "Marte", texto: "Se tocan tu acción y tu deseo: lo que empujas y lo que contienes. Plutón convierte el impulso en decisión, y conviene frenar antes de actuar y elegir en qué gastas tu fuerza." },
  jupiter: { nombre: "Júpiter", texto: "Se tocan tu confianza y tu manera de crecer. Plutón examina en qué te expandes por convicción y en qué por inercia o por aprobación." },
  saturn: { nombre: "Saturno", texto: "Se tocan tus límites, tus compromisos y tu sentido de la responsabilidad. Plutón pide revisar qué estructuras sostienes por deber y cuáles por elección." },
  uranus: { nombre: "Urano", texto: "Se toca tu necesidad de libertad y de cambio de rumbo. Plutón convierte una inquietud en decisión: es el contacto que más empuja a soltar una vía conocida o a elegir otra." },
  neptune: { nombre: "Neptuno", texto: "Se tocan tus ideales y tus sueños. Plutón separa lo que de verdad te inspira de lo que solo te gustaría que fuera cierto." },
  pluto: { nombre: "Plutón natal", texto: "Se toca tu propio Plutón: tu relación personal con el poder, el control y los cambios profundos. Lo que ya sabías sobre cómo manejas el poder vuelve a pedir atención." },
  chiron: { nombre: "Quirón", texto: "Se toca la herida que más te enseña. Plutón trae a la superficie lo que ya sabías y no habías mirado de frente; es un contacto para tratar con cuidado y sin prisa." },
  asc: { nombre: "Ascendente", texto: "Se toca el modo en que te presentas y cómo te reciben. Este contacto depende mucho de la hora de nacimiento: si no la tienes segura, tómalo como una pista, no como un dato." },
  mc: { nombre: "Medio Cielo", texto: "Se toca tu lugar en el mundo y tu vocación. Plutón pregunta a quién sirve lo que haces y quién decide hacia dónde vas." },
};

/** Cómo vive cada signo lo que toca (para unir un punto de la carta con su signo). Índice 0 = Aries. */
export const SIGNO_MODO = [
  "de frente y con impulso",
  "despacio, con los sentidos y buscando lo seguro",
  "con palabras, curiosidad y movimiento",
  "cuidando y desde la memoria emocional",
  "con generosidad y necesidad de reconocimiento",
  "con atención al detalle, al servicio y a la autoexigencia",
  "buscando equilibrio y acuerdo",
  "a fondo, con intensidad y sin medias tintas",
  "con libertad, honestidad y ganas de ampliar la mirada",
  "con constancia, reserva y sentido del deber",
  "desde la amistad, la libertad y cierta distancia",
  "sin fronteras, con empatía e idealismo",
];

/** Qué representa cada punto de la carta, en pocas palabras. */
export const FUNCION: Record<string, string> = {
  sun: "tu manera de brillar",
  moon: "tus emociones y tu necesidad de seguridad",
  mercury: "tu mente y tu palabra",
  venus: "tu manera de querer y de valorar",
  mars: "tu manera de actuar y de desear",
  jupiter: "tu manera de crecer y de confiar",
  saturn: "tus límites y tus compromisos",
  uranus: "tu necesidad de libertad y de cambio",
  neptune: "tus ideales y tus sueños",
  pluto: "tu relación con el poder y con el cambio profundo",
  chiron: "la herida que más te enseña",
  asc: "tu manera de presentarte",
  mc: "tu lugar en el mundo",
};

export type AspectoPluton ="conjuncion" | "sextil" | "cuadratura" | "trigono" | "oposicion";

export const ASPECTOS_PLUTON: Record<AspectoPluton, { nombre: string; frase: string; matiz: string }> = {
  conjuncion: { nombre: "conjunción", frase: "en conjunción con", matiz: "La conjunción es el contacto más intenso: Plutón pasa justo encima de ese punto y lo activa de lleno." },
  oposicion: { nombre: "oposición", frase: "en oposición a", matiz: "La oposición se nota a través de los demás: lo ves reflejado en otras personas o en situaciones externas." },
  cuadratura: { nombre: "cuadratura", frase: "en cuadratura con", matiz: "La cuadratura añade tensión: te empuja a moverte y a decidir." },
  sextil: { nombre: "sextil", frase: "en sextil con", matiz: "El sextil es un contacto de apoyo: facilita que lo que reconoces se convierta en un paso concreto." },
  trigono: { nombre: "trígono", frase: "en trígono con", matiz: "El trígono es un contacto fluido: lo que se mueve encuentra cauce con poco esfuerzo, y por eso conviene no darlo por hecho." },
};

export const MATIZ_CERCA = "Plutón no llega a pasar exactamente por encima, pero se queda cerca: se nota como un eco, más en el ánimo que en los hechos.";

export const SIN_CONTACTOS =
  "Ningún punto de tu carta (Sol, Luna, Mercurio, Venus, Marte, Júpiter, Saturno, Urano, Neptuno, Plutón, Quirón, ascendente y Medio Cielo) recibe un contacto exacto de Plutón durante esta marea. No significa que pase de largo: lo vivirás sobre todo por la casa donde se mueve, que es lo que cuentan las secciones anteriores.";

export const INTRO_CIELO =
  "El 16 de octubre de 2026, a las 04:40 (hora de Madrid), Plutón se detiene a 3°04′ de Acuario y vuelve a avanzar. Estaba retrógrado desde el 6 de mayo, cuando se detuvo a 5°31′. Plutón entró en Acuario de forma definitiva el 19 de noviembre de 2024 y saldrá hacia Piscis el 19 de enero de 2044.\n\nCada año hace lo mismo: retrograda en mayo y vuelve a ir directo en octubre. Puedes leerlo como una marea. Retrógrado, la marea baja y deja a la vista lo que estaba bajo el agua; directo, la marea sube y lo visto pide decisión. «Retrógrado» es un efecto de perspectiva: desde la Tierra, Plutón parece ir hacia atrás, aunque no cambie de rumbo.\n\nPlutón es el planeta más lento: lo que empieza ahora se nota con meses de retraso, no de golpe. Estará directo hasta el 8 de mayo de 2027, cuando se detenga a 7°11′ de Acuario. En astrología, Plutón habla de poder, control y transformación profunda; Acuario, de lo colectivo, los ideales y la libertad. Juntos preguntan quién tiene el poder en lo que compartimos y a qué grupo perteneces de verdad.";

export const FASES = {
  baja: {
    titulo: "Del 6 de mayo al 16 de octubre de 2026 · La marea baja",
    texto:
      "Plutón se detuvo el 6 de mayo a 5°31′ de Acuario y retrocedió hasta 3°04′. Es la fase de mirar adentro: queda a la vista lo que estaba bajo el agua.\n\n**Qué mirar:** a quién le cedes tu poder, qué ideas defiendes sin haberlas examinado y qué grupos sostienes por inercia.\n\n**Qué cuidar:** las decisiones definitivas en caliente; lo que se ve en esta fase necesita tiempo antes de convertirse en acto.",
  },
  estacion: {
    titulo: "16 de octubre de 2026 · La estación",
    texto:
      "A las 04:40 (hora de Madrid) Plutón se detiene a 3°04′ de Acuario y cambia de sentido. La tradición considera que un planeta en estación concentra su influencia en ese grado; por eso se miran los días alrededor de esa fecha.\n\n**Qué mirar:** qué ha quedado claro desde mayo.\n\n**Qué cuidar:** las conclusiones tajantes. Plutón gira muy despacio y su efecto llega con retraso.",
  },
  alta: {
    titulo: "Del 16 de octubre de 2026 al 8 de mayo de 2027 · La marea alta",
    texto:
      "Plutón avanza de 3°04′ a 7°11′ de Acuario. Son 204 días, casi siete meses. Lo visto pide decisión y se concreta en pasos pequeños.\n\n**Qué mirar:** qué has decidido mantener y qué estás dispuesto a soltar.\n\n**Qué cuidar:** el vértigo de acelerar. Plutón transforma por acumulación, no por golpe.",
  },
  siguiente: {
    titulo: "Del 8 de mayo al 18 de octubre de 2027 · La marea baja otra vez",
    texto:
      "Plutón se detiene el 8 de mayo a 7°11′ de Acuario y retrocede hasta 4°45′, donde vuelve a ir directo el 18 de octubre. Es el segundo repaso de lo mismo, ahora con lo aprendido.\n\n**Qué mirar:** lo que se repite de una marea a otra.\n\n**Qué cuidar:** dar por cerrado lo que solo ha cambiado de forma.",
  },
};

export const CALENDARIO: { fecha: string; texto: string }[] = [
  { fecha: "19 de noviembre de 2024", texto: "Plutón entra en Acuario de forma definitiva (21:46)." },
  { fecha: "6 de mayo de 2026", texto: "Plutón se detiene y retrograda a 5°31′ de Acuario (17:34). Empieza la marea baja." },
  { fecha: "16 de octubre de 2026", texto: "Plutón se detiene y vuelve a ir directo a 3°04′ de Acuario (04:40). Empieza la marea alta." },
  { fecha: "8 de mayo de 2027", texto: "Plutón se detiene y retrograda a 7°11′ de Acuario (14:54). Termina la marea alta, tras 204 días directo." },
  { fecha: "18 de octubre de 2027", texto: "Plutón se detiene y vuelve a ir directo a 4°45′ de Acuario (05:53)." },
  { fecha: "19 de enero de 2044", texto: "Plutón sale de Acuario hacia Piscis (10:52)." },
];

export const TEXTO_CIERRE =
  "Esta guía parte de tu ascendente, tus casas y los puntos de tu carta que Plutón toca por grado durante esta marea. Es una lectura general: habla de tendencias, no de destinos. Tu carta natal completa dice mucho más: cómo se relacionan entre sí tu Plutón natal, tu Sol y tu Luna, y qué te piden estos meses.";
