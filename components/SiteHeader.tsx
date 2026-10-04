import Link from "next/link";
import { getSession } from "@/lib/supabase/server";
import { getTexts } from "@/lib/texts";
import { AquilaMark } from "./Art";
import { SiteMenu } from "./SiteMenu";

const LINKS = [
  { href: "/introduccion", label: "Introducción" },
  { href: "/clima-astral", label: "Clima astral" },
  { href: "/carta", label: "Tu carta natal" },
  { href: "/recursos", label: "Recursos astrológicos" },
  { href: "/numerologia", label: "Numerología" },
  { href: "/blog", label: "Blog" },
  // { href: "/fundamentos", label: "Fundamentos" }, // oculto hasta que tenga contenido
  { href: "/planes", label: "Planes" },
];

export async function SiteHeader() {
  const session = await getSession();
  const account = session
    ? [...(session.isAdmin ? [{ href: "/admin", label: "Panel" }] : []), { href: "/cuenta", label: "Mi cuenta" }]
    : [
        { href: "/entrar", label: "Entrar" },
        { href: "/registro", label: "Crear cuenta" },
      ];
  return (
    <header className="site-header">
      <div className="container">
        <Link href="/" className="brand" aria-label="El atlas de Tarazed, inicio">
          <AquilaMark />
          El atlas de Tarazed
        </Link>
        <div className="nav-account">
          {session ? (
            <>
              {session.isAdmin && (
                <Link href="/admin" className="small">
                  Panel
                </Link>
              )}
              <Link href="/cuenta" className="btn btn-ghost btn-small">
                Mi cuenta
              </Link>
            </>
          ) : (
            <>
              <Link href="/entrar" className="small">
                Entrar
              </Link>
              <Link href="/registro" className="btn btn-primary btn-small">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
        <SiteMenu links={LINKS} account={account} />
      </div>
    </header>
  );
}

export async function SiteFooter() {
  const { t } = await getTexts();
  return (
    <footer className="site-footer">
      <div className="container">
        <div>
          <div style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: 22, color: "var(--ink)" }}>El atlas de Tarazed</div>
          <div>{t("footer.tagline")}</div>
          <div style={{ marginTop: 8 }}>{t("footer.disclaimer")}</div>
        </div>
        <nav aria-label="Legal">
          <Link href="/aviso-legal">Aviso legal</Link>
          <Link href="/privacidad">Privacidad</Link>
          <Link href="/cookies">Cookies</Link>
          <a href="https://www.instagram.com/elatlasdetarazed/" rel="noopener noreferrer" target="_blank">
            Instagram
          </a>
        </nav>
      </div>
    </footer>
  );
}
