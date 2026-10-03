import { ASPECT_LABELS, BODY_LABELS, ROMAN, SIGN_ELEMENT, SIGN_GLYPHS, degMin, g } from "@/lib/engine/labels";
import type { Aspect, BodyPosition, Chart } from "@/lib/engine/types";

/**
 * Rueda doble de la sinastría: los planetas de A en el anillo exterior, los de B en el interior,
 * con un anillo propio para los números de las casas entre ambos (las casas superpuestas van solo
 * en ese sentido: las de A). Ejes (AC–DC, MC–IC) de A rotulados fuera, como en la rueda natal.
 */

type Props = {
  chartA: Chart;
  chartB: Chart;
  nameA: string;
  nameB: string;
  bodiesA: BodyPosition[];
  bodiesB: BodyPosition[];
  crossAspects: Aspect[];
};

const SIZE = 760;
const C = SIZE / 2;
const R_OUT = 316; // borde exterior del anillo de signos
const R_SIGNS_IN = 270; // borde interior del anillo de signos
const R_TICKS_IN = 258; // fin de las marcas de grado
const R_GLYPH_A = 244; // glifos de A (exterior)
const R_DEG_A = 220;
const R_DOT_A = 204; // longitud exacta de A / arranque de los aspectos cruzados
const R_HOUSE_NUM = 187; // números de casa, en su propio anillo
const R_MID = 170; // límite entre el anillo de casas y el de B
const R_GLYPH_B = 142; // glifos de B (interior)
const R_DEG_B = 120;
const R_DOT_B = 104; // longitud exacta de B / llegada de los aspectos cruzados
const R_HUB = 42;

const ELEMENT_FILL = ["var(--wheel-fire)", "var(--wheel-earth)", "var(--wheel-air)", "var(--wheel-water)"];

function place(bodies: BodyPosition[]) {
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
  return placed;
}

