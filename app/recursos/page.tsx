import type { Metadata } from "next";
import Link from "next/link";
import { PRICE_LABEL } from "@/lib/purchase-info";
import { getTexts } from "@/lib/texts";

export const metadata: Metadata = {
  title: "Más recursos astrológicos",
  description: "Clima astral personalizado, revolución solar, sinastría y retorno de Saturno: las técnicas de El atlas de Tarazed, cada lectura por separado.",
};

const RESOURCES: { name: string; text: string; href?: string }[] = [
  {
    name: "Clima astral personalizado",
    text: "Los tránsitos de los próximos 30 días colocados sobre tu carta natal: qué casas se activan, qué planetas lentos tocan tus puntos clave y qué lunaciones caen en tu carta. Una lectura extensa.",
    href: "/carta",
  },
  {
    name: "Revolución solar",
    text: "La carta calculada para el instante exacto en que el Sol vuelve a tu grado natal cada año, en el lugar donde te encuentres. Señala los temas que dominarán el año que empieza en tu cumpleaños. Con su lectura extensa.",
    href: "/carta",
  },
  {
    name: "Sinastría",
    text: "La comparación entre dos cartas natales: cómo dialogan tus planetas con los de otra persona, en la pareja, la familia o el trabajo. Con su lectura extensa.",
    href: "/sinastria",
  },
  {
    name: "Retorno de Saturno",
    text: "El momento, hacia los 29 años y de nuevo hacia los 58, en que Saturno regresa a su posición de nacimiento: una etapa de maduración, responsabilidad y balance.",
  },
];

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
              <div key={r.name} className="card">
                <h3>{r.name}</h3>
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
