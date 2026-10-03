/** Contenido astrológico de referencia: signos, planetas, casas y aspectos. */

export type Sign = {
  name: string;
  glyph: string;
  dates: string;
  element: "Fuego" | "Tierra" | "Aire" | "Agua";
  modality: "Cardinal" | "Fijo" | "Mutable";
  ruler: string;
  keywords: string;
};

export const SIGNS: Sign[] = [
  { name: "Aries", glyph: "♈", dates: "21 mar – 19 abr", element: "Fuego", modality: "Cardinal", ruler: "Marte", keywords: "Iniciativa, valentía, impulso" },
  { name: "Tauro", glyph: "♉", dates: "20 abr – 20 may", element: "Tierra", modality: "Fijo", ruler: "Venus", keywords: "Estabilidad, placer, constancia" },
  { name: "Géminis", glyph: "♊", dates: "21 may – 20 jun", element: "Aire", modality: "Mutable", ruler: "Mercurio", keywords: "Curiosidad, palabra, versatilidad" },
  { name: "Cáncer", glyph: "♋", dates: "21 jun – 22 jul", element: "Agua", modality: "Cardinal", ruler: "Luna", keywords: "Cuidado, memoria, pertenencia" },
  { name: "Leo", glyph: "♌", dates: "23 jul – 22 ago", element: "Fuego", modality: "Fijo", ruler: "Sol", keywords: "Creatividad, orgullo, generosidad" },
  { name: "Virgo", glyph: "♍", dates: "23 ago – 22 sep", element: "Tierra", modality: "Mutable", ruler: "Mercurio", keywords: "Análisis, servicio, precisión" },
  { name: "Libra", glyph: "♎", dates: "23 sep – 22 oct", element: "Aire", modality: "Cardinal", ruler: "Venus", keywords: "Equilibrio, vínculo, belleza" },
  { name: "Escorpio", glyph: "♏", dates: "23 oct – 21 nov", element: "Agua", modality: "Fijo", ruler: "Marte (moderno: Plutón)", keywords: "Intensidad, transformación, profundidad" },
  { name: "Sagitario", glyph: "♐", dates: "22 nov – 21 dic", element: "Fuego", modality: "Mutable", ruler: "Júpiter", keywords: "Búsqueda, fe, horizonte" },
  { name: "Capricornio", glyph: "♑", dates: "22 dic – 19 ene", element: "Tierra", modality: "Cardinal", ruler: "Saturno", keywords: "Ambición, estructura, responsabilidad" },
  { name: "Acuario", glyph: "♒", dates: "20 ene – 18 feb", element: "Aire", modality: "Fijo", ruler: "Saturno (moderno: Urano)", keywords: "Originalidad, comunidad, libertad" },
  { name: "Piscis", glyph: "♓", dates: "19 feb – 20 mar", element: "Agua", modality: "Mutable", ruler: "Júpiter (moderno: Neptuno)", keywords: "Sensibilidad, imaginación, entrega" },
];

export type Planet = { name: string; glyph: string; meaning: string; cycle: string };

export const PLANETS: Planet[] = [
  { name: "Sol", glyph: "☉", meaning: "La identidad, la voluntad y la vitalidad: lo que eres en el centro.", cycle: "Un año en recorrer el zodiaco" },
  { name: "Luna", glyph: "☽", meaning: "Las emociones, las necesidades y los instintos: lo que te hace sentir a salvo.", cycle: "Unos 27 días" },
  { name: "Mercurio", glyph: "☿", meaning: "La mente, la palabra y el aprendizaje.", cycle: "Alrededor de un año" },
  { name: "Venus", glyph: "♀", meaning: "El amor, el placer, los valores y la estética.", cycle: "Alrededor de un año" },
  { name: "Marte", glyph: "♂", meaning: "La acción, el deseo y la forma de defenderte.", cycle: "Unos dos años" },
  { name: "Júpiter", glyph: "♃", meaning: "La expansión, la confianza y el sentido.", cycle: "Unos 12 años" },
  { name: "Saturno", glyph: "♄", meaning: "Los límites, la disciplina y la madurez.", cycle: "Unos 29 años" },
  { name: "Urano", glyph: "♅", meaning: "El cambio súbito, la libertad y la originalidad.", cycle: "Unos 84 años" },
  { name: "Neptuno", glyph: "♆", meaning: "La imaginación, la espiritualidad y la disolución de fronteras.", cycle: "Unos 165 años" },
  { name: "Plutón", glyph: "♇", meaning: "La transformación profunda, el poder y la regeneración.", cycle: "Unos 248 años" },
];

export type House = { number: string; title: string; meaning: string };

export const HOUSES: House[] = [
  { number: "I", title: "Identidad", meaning: "Tu carácter, tu cuerpo y cómo empiezas las cosas. Su cúspide es el Ascendente." },
  { number: "II", title: "Recursos", meaning: "Dinero, bienes, talentos y lo que valoras." },
  { number: "III", title: "Comunicación", meaning: "La mente cotidiana, los hermanos, el entorno cercano y los trayectos cortos." },
  { number: "IV", title: "Hogar", meaning: "La familia, las raíces y tu refugio íntimo. Su cúspide es el Fondo del Cielo." },
  { number: "V", title: "Creatividad", meaning: "El placer, el romance, el juego y los hijos." },
  { number: "VI", title: "Rutina", meaning: "El trabajo diario, los hábitos y el cuidado del cuerpo." },
  { number: "VII", title: "Pareja", meaning: "Las relaciones comprometidas, los socios y los acuerdos. Su cúspide es el Descendente." },
  { number: "VIII", title: "Transformación", meaning: "Las crisis, la intimidad y los recursos compartidos." },
  { number: "IX", title: "Horizontes", meaning: "Los viajes largos, los estudios superiores y las creencias." },
  { number: "X", title: "Vocación", meaning: "La carrera, las metas y la imagen pública. Su cúspide es el Medio Cielo." },
  { number: "XI", title: "Comunidad", meaning: "Las amistades, los grupos y los proyectos de futuro." },
  { number: "XII", title: "Lo oculto", meaning: "El inconsciente, el retiro y la espiritualidad." },
];

export type Aspect = { name: string; angle: string; nature: string; meaning: string };

export const ASPECTS: Aspect[] = [
  { name: "Conjunción", angle: "0°", nature: "Fusión", meaning: "Dos energías actúan como una sola; se potencian." },
  { name: "Sextil", angle: "60°", nature: "Armónico", meaning: "Una oportunidad que se aprovecha con un poco de esfuerzo." },
  { name: "Cuadratura", angle: "90°", nature: "Tenso", meaning: "Fricción que obliga a actuar y a crecer." },
  { name: "Trígono", angle: "120°", nature: "Armónico", meaning: "Fluidez natural; un talento que surge sin esfuerzo." },
  { name: "Oposición", angle: "180°", nature: "Tenso", meaning: "Dos polos que piden equilibrio, a menudo a través de los demás." },
];

/** Glifo astrológico mostrado como texto, no como emoji. */
export function textGlyph(g: string) {
  return g + "︎";
}
