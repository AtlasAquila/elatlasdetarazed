import { chainText, formatNumber, type LifePathCalc, type NameCalc, type NumberResult, type SumCalc } from "@/lib/numerology";

const PYTHAGOREAN_TABLE: [string, number][] = [
  ["A J S", 1],
  ["B K T", 2],
  ["C L U", 3],
  ["D M V", 4],
  ["E N W", 5],
  ["F O X", 6],
  ["G P Y", 7],
  ["H Q Z", 8],
  ["I R", 9],
];

function ResultLine({ label, r }: { label: string; r: NumberResult }) {
  return (
    <p className="small" style={{ marginTop: 10, marginBottom: 0 }}>
      {label}: <strong>{chainText(r)}</strong>
      {r.value > 9 ? ` (${formatNumber(r.value)})` : ""}
    </p>
  );
}

function CalcShell({ children }: { children: React.ReactNode }) {
  return (
    <details className="calc-details">
      <summary>Ver el cálculo</summary>
      <div className="calc-body">{children}</div>
    </details>
  );
}

/** Desglose de un número calculado a partir de un nombre: letra a letra y palabra a palabra. */
export function NameCalcDetail({ calc, label }: { calc: NameCalc; label: string }) {
  return (
    <CalcShell>
      <p className="small muted" style={{ marginBottom: 12 }}>
        Tabla pitagórica — {PYTHAGOREAN_TABLE.map(([letters, v]) => `${letters} = ${v}`).join(" · ")}.
      </p>
      {calc.words.map((w, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <p className="small" style={{ marginBottom: 2, fontWeight: 600 }}>
            {w.word.toUpperCase()}
          </p>
          <p className="small muted" style={{ marginBottom: 0 }}>
            {w.letters.map((l) => `${l.letter.toUpperCase()}=${l.value}`).join(" + ")} = {w.sum}
            {w.reduced.chain.length > 1 ? ` → ${chainText(w.reduced)}` : ""}
          </p>
        </div>
      ))}
      <p className="small" style={{ marginTop: 12, marginBottom: 0 }}>
        Suma de las palabras: {calc.words.map((w) => w.reduced.value).join(" + ")} = {calc.total}
      </p>
      <ResultLine label={label} r={calc.result} />
    </CalcShell>
  );
}

/** Desglose del camino de vida: día, mes y año reducidos por separado y luego sumados. */
export function DateCalcDetail({ calc }: { calc: LifePathCalc }) {
  return (
    <CalcShell>
      <p className="small muted" style={{ marginBottom: 12 }}>
        El día, el mes y el año se reducen por separado, y luego se suman sus resultados.
      </p>
      <p className="small" style={{ marginBottom: 4 }}>
        Día: {chainText(calc.day)}
      </p>
      <p className="small" style={{ marginBottom: 4 }}>
        Mes: {chainText(calc.month)}
      </p>
      <p className="small" style={{ marginBottom: 0 }}>
        Año: suma de sus cifras = {calc.yearDigitSum} → {chainText(calc.year)}
      </p>
      <p className="small" style={{ marginTop: 12, marginBottom: 0 }}>
        Suma: {calc.day.value} + {calc.month.value} + {calc.year.value} = {calc.sum}
      </p>
      <ResultLine label="Camino de vida" r={calc.result} />
    </CalcShell>
  );
}

/** Desglose de un número que se obtiene sumando otros dos ya calculados (la madurez). */
export function SumCalcDetail({ calc, label }: { calc: SumCalc; label: string }) {
  return (
    <CalcShell>
      <p className="small muted" style={{ marginBottom: 0 }}>
        {calc.parts.map((p) => `${p.label} (${p.value})`).join(" + ")} = {calc.sum}
      </p>
      <ResultLine label={label} r={calc.result} />
    </CalcShell>
  );
}
