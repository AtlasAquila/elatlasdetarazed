/**
 * Numerología pitagórica: cálculo exacto a partir del nombre completo y la fecha de nacimiento.
 *
 * Convenciones de El atlas de Tarazed:
 * - Tabla pitagórica: A J S = 1 · B K T = 2 · C L U = 3 · D M V = 4 · E N W = 5 · F O X = 6 · G P Y = 7 · H Q Z = 8 · I R = 9.
 * - Acentos y diéresis se ignoran; la ñ cuenta como n, la ç como c y la ele geminada (l·l) como dos eles.
 * - Vocales: a, e, i, o, u. La y cuenta como consonante.
 * - Los nombres se reducen palabra por palabra y luego se suman (método clásico), conservando los
 *   números maestros 11, 22 y 33.
 */

export const MASTER_NUMBERS = new Set([11, 22, 33]);
export const KARMIC_DEBTS = new Set([13, 14, 16, 19]);

export type NumberResult = {
  /** Número final (1–9, u 11, 22, 33). */
  value: number;
  /** Cadena de reducción desde la suma total, p. ej. [28, 10, 1]. */
  chain: number[];
  /** Deuda kármica (13, 14, 16 o 19) si aparece al reducir. */
  debt: number | null;
};

export type NumerologyProfile = {
  lifePath: NumberResult;
  expression: NumberResult;
  soul: NumberResult;
  personality: NumberResult;
  birthday: NumberResult;
  maturity: NumberResult;
  /** Expresión del nombre de uso, si se ha indicado y es distinto. */
  currentName: NumberResult | null;
  personalYear: { year: number; value: number };
  personalMonth: { month: number; value: number };
  /** Cuántas letras hay de cada valor (índice 1–9) en el nombre completo. */
  inclusion: number[];
  /** Números del 1 al 9 que no aparecen en el nombre completo. */
  karmicLessons: number[];
  /** Deudas kármicas presentes en cualquiera de los números principales. */
  debts: number[];
};

const digitSum = (n: number) =>
  String(n)
    .split("")
    .reduce((a, d) => a + Number(d), 0);

/** Reduce un número hasta una cifra, conservando los maestros si se pide. */
export function reduce(n: number, keepMasters = true): NumberResult {
  const chain = [n];
  let v = n;
  while (v > 9 && !(keepMasters && MASTER_NUMBERS.has(v))) {
    v = digitSum(v);
    chain.push(v);
  }
  const debt = chain.find((x) => KARMIC_DEBTS.has(x)) ?? null;
  return { value: v, chain, debt };
}

/** Normaliza un nombre en palabras de letras a–z. */
export function nameWords(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/l[·.•]l/g, "ll")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[\s\-_,]+/)
    .map((w) => w.replace(/[^a-z]/g, ""))
    .filter(Boolean);
}

export const letterValue = (ch: string) => ((ch.charCodeAt(0) - 97) % 9) + 1;
export const isVowel = (ch: string) => "aeiou".includes(ch);

/** El desglose letra a letra de una palabra: sus valores, la suma y la reducción de esa palabra. */
export type WordCalc = { word: string; letters: { letter: string; value: number }[]; sum: number; reduced: NumberResult };
/** El desglose completo de un nombre: cada palabra reducida por separado y luego sumadas. */
export type NameCalc = { words: WordCalc[]; total: number; result: NumberResult };

/** Igual que `nameNumber`, pero conservando el desglose letra a letra y palabra a palabra para mostrarlo. */
export function nameNumberDetailed(name: string, filter: (ch: string) => boolean = () => true): NameCalc {
  const words = nameWords(name)
    .map((w) => {
      const letters = w
        .split("")
        .filter(filter)
        .map((ch) => ({ letter: ch, value: letterValue(ch) }));
      const sum = letters.reduce((a, l) => a + l.value, 0);
      return { word: w, letters, sum, reduced: reduce(sum) };
    })
    .filter((w) => w.sum > 0);
  const total = words.reduce((a, w) => a + w.reduced.value, 0);
  const result = total ? reduce(total) : { value: 0, chain: [0], debt: null };
  return { words, total, result };
}

/** Suma de un nombre reduciendo palabra por palabra; `filter` elige qué letras cuentan. */
function nameNumber(name: string, filter: (ch: string) => boolean = () => true): NumberResult {
  return nameNumberDetailed(name, filter).result;
}

export type BirthDate = { year: number; month: number; day: number };

export function parseDate(iso: string): BirthDate {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month, day };
}

/** El desglose del camino de vida: día, mes y año reducidos por separado, y la suma final. */
export type LifePathCalc = {
  day: NumberResult;
  month: NumberResult;
  year: NumberResult;
  yearDigitSum: number;
  sum: number;
  result: NumberResult;
};

