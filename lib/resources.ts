/** Recursos astrológicos de pago por lectura: sirven a /recursos y a una página de detalle por recurso. */
export type Resource = {
  slug: string;
  name: string;
  text: string;
  /** Dónde se pide la lectura. Sin él, el recurso está «en preparación». */
  href?: string;
};

export const RESOURCES: Resource[] = [
  {
    slug: "clima-astral-personalizado",
    name: "Clima astral personalizado",
    text: "Los tránsitos de los próximos 30 días colocados sobre tu carta natal: qué casas se activan, qué planetas lentos tocan tus puntos clave y qué lunaciones caen en tu carta. Una lectura extensa.",
    href: "/carta",
  },
  {
    slug: "revolucion-solar",
    name: "Revolución solar",
    text: "La carta calculada para el instante exacto en que el Sol vuelve a tu grado natal cada año, en el lugar donde te encuentres. Señala los temas que dominarán el año que empieza en tu cumpleaños. Con su lectura extensa.",
    href: "/carta",
  },
  {
    slug: "sinastria",
    name: "Sinastría",
    text: "La comparación entre dos cartas natales: cómo dialogan tus planetas con los de otra persona, en la pareja, la familia o el trabajo. Con su lectura extensa.",
    href: "/sinastria",
  },
  {
    slug: "retorno-de-saturno",
    name: "Retorno de Saturno",
    text: "El momento, hacia los 29 años y de nuevo hacia los 58, en que Saturno regresa a su posición de nacimiento: una etapa de maduración, responsabilidad y balance.",
  },
];

export function getResource(slug: string) {
  return RESOURCES.find((r) => r.slug === slug);
}
