"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Tab = { href: string; label: string; icon: ReactNode; match: string[]; badge?: boolean };

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const TABS: Tab[] = [
  {
    href: "/reportes",
    label: "Reportes",
    icon: svg(
      <>
        <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15L6 16.5Z" />
        <path d="M10 20.5a2 2 0 0 0 4 0" />
      </>,
    ),
    match: ["/reportes"],
    badge: true,
  },
  {
    href: "/clima-astral",
    label: "Clima",
    icon: svg(<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />),
    match: ["/clima-astral"],
  },
  {
    href: "/carta",
    label: "Carta",
    icon: svg(
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 3v5.5M12 15.5V21M3 12h5.5M15.5 12H21" />
      </>,
    ),
    match: ["/carta"],
  },
  {
    href: "/recursos",
    label: "Recursos",
    icon: svg(<path d="M12 3c.6 4.8 2.2 6.4 7 7-4.8.6-6.4 2.2-7 7-.6-4.8-2.2-6.4-7-7 4.8-.6 6.4-2.2 7-7Z" />),
    match: ["/recursos", "/numerologia", "/sinastria", "/pluton-acuario", "/venus-retrogrado"],
  },
  {
    href: "/cuenta",
    label: "Cuenta",
    icon: svg(
      <>
        <circle cx="12" cy="8.5" r="3.5" />
        <path d="M5 20c.8-3.6 3.5-5.5 7-5.5s6.2 1.9 7 5.5" />
      </>,
    ),
    match: ["/cuenta", "/entrar", "/registro", "/recuperar", "/nueva-contrasena", "/planes", "/introduccion", "/fundamentos", "/aviso-legal", "/privacidad", "/cookies"],
  },
];

const inGroup = (pathname: string, paths: string[]) => paths.some((p) => pathname === p || pathname.startsWith(p + "/"));

/** Barra de pestañas inferior de la app de Android. Sustituye al menú de la web. */
export function AppTabs({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();
  return (
    <nav className="app-tabs" aria-label="Principal">
      {TABS.map((t) => {
        const active = inGroup(pathname, t.match);
        return (
          <Link key={t.href} href={t.href} className={active ? "app-tab activa" : "app-tab"} aria-current={active ? "page" : undefined}>
            <span className="app-tab-icono">
              {t.icon}
              {t.badge && unread > 0 && <i className="app-tab-punto" aria-label={`${unread} sin leer`} />}
            </span>
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Muestra su contenido solo en el grupo de la pestaña Cuenta (textos legales y accesos secundarios). */
export function AppAccountOnly({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const account = TABS[TABS.length - 1];
  return inGroup(pathname, account.match) ? <>{children}</> : null;
}
