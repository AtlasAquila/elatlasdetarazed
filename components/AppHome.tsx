import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type Tile = { href: string; label: string; icon: ReactNode; badge?: boolean };

const icon = (children: ReactNode) => (
  <svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const TILES: Tile[] = [
  {
    href: "/transitos",
    label: "Tránsitos",
    icon: icon(
      <>
        <circle cx="24" cy="24" r="8" />
        <ellipse cx="24" cy="24" rx="19" ry="6.5" transform="rotate(-24 24 24)" />
        <circle cx="39" cy="14" r="1.2" fill="currentColor" />
      </>,
    ),
  },
  {
    href: "/clima-astral",
    label: "Clima astral",
    icon: icon(
      <>
        <path d="M10 38h25a7 7 0 0 0 .6-14 10 10 0 0 0-19.2-1.5A8 8 0 0 0 10 38Z" />
        <path d="M30 6v7M26.5 9.5h7M18 12l1.5 3M41 14l-2.5 2" />
      </>,
    ),
  },
  {
    href: "/carta",
    label: "Carta natal",
    icon: icon(
      <>
        <circle cx="24" cy="24" r="19" />
        <circle cx="24" cy="24" r="12.5" />
        <circle cx="24" cy="24" r="3" fill="currentColor" />
        <path d="M24 5v7.5M24 35.5V43M5 24h7.5M35.5 24H43M10.6 10.6l5.3 5.3M32.1 32.1l5.3 5.3M37.4 10.6l-5.3 5.3M15.9 32.1l-5.3 5.3" />
      </>,
    ),
  },
  {
    href: "/numerologia",
    label: "Numerología",
    icon: icon(
      <>
        <circle cx="24" cy="13" r="8" />
        <circle cx="13" cy="33" r="8" />
        <circle cx="35" cy="33" r="8" />
        <text x="24" y="17" textAnchor="middle" fontSize="11" fill="currentColor" stroke="none" fontFamily="Georgia, serif">3</text>
        <text x="13" y="37" textAnchor="middle" fontSize="11" fill="currentColor" stroke="none" fontFamily="Georgia, serif">7</text>
        <text x="35" y="37" textAnchor="middle" fontSize="11" fill="currentColor" stroke="none" fontFamily="Georgia, serif">9</text>
      </>,
    ),
  },
  {
    href: "/ciclo-lunar",
    label: "Ciclo lunar",
    icon: icon(
      <>
        <circle cx="24" cy="24" r="9" fill="currentColor" />
        <path d="M11 14a14 14 0 0 0 0 20a10 10 0 0 1 0-20Z" fill="currentColor" />
        <path d="M37 14a14 14 0 0 1 0 20a10 10 0 0 0 0-20Z" fill="currentColor" />
      </>,
    ),
  },
  {
    href: "/reportes",
    label: "Reportes",
    badge: true,
    icon: icon(
      <>
        <path d="M12 5h17l8 8v30H12V5Z" />
        <path d="M29 5v8h8" />
        <path d="M17 22h14M17 28h14M17 34h9" />
      </>,
    ),
  },
];

/** Pantalla de inicio de la app de Android: el águila de Códice Orbital y las seis secciones. */
export function AppHome({ unread = 0 }: { unread?: number }) {
  return (
    <section className="app-home">
      <h1 className="app-home-marca">Códice Orbital</h1>
      <div className="app-home-aguila">
        <Image src="/aguila-inicio.webp" width={1000} height={1000} alt="" aria-hidden="true" priority sizes="(max-width: 520px) 100vw, 520px" />
      </div>
      <nav className="app-home-teselas" aria-label="Secciones">
        {TILES.map((t) => (
          <Link key={t.href} href={t.href} className="app-home-tesela">
            <span className="app-home-icono">
              {t.icon}
              {t.badge && unread > 0 && <i className="app-tab-punto" aria-label={`${unread} sin leer`} />}
            </span>
            <span>{t.label}</span>
          </Link>
        ))}
      </nav>
    </section>
  );
}
