import Image from "next/image";

/** Dibujos del sistema de diseño: la constelación de Aquila (con Tarazed destacada) y la rueda zodiacal. */

type AquilaProps = { size?: number; labels?: boolean; title?: string };

export function AquilaConstellation({ size = 320, labels = false, title = "Constelación de Aquila" }: AquilaProps) {
  return (
    <svg viewBox="26 24 198 222" width={size} height={(size * 222) / 198} role="img" aria-label={title}>
      <g fill="none" stroke="var(--estrella)" strokeWidth={0.7}>
        <polyline points="148,96 164,118 180,142" />
        <polyline points="164,118 130,150 70,72 46,44" />
        <polyline points="130,150 100,196 82,226" />
        <polyline points="130,150 160,212 204,200" />
      </g>
      <g fill="var(--estrella)">
        <circle cx={46} cy={44} r={2.2} />
        <circle cx={70} cy={72} r={2.6} />
        <circle cx={130} cy={150} r={2.6} />
        <circle cx={100} cy={196} r={2.2} />
        <circle cx={82} cy={226} r={2.6} />
        <circle cx={160} cy={212} r={2.2} />
        <circle cx={204} cy={200} r={2.6} />
      </g>
      <circle cx={180} cy={142} r={3} fill="var(--estrella)" />
      <circle cx={164} cy={118} r={4.2} fill="var(--oro)" />
      {/* Tarazed (γ Aquilae), la estrella que da nombre a la web. */}
      <circle cx={148} cy={96} r={5.5} fill="var(--oro)" />
      {labels && (
        <g fontSize={7.5} fill="var(--ink-muted)" fontFamily="var(--font-serif), Georgia, serif">
          <text x={116} y={92}>Tarazed</text>
          <text x={172} y={114}>Altair</text>
          <text x={188} y={146}>Alshain</text>
        </g>
      )}
    </svg>
  );
}

/** Logotipo: el águila dorada con la estrella (public/logo.png). */
export function AquilaMark({ size = 40 }: { size?: number }) {
  return <Image src="/logo.png" width={size} height={size} alt="" aria-hidden="true" priority />;
}

const SIGNS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

/**
 * Medallón decorativo: rueda zodiacal con un sol-luna resplandeciente en el centro.
 * Puramente ornamental (portada, cabeceras) — no representa una carta real.
 */
export function ZodiacWheel({ size = 420 }: { size?: number }) {
  const c = 200;
  const lines = Array.from({ length: 12 }, (_, i) => {
    const a = (Math.PI / 6) * i;
    return {
      x1: c + 190 * Math.cos(a),
      y1: c + 190 * Math.sin(a),
      x2: c + 150 * Math.cos(a),
      y2: c + 150 * Math.sin(a),
    };
  });
  const glyphs = SIGNS.map((g, i) => {
    const a = Math.PI - (Math.PI / 6) * (i + 0.5);
    return { g, x: c + 170 * Math.cos(a), y: c + 170 * Math.sin(a) };
  });
  const rays = Array.from({ length: 16 }, (_, i) => {
    const a = (Math.PI / 8) * i;
    return {
      x1: c + 30 * Math.cos(a),
      y1: c + 30 * Math.sin(a),
      x2: c + 46 * Math.cos(a),
      y2: c + 46 * Math.sin(a),
    };
  });
  return (
    <svg viewBox="0 0 400 400" width={size} height={size} role="img" aria-label="Rueda zodiacal">
      <defs>
        <radialGradient id="aquila-wheel-glow" cx="50%" cy="50%" r="50%">
          <stop offset="55%" stopColor="var(--oro)" stopOpacity={0} />
          <stop offset="100%" stopColor="var(--oro)" stopOpacity={0.18} />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={196} fill="url(#aquila-wheel-glow)" />
      <circle cx={c} cy={c} r={190} fill="var(--surface-raised)" />
      <circle cx={c} cy={c} r={190} fill="none" stroke="var(--oro)" strokeWidth={1.4} />
      <circle cx={c} cy={c} r={150} fill="none" stroke="var(--estrella)" strokeWidth={0.7} strokeOpacity={0.5} />
      <circle cx={c} cy={c} r={62} fill="none" stroke="var(--estrella)" strokeWidth={0.7} strokeOpacity={0.5} />
      <g stroke="var(--estrella)" strokeWidth={0.7} strokeOpacity={0.35}>
        {lines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
        ))}
      </g>
      <g fill="var(--estrella)" fontSize={20} textAnchor="middle" dominantBaseline="central" style={{ fontVariantEmoji: "text" } as React.CSSProperties}>
        {glyphs.map((s) => (
          <text key={s.g} x={s.x} y={s.y}>
            {s.g + "︎"}
          </text>
        ))}
      </g>
      {/* Medallón sol-luna */}
      <g stroke="var(--oro)" strokeWidth={1}>
        {rays.map((r, i) => (
          <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} />
        ))}
      </g>
      <circle cx={c} cy={c} r={20} fill="var(--oro)" />
      <circle cx={c + 6} cy={c - 5} r={17} fill="var(--surface-raised)" />
    </svg>
  );
}
