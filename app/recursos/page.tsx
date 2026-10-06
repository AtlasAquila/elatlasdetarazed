import type { Metadata } from "next";
import Link from "next/link";
import { PRICE_LABEL } from "@/lib/purchase-info";
import { RESOURCES } from "@/lib/resources";
import { getTexts } from "@/lib/texts";

export const metadata: Metadata = {
  title: "Más recursos astrológicos",
  description: "Clima astral personalizado, revolución solar, sinastría y retorno de Saturno: las técnicas de El atlas de Tarazed, cada lectura por separado.",
};

export default async function RecursosPage() {
  const { t } = await getTexts();

  return (
    <>
      <section className="hero">
        <div className="container reading">
          <p className="kicker">Más recursos astrológicos</p>
          <h1>{t("recursos.title")}</h1>
          <p className="lead">{t("recursos.lead")}</p>
          <p className="muted small">Cada lectura se compra por separado ({PRICE_LABEL}, un solo pago, sin suscripción) y no va incluida en Premium.</p>
        </div>
      </section>

      <section className="section" style={{ borderTop: 0, paddingTop: 0 }}>
        <div className="container">
          <div className="grid-4">
            {RESOURCES.map((r) => (
              <div key={r.slug} className="card">
                <h3>
                  <Link href={`/recursos/${r.slug}`} className="card-title-link">
                    {r.name}
                  </Link>
                </h3>
                <p className="muted">{r.text}</p>
                {r.href ? (
                  <Link href={r.href} className="tag" style={{ marginBottom: 0 }}>
                    Ver · {PRICE_LABEL}
                  </Link>
                ) : (
                  <span className="tag" style={{ marginBottom: 0 }}>
                    En preparación
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
