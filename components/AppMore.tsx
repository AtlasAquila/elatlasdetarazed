import Link from "next/link";

/** Accesos que no caben en la barra de pestañas de la app. */
export function AppMore() {
  return (
    <nav className="app-more container" aria-label="Más">
      <Link href="/introduccion">Introducción a la astrología</Link>
    </nav>
  );
}
