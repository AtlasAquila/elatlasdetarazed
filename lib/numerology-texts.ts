/** Textos base de la numerología (plan gratuito). Escritos para El atlas de Tarazed. */

export type NumberMeaning = { name: string; keywords: string; text: string };

export const NUMBER_MEANINGS: Record<number, NumberMeaning> = {
  1: {
    name: "El iniciador",
    keywords: "Independencia · iniciativa · voluntad",
    text: "El 1 es el impulso de empezar. Habla de alguien que necesita abrir su propio camino, decidir por sí mismo y ver el resultado de su esfuerzo. Su reto es no confundir la autonomía con el aislamiento y aprender a liderar sin imponer.",
  },
  2: {
    name: "El mediador",
    keywords: "Cooperación · sensibilidad · diplomacia",
    text: "El 2 es el número del vínculo. Percibe lo que otros no dicen, busca el acuerdo y rinde mejor en compañía que en solitario. Su aprendizaje consiste en no diluirse en los demás: la delicadeza también necesita límites claros.",
  },
  3: {
    name: "El comunicador",
    keywords: "Expresión · creatividad · alegría",
    text: "El 3 necesita expresar lo que lleva dentro: con palabras, con arte, con humor. Contagia entusiasmo y encuentra salidas originales. El riesgo está en dispersarse en demasiados frentes; su fuerza crece cuando da forma y constancia a su talento.",
  },
  4: {
    name: "El constructor",
    keywords: "Orden · trabajo · estabilidad",
    text: "El 4 construye paso a paso. Aporta método, fiabilidad y paciencia, y se siente seguro cuando hay estructura. Su lección es no convertir la prudencia en rigidez: los cimientos sirven para sostener algo que crece, no para quedarse quieto.",
  },
  5: {
    name: "El explorador",
    keywords: "Libertad · cambio · curiosidad",
    text: "El 5 aprende viviendo. Necesita movimiento, experiencias nuevas y margen para cambiar de rumbo. Se adapta con rapidez y tiene un magnetismo inquieto. Su reto es encontrar una libertad que no dependa de huir y comprometerse sin sentirse encerrado.",
  },
  6: {
    name: "El protector",
    keywords: "Responsabilidad · cuidado · armonía",
    text: "El 6 es el número del hogar y del compromiso. Cuida, acompaña y se siente responsable de que las cosas estén en paz. Tiene un fuerte sentido estético y de la justicia. Su aprendizaje es cuidar sin controlar y aceptar que no todo depende de él.",
  },
  7: {
    name: "El buscador",
    keywords: "Introspección · análisis · espiritualidad",
    text: "El 7 quiere entender lo que hay detrás de las cosas. Necesita silencio, estudio y tiempo propio para pensar. Tiene intuición y profundidad, y desconfía de las respuestas fáciles. Su reto es no encerrarse en la mente y dejar que otros se acerquen.",
  },
  8: {
    name: "El realizador",
    keywords: "Poder · ambición · gestión",
    text: "El 8 sabe mover recursos y convertir ideas en resultados concretos. Tiene autoridad natural, visión práctica y resistencia. Su lección gira en torno al poder y el dinero: usarlos con ética y equilibrio, sin que el éxito lo defina por completo.",
  },
  9: {
    name: "El humanista",
    keywords: "Compasión · generosidad · cierre",
    text: "El 9 reúne lo aprendido en todos los números anteriores. Tiene una mirada amplia, sensibilidad hacia lo colectivo y facilidad para dar. Su aprendizaje es soltar: cerrar etapas, perdonar y no esperar que el mundo le devuelva lo mismo que entrega.",
  },
  11: {
    name: "El inspirador",
    keywords: "Intuición · visión · sensibilidad elevada · maestro (11/2)",
    text: "El 11 es un número maestro: intensifica la sensibilidad del 2 y la orienta hacia la inspiración. Capta ideas y emociones antes que los demás y puede iluminar a quien le rodea. La otra cara es la tensión nerviosa; necesita cuidar su calma para no desbordarse.",
  },
  22: {
    name: "El gran constructor",
    keywords: "Visión práctica · obra duradera · maestro (22/4)",
    text: "El 22 une la visión del 11 con la capacidad de concretar del 4. Es el número de quien puede levantar proyectos que trascienden lo personal. Su exigencia es alta: la presión de lo que podría llegar a hacer puede paralizarle si no avanza paso a paso.",
  },
  33: {
    name: "El maestro que cuida",
    keywords: "Entrega · enseñanza · compasión · maestro (33/6)",
    text: "El 33 lleva el cuidado del 6 a una escala mayor: enseñar, sanar, sostener a otros. Es poco frecuente y muy exigente. Su aprendizaje es servir sin sacrificarse del todo y aceptar que también necesita recibir.",
  },
};

export type PositionKey = "lifePath" | "expression" | "soul" | "personality" | "birthday" | "maturity" | "currentName";

