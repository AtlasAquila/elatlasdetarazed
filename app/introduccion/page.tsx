import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTexts } from "@/lib/texts";

export const metadata: Metadata = {
  title: "Introducción a la astrología",
  description: "El potencial de la astrología como herramienta de autoconocimiento: un lenguaje para comprender tendencias, ciclos y el propio camino.",
};

export default async function IntroduccionPage() {
  const { t } = await getTexts();
  const blocks = t("intro.hero.lead").split(/\n\n+/);
  // Un primer bloque corto es un subtítulo; el resto de bloques son párrafos del mismo tamaño.
  const hasSubtitle = blocks.length > 1 && blocks[0].length <= 90;
  const [first, ...rest] = blocks;
  const paragraphs = hasSubtitle ? rest : blocks;
  return (
    <>
      <section className="hero hero-intro">
        <div className="container">
          <div className="hero-intro-aside">
            <Image src="/rueda-zodiacal.png" width={300} height={300} alt="" aria-hidden="true" priority className="hero-intro-art" />
            <Link href="/carta" className="btn btn-primary">
              Explora tu carta →
            </Link>
          </div>
          <div>
            <p className="kicker">El potencial de la astrología</p>
            <h1>{t("intro.hero.title")}</h1>
            {hasSubtitle && <p className="hero-intro-subtitle">{first}</p>}
            {paragraphs.map((p, i) => (
              <p key={i} className="hero-intro-body">
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ borderTop: 0, paddingTop: 0 }}>
        <div className="container">
          <div className="apartados-strip apartados-compact">
            <Link href="/clima-astral" className="apartado">
              <span className="apartado-icon" aria-hidden="true">
                <svg width="30" height="30" viewBox="0 0 30 30"><path d="M18 5a10 10 0 1 0 7 17 11.5 11.5 0 0 1-7-17z" fill="none" stroke="var(--oro)" strokeWidth={1.2} /></svg>
              </span>
              <span className="apartado-title">Clima astral</span>
              <span className="apartado-sub">Las energías del momento</span>
            </Link>
            <Link href="/carta" className="apartado">
              <span className="apartado-icon" aria-hidden="true">
                <svg width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="11.5" fill="none" stroke="var(--oro)" strokeWidth={1.2} /><circle cx="15" cy="15" r="3" fill="none" stroke="var(--oro)" strokeWidth={1.2} /><line x1="15" y1="3" x2="15" y2="8" stroke="var(--oro)" strokeWidth={1.2} /><line x1="15" y1="22" x2="15" y2="27" stroke="var(--oro)" strokeWidth={1.2} /></svg>
              </span>
              <span className="apartado-title">Tu carta</span>
              <span className="apartado-sub">Conócete en profundidad</span>
            </Link>
            <Link href="/recursos" className="apartado">
              <span className="apartado-icon" aria-hidden="true">
                <svg width="30" height="30" viewBox="0 0 30 30"><g fill="none" stroke="var(--oro)" strokeWidth={1.2}><path d="M4 7c3-2.4 7-2.4 10.5 0v16c-3.5-2.4-7.5-2.4-10.5 0z" /><path d="M26 7c-3-2.4-7-2.4-10.5 0v16c3.5-2.4 7.5-2.4 10.5 0z" /></g></svg>
              </span>
              <span className="apartado-title">Recursos astrológicos</span>
              <span className="apartado-sub">Más técnicas por llegar</span>
            </Link>
            <Link href="/numerologia" className="apartado">
              <span className="apartado-icon" aria-hidden="true">
                <svg width="30" height="30" viewBox="0 0 30 30"><polygon points="15,3 27,25 3,25" fill="none" stroke="var(--oro)" strokeWidth={1.2} /></svg>
              </span>
              <span className="apartado-title">Numerología</span>
              <span className="apartado-sub">Los números de tu camino</span>
            </Link>
          </div>
        </div>
      </section>

    </>
  );
}
