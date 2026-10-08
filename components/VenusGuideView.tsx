import Link from "next/link";
import { RichText } from "@/components/RichText";
import type { GuideContent } from "@/lib/venus-guia";

/** La guía personal en pantalla. `aviso` es la nota sobre el correo. */
export function VenusGuideView({ guide, aviso }: { guide: GuideContent; aviso?: string }) {
  return (
    <div className="venus-guide" role="status">
      <p className="kicker">Tu guía, {guide.nombre}</p>
      <h3>Tu guía de la Luna Nueva con Venus retrógrado</h3>
      <p className="small muted">
        {aviso} Se lee en unos cinco minutos.
      </p>
      {guide.secciones.map((s) => (
        <section key={s.titulo} className="venus-guide-section">
          <h4>{s.titulo}</h4>
          <RichText text={s.texto} />
        </section>
      ))}
      <section className="venus-guide-cta">
        <RichText text={guide.cta.texto} />
        <Link href={guide.cta.ruta} className="btn btn-primary">
          {guide.cta.boton} →
        </Link>
      </section>
    </div>
  );
}
