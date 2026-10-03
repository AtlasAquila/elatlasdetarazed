import { localSiderealTime } from "@/lib/engine";
import {
  ASPECT_LABELS,
  BODY_LABELS,
  ELEMENT_NAMES,
  HOUSE_SYSTEM_LABELS,
  MODALITY_NAMES,
  POINT_LABELS,
  ROMAN,
  SIGN_ELEMENT,
  SIGN_GLYPHS,
  SIGN_NAMES,
  formatCoord,
  formatDegree,
  formatHMS,
  formatOrb,
  g,
} from "@/lib/engine/labels";
import type { Aspect, BodyPosition, Chart } from "@/lib/engine/types";

/** Piezas de la hoja de la carta: ficha, posiciones, casas, cuadrícula de aspectos y reparto por elementos. */

export type BirthData = {
  name: string;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:MM[:SS]
  timeUnknown: boolean;
  place: string;
  latitude: number;
  longitude: number;
  timeZone: string;
};

const signOf = (lon: number) => Math.floor((((lon % 360) + 360) % 360) / 30);
const glyphOf = (id: string) => POINT_LABELS[id]?.glyph ?? id;
const isText = (glyph: string) => glyph.length > 1; // "AC", "MC"

const PLANETS = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];

function Glyph({ id, className }: { id: string; className?: string }) {
  const glyph = glyphOf(id);
  return (
    <span className={`${isText(glyph) ? "pt-abbr" : "glyph-font"} ${className ?? ""}`} aria-hidden="true">
      {g(glyph)}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Ficha

export function ChartFacts({ birth, chart, kicker = "Carta natal" }: { birth: BirthData; chart: Chart; kicker?: string }) {
  const weekdayDate = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(birth.date + "T12:00:00Z"));
  const known = !birth.timeUnknown && birth.time;
  const [h, m] = (birth.time ?? "12:00").split(":").map(Number);
  const localTime = `${h}:${String(m).padStart(2, "0")}`;

  // Diferencia con UTC en la fecha de nacimiento (incluye horario de verano).
  const [y, mo, d] = birth.date.split("-").map(Number);
  const offsetMin = Math.round((Date.UTC(y, mo - 1, d, h, m) - new Date(chart.utc).getTime()) / 60000);
  const offset = `UTC${offsetMin >= 0 ? "+" : "−"}${Math.floor(Math.abs(offsetMin) / 60)}${Math.abs(offsetMin) % 60 ? `:${String(Math.abs(offsetMin) % 60).padStart(2, "0")}` : ""}`;

  const utc = new Date(chart.utc);
  const utTime = `${utc.getUTCHours()}:${String(utc.getUTCMinutes()).padStart(2, "0")}`;
  const utDiffDay = utc.getUTCDate() !== d;
  const utDate = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "UTC" }).format(utc);

  const sun = chart.bodies.find((b) => b.id === "sun")!;
  const moon = chart.bodies.find((b) => b.id === "moon")!;

  const facts: [string, string][] = [
    ["Fecha", weekdayDate],
    ["Hora local", known ? `${localTime} (${offset})` : "Desconocida"],
    ["Tiempo universal", known ? `${utTime}${utDiffDay ? ` del ${utDate}` : ""}` : "—"],
    ["Tiempo sidéreo", known ? formatHMS(localSiderealTime(chart.utc, birth.longitude)) : "—"],
    ["Lugar", birth.place],
    ["Coordenadas", `${formatCoord(birth.latitude, "N", "S")} · ${formatCoord(birth.longitude, "E", "O")}`],
    ["Zona horaria", birth.timeZone],
    ["Casas", chart.houses ? HOUSE_SYSTEM_LABELS[chart.houses.systemUsed] : "Sin casas (hora desconocida)"],
  ];

  const big3 = [
    { glyph: "☉", label: "Sol", sign: sun.sign },
    { glyph: "☽", label: "Luna", sign: moon.sign },
    ...(chart.angles ? [{ glyph: "AC", label: "Ascendente", sign: signOf(chart.angles.asc) }] : []),
  ];

  return (
    <div className="chart-facts">
      <div className="chart-facts-head">
        <div>
          <p className="kicker" style={{ marginBottom: 6 }}>
            {kicker}
          </p>
          <h1 className="chart-name">{birth.name}</h1>
        </div>
        <div className="big-three">
          {big3.map((x) => (
            <div key={x.label} className="big-three-item">
              <span className={isText(x.glyph) ? "pt-abbr" : "glyph-font"} aria-hidden="true">
                {g(x.glyph)}
              </span>
              <span>
                <span className="big-three-label">{x.label}</span>
                <span className="big-three-sign">
                  <span className="glyph-font" aria-hidden="true">
                    {g(SIGN_GLYPHS[x.sign])}
                  </span>{" "}
                  {SIGN_NAMES[x.sign]}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <dl className="facts-grid">
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Posiciones

export function PositionsTable({ bodies, chart }: { bodies: BodyPosition[]; chart: Chart }) {
  const rows = [
    ...bodies.map((b) => ({ id: b.id as string, name: BODY_LABELS[b.id].name, lon: b.longitude, house: b.house, retro: b.retrograde })),
    ...(chart.angles
      ? [
          { id: "asc", name: "Ascendente", lon: chart.angles.asc, house: null, retro: false },
          { id: "mc", name: "Medio Cielo", lon: chart.angles.mc, house: null, retro: false },
        ]
      : []),
  ];
  return (
    <div className="table-wrap">
      <table className="sheet-table">
        <thead>
          <tr>
            <th colSpan={2}>Punto</th>
            <th colSpan={2}>Posición</th>
            <th>Casa</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const s = signOf(r.lon);
            return (
              <tr key={r.id} className={r.id === "asc" ? "row-sep" : undefined}>
                <td className="cell-glyph">
                  <Glyph id={r.id} />
                </td>
                <td>{r.name}</td>
                <td className="cell-pos">
                  {formatDegree(r.lon)}
                  {r.retro && (
                    <span className="retro" title="Retrógrado">
                      ℞
                    </span>
                  )}
                </td>
                <td className="cell-sign" title={SIGN_NAMES[s]}>
                  <span className="glyph-font" aria-hidden="true">
                    {g(SIGN_GLYPHS[s])}
                  </span>
                  <span className="sign-name"> {SIGN_NAMES[s]}</span>
                </td>
                <td className="muted">{r.house ? ROMAN[r.house - 1] : ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Casas

export function HousesGrid({ chart }: { chart: Chart }) {
  if (!chart.houses) return null;
  return (
    <div className="houses-grid">
      {chart.houses.cusps.map((c, i) => {
        const s = signOf(c);
        return (
          <div key={i} className="house-cell">
            <span className="house-num">{ROMAN[i]}</span>
            <span className="house-pos">{formatDegree(c)}</span>
            <span className="glyph-font house-sign" title={SIGN_NAMES[s]}>
              {g(SIGN_GLYPHS[s])}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Cuadrícula de aspectos (triangular, como en las hojas clásicas)

export function AspectGrid({ points, aspects }: { points: string[]; aspects: Aspect[] }) {
  const byPair = new Map<string, Aspect>();
  for (const a of aspects) {
    byPair.set(`${a.a}|${a.b}`, a);
    byPair.set(`${a.b}|${a.a}`, a);
  }
  return (
    <div className="aspect-grid-wrap">
      <table className="aspect-grid" aria-label="Cuadrícula de aspectos">
        <tbody>
          {points.map((row, i) => (
            <tr key={row}>
              {points.slice(0, i).map((col) => {
                const a = byPair.get(`${row}|${col}`);
                if (!a) return <td key={col} className="ag-cell" />;
                const info = ASPECT_LABELS[a.type];
                const tone = info.nature === "tenso" ? "tense" : info.nature === "armónico" ? "soft" : "neutral";
                return (
                  <td key={col} className={`ag-cell ag-${tone}`} title={`${POINT_LABELS[row].name} ${info.name.toLowerCase()} ${POINT_LABELS[col].name} · orbe ${formatOrb(a.orb)}${a.applying === true ? " · aplicativo" : a.applying === false ? " · separativo" : ""}`}>
                    <span className="glyph-font ag-sym">{g(info.glyph)}</span>
                    <span className="ag-orb">
                      {Math.floor(a.orb)}°{String(Math.floor((a.orb % 1) * 60)).padStart(2, "0")}
                    </span>
                  </td>
                );
              })}
              <th scope="row" className="ag-diag">
                <Glyph id={row} />
              </th>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AspectLegend() {
  return (
    <p className="aspect-legend small muted">
      <span>
        <span className="glyph-font ag-sym ag-neutral">{g("☌")}</span> Conjunción
      </span>
      <span>
        <span className="glyph-font ag-sym ag-soft">{g("⚹")}</span> Sextil
      </span>
      <span>
        <span className="glyph-font ag-sym ag-tense">{g("□")}</span> Cuadratura
      </span>
      <span>
        <span className="glyph-font ag-sym ag-soft">{g("△")}</span> Trígono
      </span>
      <span>
        <span className="glyph-font ag-sym ag-tense">{g("☍")}</span> Oposición
      </span>
    </p>
  );
}

// ─────────────────────────────────────────────────────────────
// Elementos × modalidades

export function ElementGrid({ bodies, chart }: { bodies: BodyPosition[]; chart: Chart }) {
  const pts: { id: string; sign: number }[] = bodies.filter((b) => PLANETS.includes(b.id)).map((b) => ({ id: b.id, sign: b.sign }));
  if (chart.angles) {
    pts.push({ id: "asc", sign: signOf(chart.angles.asc) }, { id: "mc", sign: signOf(chart.angles.mc) });
  }
  const cell = (el: number, mod: number) => pts.filter((p) => SIGN_ELEMENT[p.sign] === el && p.sign % 3 === mod);
  const elTotal = (el: number) => pts.filter((p) => SIGN_ELEMENT[p.sign] === el).length;
  const modTotal = (mod: number) => pts.filter((p) => p.sign % 3 === mod).length;

  return (
    <div className="table-wrap">
      <table className="element-grid">
        <thead>
          <tr>
            <th />
            {MODALITY_NAMES.map((m) => (
              <th key={m}>{m}</th>
            ))}
            <th className="eg-total">Total</th>
          </tr>
        </thead>
        <tbody>
          {ELEMENT_NAMES.map((el, i) => (
            <tr key={el}>
              <th scope="row">{el}</th>
              {[0, 1, 2].map((mod) => (
                <td key={mod}>
                  {cell(i, mod).map((p) => (
                    <Glyph key={p.id} id={p.id} className="eg-glyph" />
                  ))}
                </td>
              ))}
              <td className="eg-total">{elTotal(i)}</td>
            </tr>
          ))}
          <tr>
            <th scope="row" className="eg-total">
              Total
            </th>
            {[0, 1, 2].map((mod) => (
              <td key={mod} className="eg-total">
                {modTotal(mod)}
              </td>
            ))}
            <td className="eg-total">{pts.length}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

