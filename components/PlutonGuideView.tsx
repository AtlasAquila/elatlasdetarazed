import Link from "next/link";
import { RichText } from "@/components/RichText";
import type { PlutonGuide } from "@/lib/pluton-guia";

/** La guía personal en pantalla. `aviso` es la nota sobre el correo. */
export function PlutonGuideView({ guide, aviso }: { guide: PlutonGuide; aviso?: string }) {
  return (
    <div className="venus-guide" role="status">
      <p className="kicker">{guide.nombre ? `Tu guía, ${guide.nombre}` : "Tu guía"}</p>
      <h3>Tu guía de Plutón directo en Acuario</h3>
      <p className="small muted">{aviso ? `${aviso} ` : ""}Se lee en unos diez minutos.</p>
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
