import type { AspectType, BodyId, HouseSystem } from "./types";

export const SIGN_NAMES = ["Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo", "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis"];
export const SIGN_GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
/** 0 fuego · 1 tierra · 2 aire · 3 agua */
export const SIGN_ELEMENT = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3];
export const ELEMENT_NAMES = ["Fuego", "Tierra", "Aire", "Agua"];
export const MODALITY_NAMES = ["Cardinal", "Fija", "Mutable"];

export const BODY_LABELS: Record<BodyId, { name: string; glyph: string }> = {
  sun: { name: "Sol", glyph: "☉" },
  moon: { name: "Luna", glyph: "☽" },
  mercury: { name: "Mercurio", glyph: "☿" },
  venus: { name: "Venus", glyph: "♀" },
  mars: { name: "Marte", glyph: "♂" },
  jupiter: { name: "Júpiter", glyph: "♃" },
  saturn: { name: "Saturno", glyph: "♄" },
  uranus: { name: "Urano", glyph: "♅" },
  neptune: { name: "Neptuno", glyph: "♆" },
  pluto: { name: "Plutón", glyph: "♇" },
  chiron: { name: "Quirón", glyph: "⚷" },
  meanNode: { name: "Nodo Norte (medio)", glyph: "☊" },
  trueNode: { name: "Nodo Norte (verdadero)", glyph: "☊" },
  meanLilith: { name: "Lilith (media)", glyph: "⚸" },
  trueLilith: { name: "Lilith (verdadera)", glyph: "⚸" },
};

export const POINT_LABELS: Record<string, { name: string; glyph: string }> = {
  ...BODY_LABELS,
  asc: { name: "Ascendente", glyph: "AC" },
  mc: { name: "Medio Cielo", glyph: "MC" },
  dsc: { name: "Descendente", glyph: "DC" },
  ic: { name: "Fondo del Cielo", glyph: "FC" },
};

export const ASPECT_LABELS: Record<AspectType, { name: string; glyph: string; nature: "armónico" | "tenso" | "neutro" }> = {
  conjunction: { name: "Conjunción", glyph: "☌", nature: "neutro" },
  sextile: { name: "Sextil", glyph: "⚹", nature: "armónico" },
  square: { name: "Cuadratura", glyph: "□", nature: "tenso" },
  trine: { name: "Trígono", glyph: "△", nature: "armónico" },
  opposition: { name: "Oposición", glyph: "☍", nature: "tenso" },
};

export const HOUSE_SYSTEM_LABELS: Record<HouseSystem | "porphyry", string> = {
  placidus: "Placidus",
  koch: "Koch",
  equal: "Casas iguales",
  whole: "Signos enteros",
  porphyry: "Porfirio",
};

export const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

/** Glifo como texto (no emoji). */
export const g = (s: string) => (s.length === 1 ? s + "︎" : s);

/**
 * 354.4944 → "24° 29′ 39″"
 * Se trunca al segundo (no se redondea) para que un punto a 29° 59′ 59,6″ no aparezca
 * como "30° 00′ 00″" del signo anterior: así el texto siempre coincide con el signo calculado.
 */
export function formatDegree(lon: number) {
  const inSign = ((lon % 30) + 30) % 30;
  const totalSec = Math.min(Math.floor(inSign * 3600 + 1e-6), 30 * 3600 - 1);
  const d = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${d}° ${String(m).padStart(2, "0")}′ ${String(s).padStart(2, "0")}″`;
}

/** 354.4944 → "24° 29′ 39″ Piscis" */
export function formatPosition(lon: number) {
  return `${formatDegree(lon)} ${SIGN_NAMES[Math.floor((((lon % 360) + 360) % 360) / 30)]}`;
}

/** Grados y minutos dentro del signo, truncados: 29.8289 → { d: 29, m: "49" }. */
export function degMin(lon: number) {
  const inSign = ((lon % 30) + 30) % 30;
  const totalMin = Math.min(Math.floor(inSign * 60 + 1e-6), 30 * 60 - 1);
  return { d: Math.floor(totalMin / 60), m: String(totalMin % 60).padStart(2, "0") };
}

/** Orbe en grados y minutos: 2.3 → "2° 18′". */
export function formatOrb(orb: number) {
  const total = Math.floor(Math.abs(orb) * 60 + 1e-6);
  return `${Math.floor(total / 60)}° ${String(total % 60).padStart(2, "0")}′`;
}

/** Coordenada geográfica: (41.3833, "N", "S") → "41° 23′ N". */
export function formatCoord(value: number, pos: string, neg: string) {
  const total = Math.round(Math.abs(value) * 60);
  return `${Math.floor(total / 60)}° ${String(total % 60).padStart(2, "0")}′ ${value >= 0 ? pos : neg}`;
}

/** Horas decimales → "8:12:24". */
export function formatHMS(hours: number) {
  const total = Math.floor((((hours % 24) + 24) % 24) * 3600 + 1e-6);
  return `${Math.floor(total / 3600)}:${String(Math.floor((total % 3600) / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Abreviatura de signo: "Acu", "Gém"… */
export const SIGN_ABBR = ["Ari", "Tau", "Gém", "Cán", "Leo", "Vir", "Lib", "Esc", "Sag", "Cap", "Acu", "Pis"];
