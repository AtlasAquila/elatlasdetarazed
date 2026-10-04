import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Textos editables desde el panel (/admin/textos).
 * Cada texto tiene un valor por defecto aquí; si lo editas en el panel, se guarda en la base de datos
 * y se usa ese. Para las listas, cada línea es un elemento.
 */

export type TextField = {
  key: string;
  label: string;
  default: string;
  /** "line": una línea · "paragraph": párrafo · "list": una línea por elemento */
  kind: "line" | "paragraph" | "list";
};

export type TextGroup = { id: string; title: string; fields: TextField[] };

export const TEXT_GROUPS: TextGroup[] = [
  {
    id: "general",
    title: "General (cabecera y pie)",
    fields: [
      { key: "footer.tagline", label: "Lema del pie de página", kind: "line", default: "El cielo de cada nacimiento, cartografiado. Por Alshain." },
      { key: "footer.disclaimer", label: "Aviso del pie de página", kind: "paragraph", default: "Contenido orientativo; no sustituye el consejo médico, psicológico, legal ni financiero." },
    ],
  },
  {
    id: "portada",
    title: "Portada",
    fields: [
      { key: "home.hero.kicker", label: "Antetítulo", kind: "line", default: "Astrología de precisión" },
      { key: "home.hero.title", label: "Título principal", kind: "line", default: "El cielo de cada nacimiento, cartografiado." },
      { key: "home.hero.lead", label: "Texto de presentación", kind: "paragraph", default: "Cartas natales calculadas con precisión astronómica, el clima astral de cada semana y lecturas que interpretan tu cielo completo, no planeta por planeta." },
      { key: "home.hero.cta1", label: "Botón principal", kind: "line", default: "Descubre la astrología" },
      { key: "home.hero.cta2", label: "Botón secundario", kind: "line", default: "Únete a la lista de espera" },
      { key: "home.features.kicker", label: "Bloque «lo que estamos construyendo»: antetítulo", kind: "line", default: "Lo que estamos construyendo" },
      { key: "home.features.title", label: "Bloque «lo que estamos construyendo»: título", kind: "line", default: "Tu cielo, leído con rigor" },
      { key: "home.feature1.title", label: "Tarjeta 1: título", kind: "line", default: "Tu carta natal exacta" },
      { key: "home.feature1.text", label: "Tarjeta 1: texto", kind: "paragraph", default: "Posiciones calculadas a partir de efemérides astronómicas, con la zona horaria histórica de tu lugar de nacimiento. Incluye Quirón, Lilith y estrellas fijas." },
      { key: "home.feature2.title", label: "Tarjeta 2: título", kind: "line", default: "Una lectura de conjunto" },
      { key: "home.feature2.text", label: "Tarjeta 2: texto", kind: "paragraph", default: "Una interpretación que reúne planetas, casas y aspectos en un solo relato, en lugar de párrafos sueltos por cada posición." },
      { key: "home.feature3.title", label: "Tarjeta 3: título", kind: "line", default: "Un asistente que recuerda" },
      { key: "home.feature3.text", label: "Tarjeta 3: texto", kind: "paragraph", default: "Pregunta lo que quieras sobre tu carta. El asistente conoce tu cielo y recuerda lo que habéis hablado, aunque cierres sesión." },
      { key: "home.learn.title", label: "Bloque «aprende»: título", kind: "line", default: "Los fundamentos, explicados con calma" },
      { key: "home.learn.text", label: "Bloque «aprende»: texto", kind: "paragraph", default: "Qué son los signos, los planetas, las casas y los aspectos, y cómo nació un saber con más de tres mil años de historia." },
      { key: "home.waitlist.title", label: "Lista de espera: título", kind: "line", default: "Sé de los primeros en ver tu carta" },
      { key: "home.waitlist.text", label: "Lista de espera: texto", kind: "paragraph", default: "Te escribiremos una sola vez: cuando El atlas de Tarazed abra. Sin boletines ni publicidad." },
      { key: "home.author.title", label: "Bloque del autor: título", kind: "line", default: "Alshain, β Aquilae" },
      { key: "home.author.text", label: "Bloque del autor: texto", kind: "paragraph", default: "Alshain es la estrella que acompaña a Altair en la constelación del Águila. Es también la voz de El atlas de Tarazed: quien firma el clima astral de cada semana y te acompaña en la lectura de tu cielo." },
    ],
  },
  {
    id: "introduccion",
    title: "Introducción",
    fields: [
      { key: "intro.hero.title", label: "Título", kind: "line", default: "El cielo como guía del alma" },
      { key: "intro.hero.lead", label: "Texto de presentación", kind: "paragraph", default: "La carta es un mapa, no un destino\n\nLa astrología nos ofrece un lenguaje para comprender tendencias, potenciales y ciclos, pero una carta natal no puede entenderse a través de elementos aislados. Un planeta, un signo o una casa adquieren su verdadero significado cuando se interpretan en relación con el conjunto de la carta y con el momento vital de cada persona.\n\nDel mismo modo, la astrología no determina tu destino. Tu experiencia nace del encuentro entre tu carta, tu entorno, tu infancia, tu cultura, tus decisiones y aquello que, desde una perspectiva espiritual, podemos entender como tu misión de alma. Por eso, ciertos aspectos pueden cobrar especial importancia en unas etapas de la vida y permanecer en segundo plano en otras.\n\nMás que una herramienta para adivinar el futuro, la astrología puede ser un mapa para conocerte mejor, comprender tus ciclos y recorrer con mayor consciencia tu propio camino." },
    ],
  },
  {
    id: "fundamentos",
    title: "Fundamentos de la astrología",
    fields: [
      { key: "intro.signs.lead", label: "Signos: introducción", kind: "paragraph", default: "El zodiaco es la franja del cielo que recorren el Sol y los planetas, dividida en doce signos de 30°. Las fechas indican cuándo pasa el Sol por cada signo; pueden variar un día según el año." },
      { key: "intro.planets.lead", label: "Planetas: introducción", kind: "paragraph", default: "En astrología, el Sol y la Luna se cuentan entre los «planetas» por tradición: son los astros que se mueven sobre el fondo de las estrellas." },
      { key: "intro.houses.lead", label: "Casas: introducción", kind: "paragraph", default: "Las casas dividen el cielo local en doce sectores a partir del horizonte. Dependen de la hora y el lugar exactos del nacimiento: el Ascendente avanza aproximadamente un grado cada cuatro minutos." },
      { key: "intro.aspects.lead", label: "Aspectos: introducción", kind: "paragraph", default: "Un aspecto es un ángulo significativo entre dos planetas. Se admite un margen, llamado orbe, de unos pocos grados." },
      { key: "intro.history.title", label: "Historia: título", kind: "line", default: "Tres mil años mirando al cielo" },
    ],
  },
  {
    id: "blog",
    title: "Blog",
    fields: [
      { key: "blog.lead", label: "Texto de presentación", kind: "paragraph", default: "Astrología, ciencia, historia, mitología, conocimientos antiguos, revelaciones del alma y aprendizajes humanos: todo siendo uno." },
    ],
  },
  {
    id: "recursos",
    title: "Más recursos astrológicos",
    fields: [
      { key: "recursos.title", label: "Título", kind: "line", default: "Más técnicas para profundizar" },
      { key: "recursos.lead", label: "Texto de presentación", kind: "paragraph", default: "Más allá de la carta natal, la astrología ofrece otras técnicas para acompañar momentos y relaciones concretas. Iremos incorporando estas a El atlas de Tarazed." },
    ],
  },
  {
    id: "planes",
    title: "Planes",
    fields: [
      { key: "planes.title", label: "Título", kind: "line", default: "Empieza gratis" },
      { key: "planes.lead", label: "Texto de presentación", kind: "paragraph", default: "Estos son los planes previstos para el lanzamiento. Los precios incluyen el IVA." },
      { key: "planes.free.subtitle", label: "Plan gratuito: descripción", kind: "line", default: "Para conocer tu carta y aprender." },
      {
        key: "planes.free.items",
        label: "Plan gratuito: lista",
        kind: "list",
        default: [
          "Introducción, clima astral semanal y registro de lecturas",
          "Cartas natales ilimitadas, con Quirón, Lilith y estrellas fijas",
          "Hasta 3 cartas guardadas",
          "Lectura extensa y combinada de cada carta",
          "3 preguntas al asistente astrológico",
          "Numerología: hasta 10 personas con todos sus números explicados",
          "Diario de sueños con interpretación, memoria y patrones",
        ].join("\n"),
      },
      { key: "planes.premium.price", label: "Premium: precio mensual", kind: "line", default: "9,99 €" },
      { key: "planes.premium.subtitle", label: "Premium: precio anual", kind: "line", default: "O 69,99 € al año: cuatro meses de regalo." },
      {
        key: "planes.premium.items",
        label: "Premium: lista",
        kind: "list",
        default: [
          "Todo lo del plan gratuito",
          "Asistente con memoria: hasta 300 mensajes al mes",
          "Hasta 10 cartas guardadas",
          "Numerología: lecturas completas, compatibilidad entre personas y cruce con la carta astral",
          "Cancelación en un clic, cuando quieras",
        ].join("\n"),
      },
    ],
  },
];

