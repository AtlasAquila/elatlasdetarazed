/** Tipos del motor de cálculo de Biblioteca Aquila. */

export type HouseSystem = "placidus" | "koch" | "equal" | "whole";

export type BodyId =
  | "sun"
  | "moon"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto"
  | "chiron"
  | "meanNode"
  | "trueNode"
  | "meanLilith"
  | "trueLilith";

export type ChartInput = {
  /** Fecha y hora locales tal como las da la persona. */
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number; // 0-59
  /** Zona horaria IANA del lugar de nacimiento (p. ej. "Europe/Madrid"). */
  timeZone: string;
  latitude: number; // grados, norte positivo
  longitude: number; // grados, este positivo
  houseSystem?: HouseSystem;
  /** Si la hora es desconocida: no se calculan casas ni ángulos. */
  timeUnknown?: boolean;
};

export type BodyPosition = {
  id: BodyId;
  /** Longitud eclíptica tropical, 0-360. */
  longitude: number;
  /** Velocidad en grados por día (negativa = retrógrado). */
  speed: number;
  retrograde: boolean;
  sign: number; // 0 = Aries … 11 = Piscis
  degreeInSign: number; // 0-30
  house: number | null; // 1-12
};

export type Aspect = {
  a: string;
  b: string;
  type: AspectType;
  angle: number;
  orb: number;
  applying: boolean | null;
};

export type AspectType = "conjunction" | "sextile" | "square" | "trine" | "opposition";

export type FixedStarContact = {
  star: string;
  starLongitude: number;
  point: string;
  orb: number;
};

export type Chart = {
  engine: { name: string; version: number };
  input: ChartInput;
  utc: string;
  julianDayUT: number;
  timeNotes: string[];
  bodies: BodyPosition[];
  angles: { asc: number; mc: number; dsc: number; ic: number } | null;
  houses: { system: HouseSystem; systemUsed: HouseSystem | "porphyry"; cusps: number[] } | null;
  aspects: Aspect[];
  fixedStars: FixedStarContact[];
};
