import Link from "next/link";

/** Accesos que no caben en la barra de pestañas de la app. */
export function AppMore({ admin = false }: { admin?: boolean }) {
  return (
    <nav className="app-more container" aria-label="Más">
      <Link href="/introduccion">Introducción a la astrología</Link>
      {/* La app no tiene pagos para los testers; los administradores los ven para probarlos. */}
      {admin && <Link href="/recursos">Recursos astrológicos</Link>}
      {admin && <Link href="/planes">Planes</Link>}
    </nav>
  );
}