export const ALL_FIELDS: TextField[] = TEXT_GROUPS.flatMap((g) => g.fields);
const DEFAULTS = new Map(ALL_FIELDS.map((f) => [f.key, f.default]));

export type Texts = {
  /** Texto por su clave. */
  t: (key: string) => string;
  /** Lista: una línea por elemento. */
  list: (key: string) => string[];
};

/** Lee los textos editados (una sola vez por petición) y los combina con los valores por defecto. */
export const getTexts = cache(async (): Promise<Texts> => {
  const overrides = new Map<string, string>();
  const supabase = await createClient();
  if (supabase) {
    const { data } = await supabase.from("site_texts").select("key, value");
    for (const row of data ?? []) overrides.set(row.key as string, row.value as string);
  }
  const t = (key: string) => overrides.get(key) ?? DEFAULTS.get(key) ?? "";
  const list = (key: string) =>
    t(key)
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  return { t, list };
});

/** Solo para el panel: los valores guardados, sin mezclar con los de por defecto. */
export async function getSavedTexts(): Promise<Record<string, string>> {
  const supabase = await createClient();
  if (!supabase) return {};
  const { data } = await supabase.from("site_texts").select("key, value");
  return Object.fromEntries((data ?? []).map((r) => [r.key as string, r.value as string]));
}
