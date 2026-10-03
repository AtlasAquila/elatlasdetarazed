import { ASPECT_LABELS, BODY_LABELS, ROMAN, SIGN_ELEMENT, SIGN_GLYPHS, degMin, g } from "@/lib/engine/labels";
import type { Chart } from "@/lib/engine/types";

/**
 * Rueda de la carta natal en SVG, con el estilo de El atlas de Tarazed.
 * El Ascendente se sitúa a la izquierda; el zodiaco avanza en sentido antihorario.
 * Los ejes (AC–DC, MC–IC) cruzan la rueda y se rotulan fuera con su grado.
 */

type Props = {
  chart: Chart;
  /** Cuerpos que se muestran (por id). */
  show: Set<string>;
  /** Oculta casas y ejes aunque la carta los traiga calculados (p. ej. el clima astral en directo). */
  hideHouses?: boolean;
};

const SIZE = 760;
const C = SIZE / 2;
const R_OUT = 316; // borde exterior del anillo de signos
const R_SIGNS_IN = 270; // borde interior del anillo de signos
const R_GLYPH = 238; // glifo del planeta
const R_DEG = 211; // grado del planeta
const R_RETRO = 193; // marca de retrógrado
const R_ASPECT = 178; // círculo de aspectos
const R_HOUSE_NUM = 70; // números de casa
const R_HUB = 44; // centro

const ELEMENT_FILL = ["var(--wheel-fire)", "var(--wheel-earth)", "var(--wheel-air)", "var(--wheel-water)"];

/**
 * Fase lunar como fracción del ciclo (0 = luna nueva, 0.25 = cuarto creciente,
 * 0.5 = luna llena, 0.75 = cuarto menguante), a partir de la elongación
 * Sol–Luna. En 0° Sol y Luna están en conjunción (luna nueva); en 180°, en
 * oposición (luna llena). No requiere ningún dato más allá de las longitudes
 * ya calculadas por el motor.
 */
function moonPhaseFraction(chart: Chart): number | null {
  const sunLon = chart.bodies.find((b) => b.id === "sun")?.longitude;
  const moonLon = chart.bodies.find((b) => b.id === "moon")?.longitude;
  if (sunLon == null || moonLon == null) return null;
  const elongation = (((moonLon - sunLon) % 360) + 360) % 360;
  return elongation / 360;
}

const MOON_PHASE_NAMES = ["Luna nueva", "Creciente iluminante", "Cuarto creciente", "Gibosa creciente", "Luna llena", "Gibosa menguante", "Cuarto menguante", "Creciente menguante"];

function moonPhaseName(p: number): string {
  const idx = Math.round(p * 8) % 8;
  return MOON_PHASE_NAMES[idx];
}

/**
 * Recorta el disco lunar en la parte iluminada, para una fracción de fase p
 * (0..1) y un radio r, centrado en el origen. Técnica estándar: un semicírculo
 * fijo (el "limbo") combinado con una elipse cuyo semieje horizontal marca el
 * terminador; su signo decide si el resultado es un gajo (creciente/menguante,
 * intersección) o una fase gibosa (unión), y en los cuartos se reduce a una
 * línea recta, dando el medio disco exacto.
 */
function moonPhasePath(r: number, p: number): string {
  const theta = p * 2 * Math.PI;
  const rx = Math.abs(r * Math.cos(theta));
  const sweep1 = p < 0.5 ? 1 : 0;
  const nearNew = p < 0.25 || p > 0.75;
  const sweep2 = nearNew ? 1 - sweep1 : sweep1;
  return `M 0 ${-r} A ${r} ${r} 0 0 ${sweep1} 0 ${r} A ${rx} ${r} 0 0 ${sweep2} 0 ${-r} Z`;
}