export function SynastryWheel({ chartA, nameA, nameB, bodiesA, bodiesB, crossAspects }: Props) {
  const angles = chartA.angles;
  const houses = chartA.houses;
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

  const placedA = place(bodiesA);
  const placedB = place(bodiesB);
  const lonA = (id: string) => bodiesA.find((b) => b.id === id)?.longitude ?? 0;
  const lonB = (id: string) => bodiesB.find((b) => b.id === id)?.longitude ?? 0;

  const axes = angles
    ? [
        { lon: angles.asc, label: "AC", name: "Ascendente de " + nameA },
        { lon: angles.mc, label: "MC", name: "Medio Cielo de " + nameA },
        { lon: angles.dsc, label: "DC", name: "Descendente de " + nameA },
        { lon: angles.ic, label: "FC", name: "Fondo del Cielo de " + nameA },
      ]
    : [];

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Rueda de la sinastría" className="chart-wheel">
      <circle cx={C} cy={C} r={R_OUT} fill="var(--wheel-ring)" />

      {/* Signos */}
      {SIGN_GLYPHS.map((glyph, i) => {
        const start = i * 30;
        const mid = pt(start + 15, (R_OUT + R_SIGNS_IN) / 2);
        return (
          <g key={glyph}>
            <path d={arc(start, start + 30, R_OUT, R_SIGNS_IN)} fill={ELEMENT_FILL[SIGN_ELEMENT[i]]} stroke="var(--estrella)" strokeWidth={0.8} strokeOpacity={0.7} />
            <text x={mid.x} y={mid.y} className="wheel-glyph" fontSize={24} fill="var(--oro)" textAnchor="middle" dominantBaseline="central">
              {g(glyph)}
            </text>
          </g>
        );
      })}

      {/* Marcas de grado alrededor del zodiaco */}
      {Array.from({ length: 360 }, (_, lon) => {
        const len = lon % 10 === 0 ? 9 : lon % 5 === 0 ? 6 : 3;
        const a = pt(lon, R_SIGNS_IN);
        const b = pt(lon, R_SIGNS_IN - len);
        return <line key={lon} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--estrella)" strokeWidth={lon % 5 === 0 ? 0.8 : 0.5} strokeOpacity={0.7} />;
      })}

      <circle cx={C} cy={C} r={R_OUT} fill="none" stroke="var(--oro)" strokeWidth={2} />
      <circle cx={C} cy={C} r={R_SIGNS_IN} fill="none" stroke="var(--oro)" strokeWidth={1.2} />
      <circle cx={C} cy={C} r={R_DOT_A} fill="none" stroke="var(--oro)" strokeWidth={0.8} strokeOpacity={0.35} />
      <circle cx={C} cy={C} r={R_MID} fill="none" stroke="var(--oro)" strokeWidth={0.8} strokeOpacity={0.35} />

      {/* Casas de A: cúspides que atraviesan la rueda, números en su propio anillo */}
      {houses?.cusps.map((cusp, i) => {
        const isAxis = i % 3 === 0;
        const a = pt(cusp, R_SIGNS_IN);
        const b = pt(cusp, R_DOT_A);
        const c = pt(cusp, R_HUB);
        const next = houses!.cusps[(i + 1) % 12];
        const span = (((next - cusp) % 360) + 360) % 360;
        const label = pt(cusp + span / 2, R_HOUSE_NUM);
        return (
          <g key={i}>
            {!isAxis && (
              <>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--estrella)" strokeWidth={0.7} strokeOpacity={0.35} />
                <line x1={b.x} y1={b.y} x2={c.x} y2={c.y} stroke="var(--estrella)" strokeWidth={0.6} strokeOpacity={0.2} />
              </>
            )}
            <text x={label.x} y={label.y} fontSize={15} fill="var(--estrella)" textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-display), Georgia, serif">
              {ROMAN[i]}
            </text>
          </g>
        );
      })}

      {/* Aspectos cruzados: de A (anillo exterior) a B (anillo interior) */}
      <g>
        {crossAspects.map((a, i) => {
          const p = pt(lonA(a.a), R_DOT_A);
          const q = pt(lonB(a.b), R_DOT_B);
          const tense = ASPECT_LABELS[a.type].nature === "tenso";
          return (
            <line
              key={i}
              x1={p.x}
              y1={p.y}
              x2={q.x}
              y2={q.y}
              stroke={tense ? "var(--error)" : ASPECT_LABELS[a.type].nature === "armónico" ? "var(--azul-cielo)" : "var(--oro)"}
              strokeWidth={a.orb < 2 ? 1.4 : 0.9}
              strokeOpacity={a.orb < 2 ? 0.85 : 0.55}
              strokeDasharray={a.type === "sextile" ? "5 4" : undefined}
            />
          );
        })}
      </g>

      <circle cx={C} cy={C} r={R_HUB} fill="var(--surface)" stroke="var(--estrella)" strokeWidth={0.8} strokeOpacity={0.6} />

      {/* Ejes de A: atraviesan la rueda y se rotulan por fuera, como en la carta natal */}
      {axes.map((ax) => {
        const inner = pt(ax.lon, R_HUB);
        const outer = pt(ax.lon, R_OUT + 12);
        const lab = pt(ax.lon, R_OUT + 30);
        const dm = degMin(ax.lon);
        return (
          <g key={ax.label}>
            <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="var(--oro)" strokeWidth={1.6} strokeOpacity={0.85} />
            <text x={lab.x} y={lab.y - 7} fontSize={16} fontWeight={600} fill="var(--oro)" textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-display), Georgia, serif">
              {ax.label}
            </text>
            <text x={lab.x} y={lab.y + 10} fontSize={11} fill="var(--estrella)" textAnchor="middle" dominantBaseline="central">
              {dm.d}°{dm.m}′
            </text>
            <title>{ax.name}</title>
          </g>
        );
      })}

      {/* Planetas de A (exterior) */}
      {placedA.map((p) => {
        const exact = pt(p.lon, R_SIGNS_IN);
        const tick = pt(p.lon, R_TICKS_IN);
        const glyphPos = pt(p.display, R_GLYPH_A);
        const degPos = pt(p.display, R_DEG_A);
        const dot = pt(p.lon, R_DOT_A);
        const label = BODY_LABELS[p.id];
        const dm = degMin(p.lon);
        return (
          <g key={`a-${p.id}`}>
            <line x1={exact.x} y1={exact.y} x2={tick.x} y2={tick.y} stroke="var(--oro)" strokeWidth={1.4} />
            <line x1={tick.x} y1={tick.y} x2={glyphPos.x} y2={glyphPos.y} stroke="var(--estrella)" strokeWidth={0.5} strokeOpacity={0.4} />
            <circle cx={dot.x} cy={dot.y} r={2.2} fill="var(--oro)" />
            <circle cx={glyphPos.x} cy={glyphPos.y} r={14} fill="var(--wheel-ring)" />
            <text x={glyphPos.x} y={glyphPos.y} className="wheel-glyph" fontSize={22} fill="var(--oro)" textAnchor="middle" dominantBaseline="central">
              {g(label.glyph)}
            </text>
            <text x={degPos.x} y={degPos.y} fontSize={12} fill="var(--estrella)" textAnchor="middle" dominantBaseline="central">
              {dm.d}°{p.retro ? " ℞" : ""}
            </text>
            <title>{`${label.name} (${nameA})${p.retro ? " retrógrado" : ""}`}</title>
          </g>
        );
      })}

      {/* Planetas de B (interior) */}
      {placedB.map((p) => {
        const exact = pt(p.lon, R_MID);
        const glyphPos = pt(p.display, R_GLYPH_B);
        const degPos = pt(p.display, R_DEG_B);
        const dot = pt(p.lon, R_DOT_B);
        const label = BODY_LABELS[p.id];
        const dm = degMin(p.lon);
        return (
          <g key={`b-${p.id}`}>
            <line x1={exact.x} y1={exact.y} x2={glyphPos.x} y2={glyphPos.y} stroke="var(--azul-cielo)" strokeWidth={0.5} strokeOpacity={0.45} />
            <circle cx={dot.x} cy={dot.y} r={2} fill="var(--azul-cielo)" />
            <circle cx={glyphPos.x} cy={glyphPos.y} r={12} fill="var(--wheel-ring)" stroke="var(--azul-cielo)" strokeWidth={1} />
            <text x={glyphPos.x} y={glyphPos.y} className="wheel-glyph" fontSize={18} fill="var(--azul-cielo)" textAnchor="middle" dominantBaseline="central">
              {g(label.glyph)}
            </text>
            <text x={degPos.x} y={degPos.y} fontSize={10.5} fill="var(--estrella)" textAnchor="middle" dominantBaseline="central">
              {dm.d}°{p.retro ? " ℞" : ""}
            </text>
            <title>{`${label.name} (${nameB})${p.retro ? " retrógrado" : ""}`}</title>
          </g>
        );
      })}
    </svg>
  );
}
