/**
 * Estrellas fijas de uso astrológico. Posiciones J2000 (ascensión recta en horas, declinación en grados)
 * del catálogo Hipparcos. La precesión hasta la fecha de nacimiento la calcula el motor.
 */
export type FixedStar = { name: string; ra: number; dec: number; constellation: string; magnitude: number };

const hms = (h: number, m: number, s: number) => h + m / 60 + s / 3600;
const dms = (d: number, m: number, s: number) => (d < 0 || Object.is(d, -0) ? -1 : 1) * (Math.abs(d) + m / 60 + s / 3600);

export const FIXED_STARS: FixedStar[] = [
  { name: "Achernar", ra: hms(1, 37, 42.8), dec: dms(-57, 14, 12), constellation: "Eridanus", magnitude: 0.5 },
  { name: "Hamal", ra: hms(2, 7, 10.4), dec: dms(23, 27, 45), constellation: "Aries", magnitude: 2.0 },
  { name: "Polaris", ra: hms(2, 31, 49.1), dec: dms(89, 15, 51), constellation: "Osa Menor", magnitude: 2.0 },
  { name: "Menkar", ra: hms(3, 2, 16.8), dec: dms(4, 5, 23), constellation: "Ballena", magnitude: 2.5 },
  { name: "Algol", ra: hms(3, 8, 10.1), dec: dms(40, 57, 20), constellation: "Perseo", magnitude: 2.1 },
  { name: "Alcíone (Pléyades)", ra: hms(3, 47, 29.1), dec: dms(24, 6, 18), constellation: "Tauro", magnitude: 2.9 },
  { name: "Aldebarán", ra: hms(4, 35, 55.2), dec: dms(16, 30, 33), constellation: "Tauro", magnitude: 0.9 },
  { name: "Rigel", ra: hms(5, 14, 32.3), dec: dms(-8, 12, 6), constellation: "Orión", magnitude: 0.1 },
  { name: "Capella", ra: hms(5, 16, 41.4), dec: dms(45, 59, 53), constellation: "Auriga", magnitude: 0.1 },
  { name: "Betelgeuse", ra: hms(5, 55, 10.3), dec: dms(7, 24, 25), constellation: "Orión", magnitude: 0.5 },
  { name: "Canopus", ra: hms(6, 23, 57.1), dec: dms(-52, 41, 45), constellation: "Carina", magnitude: -0.7 },
  { name: "Sirio", ra: hms(6, 45, 8.9), dec: dms(-16, 42, 58), constellation: "Can Mayor", magnitude: -1.5 },
  { name: "Cástor", ra: hms(7, 34, 35.9), dec: dms(31, 53, 18), constellation: "Géminis", magnitude: 1.6 },
  { name: "Proción", ra: hms(7, 39, 18.1), dec: dms(5, 13, 30), constellation: "Can Menor", magnitude: 0.4 },
  { name: "Pólux", ra: hms(7, 45, 18.9), dec: dms(28, 1, 34), constellation: "Géminis", magnitude: 1.1 },
  { name: "Régulo", ra: hms(10, 8, 22.3), dec: dms(11, 58, 2), constellation: "Leo", magnitude: 1.4 },
  { name: "Denébola", ra: hms(11, 49, 3.6), dec: dms(14, 34, 19), constellation: "Leo", magnitude: 2.1 },
  { name: "Vindemiatrix", ra: hms(13, 2, 10.6), dec: dms(10, 57, 33), constellation: "Virgo", magnitude: 2.8 },
  { name: "Espiga", ra: hms(13, 25, 11.6), dec: dms(-11, 9, 41), constellation: "Virgo", magnitude: 1.0 },
  { name: "Arturo", ra: hms(14, 15, 39.7), dec: dms(19, 10, 57), constellation: "Boyero", magnitude: -0.1 },
  { name: "Zuben Elgenubi", ra: hms(14, 50, 52.7), dec: dms(-16, 2, 30), constellation: "Libra", magnitude: 2.8 },
  { name: "Alphecca", ra: hms(15, 34, 41.3), dec: dms(26, 42, 53), constellation: "Corona Boreal", magnitude: 2.2 },
  { name: "Antares", ra: hms(16, 29, 24.4), dec: dms(-26, 25, 55), constellation: "Escorpio", magnitude: 1.1 },
  { name: "Vega", ra: hms(18, 36, 56.3), dec: dms(38, 47, 1), constellation: "Lira", magnitude: 0.0 },
  { name: "Altair", ra: hms(19, 50, 47.0), dec: dms(8, 52, 6), constellation: "Águila", magnitude: 0.8 },
  { name: "Alshain", ra: hms(19, 55, 18.8), dec: dms(6, 24, 24), constellation: "Águila", magnitude: 3.7 },
  { name: "Deneb", ra: hms(20, 41, 25.9), dec: dms(45, 16, 49), constellation: "Cisne", magnitude: 1.3 },
  { name: "Deneb Algedi", ra: hms(21, 47, 2.4), dec: dms(-16, 7, 38), constellation: "Capricornio", magnitude: 2.9 },
  { name: "Fomalhaut", ra: hms(22, 57, 39.0), dec: dms(-29, 37, 20), constellation: "Pez Austral", magnitude: 1.2 },
  { name: "Scheat", ra: hms(23, 3, 46.5), dec: dms(28, 4, 58), constellation: "Pegaso", magnitude: 2.4 },
  { name: "Markab", ra: hms(23, 4, 45.7), dec: dms(15, 12, 19), constellation: "Pegaso", magnitude: 2.5 },
];