export const POSITION_INFO: Record<PositionKey, { name: string; from: string; explains: string }> = {
  lifePath: {
    name: "Camino de vida",
    from: "Suma de la fecha de nacimiento completa",
    explains: "Es el número más importante de la numerología. Describe el rumbo general de la vida: el tipo de experiencias que se repiten, las lecciones de fondo y el terreno en el que la persona crece.",
  },
  expression: {
    name: "Expresión",
    from: "Suma de todas las letras del nombre completo",
    explains: "Habla de los talentos y recursos con los que se cuenta para recorrer el camino de vida: cómo se actúa, qué se sabe hacer bien y cómo se llega a los objetivos.",
  },
  soul: {
    name: "Número del alma",
    from: "Suma de las vocales del nombre",
    explains: "Refleja el deseo íntimo: lo que de verdad motiva y llena, aunque no siempre se muestre. Es la respuesta a qué necesita esta persona para sentirse en paz.",
  },
  personality: {
    name: "Personalidad",
    from: "Suma de las consonantes del nombre",
    explains: "Es la imagen que se proyecta: la primera impresión, la manera de presentarse y lo que los demás perciben antes de conocer a fondo.",
  },
  birthday: {
    name: "Día de nacimiento",
    from: "Día del mes en que se nació",
    explains: "Señala un talento concreto que acompaña al camino de vida, como una herramienta añadida que se tiene a mano de forma natural.",
  },
  maturity: {
    name: "Madurez",
    from: "Camino de vida + expresión",
    explains: "Indica hacia dónde se orienta la vida a partir de la mitad, cuando el camino y los talentos se integran. Suele notarse con más fuerza a partir de los cuarenta.",
  },
  currentName: {
    name: "Nombre de uso",
    from: "Letras del nombre con el que se le conoce hoy",
    explains: "Añade un matiz a la expresión: el nombre que se usa en el día a día (apodo, nombre de casada, nombre artístico) también colorea cómo se actúa y cómo se es percibido.",
  },
};

/** Descripciones breves de los apartados de la ficha. */
export const SECTION_INFO = {
  main: "Cada número se obtiene del nombre o de la fecha y se reduce a una sola cifra (del 1 al 9), salvo los números maestros 11, 22 y 33, que se conservan. Primero verás qué representa cada posición y después el número que le corresponde a esta persona.",
  cycle: "La numerología divide la vida en ciclos de nueve años que empiezan de nuevo tras el 9. El año personal marca el tono del año natural en curso (de enero a diciembre) y se calcula con el día y el mes de nacimiento más el año actual. El mes personal afina ese tono para el mes en curso: es el año personal más el número del mes.",
  cycleSame: "En septiembre el mes personal coincide siempre con el año personal, a todo el mundo. No es un error: septiembre es el mes 9, y sumar 9 no cambia el número reducido. Se interpreta como el mes en que la energía del año se concentra.",
  letters: "Cuenta cuántas letras del nombre completo corresponden a cada número del 1 al 9. El número más repetido muestra la energía dominante, lo que sale con facilidad.",
  lessons: "Son los números que no aparecen en ninguna letra del nombre. Señalan cualidades que no vienen dadas y que la vida invita a aprender.",
  debts: "Aparecen cuando al reducir un número principal surge un 13, 14, 16 o 19. Indican un aprendizaje que se vive con más exigencia hasta que se integra.",
};

export const PERSONAL_YEAR: Record<number, string> = {
  1: "Año de comienzos: sembrar, tomar la iniciativa y abrir un ciclo nuevo de nueve años.",
  2: "Año de paciencia y vínculos: lo sembrado crece despacio; cuentan la colaboración y los acuerdos.",
  3: "Año de expresión: vida social, creatividad y ganas de mostrarse.",
  4: "Año de trabajo y cimientos: orden, esfuerzo sostenido y asuntos prácticos.",
  5: "Año de cambios: movimiento, viajes, libertad y decisiones que rompen la rutina.",
  6: "Año de responsabilidades afectivas: hogar, familia, pareja y compromisos.",
  7: "Año de introspección: estudio, pausa y revisión interior antes de avanzar.",
  8: "Año de resultados: dinero, reconocimiento y gestión de lo construido.",
  9: "Año de cierre: soltar, terminar etapas y preparar el terreno para el siguiente ciclo.",
};

export const KARMIC_DEBT_TEXT: Record<number, string> = {
  13: "Deuda 13/4: aprender el valor del esfuerzo constante y no buscar atajos.",
  14: "Deuda 14/5: usar la libertad con medida y evitar los excesos.",
  16: "Deuda 16/7: dejar caer el orgullo y reconstruirse desde la humildad.",
  19: "Deuda 19/1: ser independiente sin cerrarse a la ayuda de los demás.",
};

/** Palabra clave breve de cada número, para lecciones kármicas y tablas. */
export const SHORT_KEYWORD: Record<number, string> = {
  1: "iniciativa y confianza en uno mismo",
  2: "cooperación y paciencia",
  3: "expresión y creatividad",
  4: "disciplina y orden",
  5: "adaptación y apertura al cambio",
  6: "responsabilidad y cuidado",
  7: "reflexión y fe interior",
  8: "gestión del poder y del dinero",
  9: "generosidad y desapego",
};