/** Igual que `lifePath`, pero conservando el desglose para mostrarlo. */
export function lifePathDetailed({ year, month, day }: BirthDate): LifePathCalc {
  const d = reduce(day);
  const m = reduce(month);
  const yearDigitSum = digitSum(year);
  const y = reduce(yearDigitSum);
  const sum = d.value + m.value + y.value;
  const r = reduce(sum);
  // La deuda también puede aparecer en la suma directa de todas las cifras.
  const direct = reduce(digitSum(day) + digitSum(month) + digitSum(year));
  return { day: d, month: m, year: y, yearDigitSum, sum, result: { ...r, debt: r.debt ?? direct.debt } };
}

export function lifePath(b: BirthDate): NumberResult {
  return lifePathDetailed(b).result;
}

/** Año personal (1–9) para el año indicado. */
export function personalYear(birth: BirthDate, year: number) {
  return reduce(reduce(birth.day).value + reduce(birth.month).value + reduce(digitSum(year)).value, false).value;
}

/** Fecha de hoy en España (los ciclos personales cambian a medianoche peninsular). */
export function todayInSpain(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return parseDate(parts);
}

export function computeNumerology(fullName: string, birthIso: string, currentName?: string | null, now = new Date()): NumerologyProfile {
  const birth = parseDate(birthIso);
  const lp = lifePath(birth);
  const expression = nameNumber(fullName);
  const soul = nameNumber(fullName, isVowel);
  const personality = nameNumber(fullName, (ch) => !isVowel(ch));
  const birthday = reduce(birth.day);
  const maturity = reduce(lp.value + expression.value);

  const sameName = !currentName || nameWords(currentName).join(" ") === nameWords(fullName).join(" ");
  const current = sameName ? null : nameNumber(currentName!);

  const inclusion = Array(10).fill(0) as number[];
  for (const w of nameWords(fullName)) for (const ch of w) inclusion[letterValue(ch)]++;
  const karmicLessons = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => inclusion[n] === 0);

  const today = todayInSpain(now);
  const py = personalYear(birth, today.year);
  const pm = reduce(py + today.month, false).value;

  const debts = [...new Set([lp.debt, expression.debt, soul.debt, personality.debt, birthday.debt].filter((d): d is number => d !== null))].sort((a, b) => a - b);

  return {
    lifePath: lp,
    expression,
    soul,
    personality,
    birthday,
    maturity,
    currentName: current,
    personalYear: { year: today.year, value: py },
    personalMonth: { month: today.month, value: pm },
    inclusion,
    karmicLessons,
    debts,
  };
}

/** Número mostrado: «11/2» para los maestros. */
export function formatNumber(v: number) {
  return MASTER_NUMBERS.has(v) ? `${v}/${digitSum(v)}` : String(v);
}

/** El desglose de un número que se obtiene sumando otros dos ya calculados (p. ej. la madurez). */
export type SumCalc = { parts: { label: string; value: number }[]; sum: number; result: NumberResult };

export function sumCalc(parts: { label: string; value: number }[]): SumCalc {
  const sum = parts.reduce((a, p) => a + p.value, 0);
  return { parts, sum, result: reduce(sum) };
}

export function chainText(r: NumberResult) {
  return r.chain.length > 1 ? r.chain.join(" → ") : String(r.value);
}

const describe = (label: string, r: NumberResult) => `${label}: ${formatNumber(r.value)} (reducción ${chainText(r)}${r.debt ? `; deuda kármica ${r.debt}` : ""})`;

/** Resumen en texto de los números de una persona, para la IA. */
export function numerologyFactsText(p: { fullName: string; currentName: string | null; birthDate: string; label: string | null }, n: NumerologyProfile): string {
  const lines = [
    `PERSONA: ${p.currentName || p.fullName}${p.label ? ` (relación con el usuario: ${p.label})` : ""}`,
    `Nombre completo de nacimiento: ${p.fullName}`,
    ...(p.currentName ? [`Nombre de uso: ${p.currentName}`] : []),
    `Fecha de nacimiento: ${p.birthDate}`,
    describe("Camino de vida", n.lifePath),
    describe("Expresión (nombre completo)", n.expression),
    describe("Número del alma (vocales)", n.soul),
    describe("Personalidad (consonantes)", n.personality),
    describe("Día de nacimiento", n.birthday),
    describe("Madurez", n.maturity),
    ...(n.currentName ? [describe("Expresión del nombre de uso", n.currentName)] : []),
    `Letras del nombre por valor: ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `${i}×${n.inclusion[i]}`).join(", ")}`,
    `Lecciones kármicas (números ausentes): ${n.karmicLessons.length ? n.karmicLessons.join(", ") : "ninguna"}`,
    `Deudas kármicas: ${n.debts.length ? n.debts.join(", ") : "ninguna"}`,
    `Año personal ${n.personalYear.year}: ${n.personalYear.value}; mes personal actual (${n.personalMonth.month}): ${n.personalMonth.value}`,
  ];
  return lines.join("\n");
}
