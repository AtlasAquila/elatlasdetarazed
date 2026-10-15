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
    href: "/",
    label: "Inicio",
    icon: svg(
      <>
        <path d="M3 10.5 12 4l9 6.5" />
        <path d="M5.5 9.5V20h13V9.5" />
        <path d="M10 20v-5.5h4V20" />
      </>,
    ),
    match: ["/reportes", "/transitos", "/clima-astral", "/carta", "/numerologia", "/alshain"],
    badge: true,
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
    match: ["/cuenta", "/entrar", "/registro", "/recuperar", "/nueva-contrasena", "/planes", "/recursos", "/sinastria", "/introduccion", "/fundamentos", "/aviso-legal", "/privacidad", "/cookies"],
  },
];

const inGroup = (pathname: string, paths: string[]) => paths.some((p) => pathname === p || pathname.startsWith(p + "/"));

/** Barra de pestañas inferior de la app de Android. Sustituye al menú de la web. */
export function AppTabs({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();
  return (
    <nav className="app-tabs" aria-label="Principal">
      {TABS.map((t) => {
        const active = t.href === "/" ? pathname === "/" || inGroup(pathname, t.match) : inGroup(pathname, t.match);
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