export function ChartWheel({ chart, show, hideHouses }: Props) {
  const angles = hideHouses ? null : chart.angles;
  const houses = hideHouses ? null : chart.houses;
  const rotation = angles ? angles.asc : 0;
  const angle = (lon: number) => ((180 + lon - rotation) * Math.PI) / 180;
  const pt = (lon: number, r: number) => {
    const a = angle(lon);
    return { x: C + r * Math.cos(a), y: C - r * Math.sin(a) };
  };
  const arc = (lon1: number, lon2: number, r1: number, r2: number) => {
    const p1 = pt(lon1, r1);
    const p2 = pt(lon2, r1);
    const p3 = pt(lon2, r2);
    const p4 = pt(lon1, r2);
    return `M${p1.x},${p1.y} A${r1},${r1} 0 0 0 ${p2.x},${p2.y} L${p3.x},${p3.y} A${r2},${r2} 0 0 1 ${p4.x},${p4.y} Z`;
  };

  const bodies = chart.bodies.filter((b) => show.has(b.id));

  // Separa los glifos que caen demasiado juntos (en grados de la rueda).
  const MIN_SEP = 8;
  const sorted = [...bodies].sort((a, b) => a.longitude - b.longitude);
  const placed = sorted.map((b) => ({ id: b.id, lon: b.longitude, display: b.longitude, retro: b.retrograde }));
  for (let pass = 0; pass < 20 && placed.length > 1; pass++) {
    let moved = false;
    for (let i = 0; i < placed.length; i++) {
      const a = placed[i];
      const b = placed[(i + 1) % placed.length];
      let gap = b.display - a.display;
      if (i === placed.length - 1) gap += 360;
      if (gap < MIN_SEP) {
        const push = (MIN_SEP - gap) / 2;
        a.display -= push;
        b.display += push;
        moved = true;
      }
    }
    if (!moved) break;
  }

  const moonPhase = moonPhaseFraction(chart);

  const aspectIds = new Set(bodies.map((b) => b.id as string));
  if (angles) {
    aspectIds.add("asc");
    aspectIds.add("mc");
  }
  const lonOf = (id: string) => {
    if (id === "asc") return angles?.asc ?? 0;
    if (id === "mc") return angles?.mc ?? 0;
    return chart.bodies.find((b) => b.id === id)?.longitude ?? 0;
  };
  const aspects = chart.aspects.filter((a) => a.type !== "conjunction" && aspectIds.has(a.a) && aspectIds.has(a.b));

  const axes = angles
    ? [
        { lon: angles.asc, label: "AC", name: "Ascendente" },
        { lon: angles.dsc, label: "DC", name: "Descendente" },
        { lon: angles.mc, label: "MC", name: "Medio Cielo" },
        { lon: angles.ic, label: "FC", name: "Fondo del Cielo" },
      ]
    : [];

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Rueda de la carta natal" className="chart-wheel">
      <circle cx={C} cy={C} r={R_OUT} fill="var(--wheel-ring)" />

      {/* Signos */}
      {SIGN_GLYPHS.map((glyph, i) => {
        const start = i * 30;
        const mid = pt(start + 15, (R_OUT + R_SIGNS_IN) / 2);
        return (
          <g key={glyph}>
            <path d={arc(start, start + 30, R_OUT, R_SIGNS_IN)} fill={ELEMENT_FILL[SIGN_ELEMENT[i]]} stroke="var(--estrella)" strokeWidth={0.8} strokeOpacity={0.7} />
            <text x={mid.x} y={mid.y} className="wheel-glyph" fontSize={26} fill="var(--oro)" textAnchor="middle" dominantBaseline="central">
              {g(glyph)}
            </text>
          </g>
        );
      })}

      {/* Marcas de grados: cada grado, más largas cada 5° y 10° */}
      {Array.from({ length: 360 }, (_, lon) => {
        const len = lon % 10 === 0 ? 10 : lon % 5 === 0 ? 7 : 3.5;
        const a = pt(lon, R_SIGNS_IN);
        const b = pt(lon, R_SIGNS_IN - len);
        return <line key={lon} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--estrella)" strokeWidth={lon % 5 === 0 ? 0.8 : 0.5} strokeOpacity={0.75} />;
      })}

      <circle cx={C} cy={C} r={R_OUT} fill="none" stroke="var(--oro)" strokeWidth={2} />
      <circle cx={C} cy={C} r={R_SIGNS_IN} fill="none" stroke="var(--oro)" strokeWidth={1.2} />
      <circle cx={C} cy={C} r={R_ASPECT} fill="var(--surface)" stroke="var(--estrella)" strokeWidth={0.8} strokeOpacity={0.8} />

      {/* Casas: cúspides y números alrededor del centro */}
      {houses?.cusps.map((cusp, i) => {
        const isAxis = i % 3 === 0;
        const a = pt(cusp, R_SIGNS_IN);
        const b = pt(cusp, R_ASPECT);
        const c = pt(cusp, R_HUB);
        const next = houses!.cusps[(i + 1) % 12];
        const span = (((next - cusp) % 360) + 360) % 360;
        const label = pt(cusp + span / 2, R_HOUSE_NUM);
        return (
          <g key={i}>
            {!isAxis && (
              <>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--estrella)" strokeWidth={0.8} strokeOpacity={0.6} />
                <line x1={b.x} y1={b.y} x2={c.x} y2={c.y} stroke="var(--estrella)" strokeWidth={0.6} strokeOpacity={0.22} />
              </>
            )}
            <text x={label.x} y={label.y} fontSize={12} fill="var(--ink-muted)" textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-display), Georgia, serif">
              {ROMAN[i]}
            </text>
          </g>
        );
      })}

      {/* Aspectos */}
      <g>
        {aspects.map((a, i) => {
          const p = pt(lonOf(a.a), R_ASPECT);
          const q = pt(lonOf(a.b), R_ASPECT);
          const tense = ASPECT_LABELS[a.type].nature === "tenso";
          return (
            <line
              key={i}
              x1={p.x}
              y1={p.y}
              x2={q.x}
              y2={q.y}
              stroke={tense ? "var(--error)" : "var(--azul-cielo)"}
              strokeWidth={a.orb < 2 ? 1.6 : 1}
              strokeOpacity={a.orb < 2 ? 0.95 : 0.65}
              strokeDasharray={a.type === "sextile" ? "5 4" : undefined}
            />
          );
        })}
      </g>

      <circle cx={C} cy={C} r={R_HUB} fill="var(--surface)" stroke="var(--estrella)" strokeWidth={0.8} strokeOpacity={0.6} />

      {/* Ejes: atraviesan la rueda y se rotulan por fuera con su grado */}
      {axes.map((ax) => {
        const inner = pt(ax.lon, R_HUB);
        const outer = pt(ax.lon, R_OUT + 12);
        const lab = pt(ax.lon, R_OUT + 30);
        const dm = degMin(ax.lon);
        return (
          <g key={ax.label}>
            <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="var(--oro)" strokeWidth={2} />
            <text x={lab.x} y={lab.y - 7} fontSize={17} fontWeight={600} fill="var(--oro)" textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-display), Georgia, serif">
              {ax.label}
            </text>
            <text x={lab.x} y={lab.y + 11} fontSize={12} fill="var(--estrella)" textAnchor="middle" dominantBaseline="central">
              {dm.d}°{dm.m}′
            </text>
            <title>{ax.name}</title>
          </g>
        );
      })}

      {/* Planetas */}
      {placed.map((p) => {
        const exact = pt(p.lon, R_SIGNS_IN);
        const tick = pt(p.lon, R_SIGNS_IN - 12);
        const dot = pt(p.lon, R_ASPECT);
        const glyphPos = pt(p.display, R_GLYPH);
        const degPos = pt(p.display, R_DEG);
        const retroPos = pt(p.display, R_RETRO);
        const label = BODY_LABELS[p.id];
        const big = p.id === "sun" || p.id === "moon";
        const dm = degMin(p.lon);
        const isMoon = p.id === "moon" && moonPhase != null;
        const moonClipId = `moon-clip-${p.id}-${Math.round(p.lon * 100)}`;
        return (
          <g key={p.id}>
            <line x1={exact.x} y1={exact.y} x2={tick.x} y2={tick.y} stroke="var(--oro)" strokeWidth={1.6} />
            <line x1={tick.x} y1={tick.y} x2={glyphPos.x} y2={glyphPos.y} stroke="var(--estrella)" strokeWidth={0.5} strokeOpacity={0.45} />
            <circle cx={dot.x} cy={dot.y} r={2.2} fill="var(--oro)" />
            {isMoon ? (
              <g transform={`translate(${glyphPos.x},${glyphPos.y})`}>
                <circle cx={0} cy={0} r={14} fill="var(--wheel-ring)" />
                <defs>
                  <clipPath id={moonClipId}>
                    <circle cx={0} cy={0} r={7.5} />
                  </clipPath>
                </defs>
                {/* Disco base: lado oscuro (vacío) del ciclo lunar */}
                <circle cx={0} cy={0} r={7.5} fill="var(--wheel-ring)" />
                {/* Gajo iluminado, recortado al disco */}
                <path d={moonPhasePath(7.5, moonPhase!)} fill="var(--oro)" clipPath={`url(#${moonClipId})`} />
                <circle cx={0} cy={0} r={7.5} fill="none" stroke="var(--oro)" strokeWidth={1} strokeOpacity={0.85} />
              </g>
            ) : (
              <>
                <circle cx={glyphPos.x} cy={glyphPos.y} r={14} fill="var(--wheel-ring)" />
                <text x={glyphPos.x} y={glyphPos.y} className="wheel-glyph" fontSize={big ? 24 : 21} fill={big ? "var(--oro)" : "var(--estrella)"} textAnchor="middle" dominantBaseline="central">
                  {g(label.glyph)}
                </text>
              </>
            )}
            <text x={degPos.x} y={degPos.y} fontSize={14} fill="var(--estrella)" textAnchor="middle" dominantBaseline="central">
              {dm.d}
              <tspan fontSize={9.5} dy={-5} fill="var(--ink-muted)">
                {dm.m}
              </tspan>
            </text>
            {p.retro && (
              <text x={retroPos.x} y={retroPos.y} fontSize={11} fill="var(--error)" textAnchor="middle" dominantBaseline="central">
                ℞
              </text>
            )}
            <title>{`${label.name}${isMoon ? ` · ${moonPhaseName(moonPhase!)}` : ""}${p.retro ? " (retrógrado)" : ""}`}</title>
          </g>
        );
      })}
    </svg>
  );
}
