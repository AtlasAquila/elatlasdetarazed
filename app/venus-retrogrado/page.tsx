import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { VenusGuideForm } from "@/components/VenusGuideForm";

const TITLE = "Venus retrógrado: del 3 de octubre al 14 de noviembre";
const DESCRIPTION = "No viene a darte paz. Viene a preguntarte si tu vínculo es reciprocidad o costumbre. Tu guía gratuita de la Luna Nueva en Libra según tu ascendente.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, images: [{ url: "/venus-retrogrado-cabecera.png", width: 1672, height: 941 }] },
};

export default function VenusRetrogradoPage() {
  return (
    <>
      <div className="container venus-banner">
        <Image
          src="/venus-retrogrado-cabecera.png"
          width={1672}
          height={941}
          priority
          sizes="(max-width: 1120px) 100vw, 1072px"
          alt="Un águila dorada sobrevuela Venus y la constelación de Escorpio"
        />
      </div>

      <section className="hero venus-hero">
        <div className="container">
          <p className="kicker">Venus retrógrado · del 3 de octubre al 14 de noviembre</p>
          <h1>Venus retrógrado</h1>
          <p className="hero-intro-subtitle">No viene a darte paz. Viene a preguntarte si tu vínculo es reciprocidad o costumbre.</p>
          <p className="hero-intro-body">
            Venus va marcha atrás desde el 3 de octubre. El 10, con la Luna Nueva en Libra, forma una cuadratura exacta con Marte en Leo. Con Venus retrógrado en Escorpio, no es momento de firmar nada a ciegas. Es momento de revisar.
          </p>
          <a href="#guia" className="btn btn-primary">
            Quiero saber dónde me cae →
          </a>
        </div>
      </section>

      <section className="section">
        <div className="container reading">
          <h2 className="venus-caps">¿Qué está pasando en el cielo el 10 de octubre?</h2>
          <ol className="venus-steps">
            <li>
              <strong>Luna Nueva a 17° de Libra:</strong> inicio de ciclo sobre pareja, socios y acuerdos.
            </li>
            <li>
              <strong>Venus, su regente, está retrógrado en Escorpio:</strong> te obliga a revisar deseos ocultos, celos, lealtades y qué pides realmente.
            </li>
            <li>
              <strong>Cuadratura exacta a Marte en Leo:</strong> lo que deseas choca con cómo actúas. Quieres cercanía, pero también quieres ser reconocido y no rogar.
            </li>
          </ol>
          <p className="venus-result">
            <strong>Resultado: atracción + fricción.</strong> Por eso tus vínculos pueden sentirse raros.
          </p>
          <p className="small muted">Datos del cielo calculados con efemérides (horas de Madrid). La interpretación habla de tendencias, no de destinos.</p>
        </div>
      </section>

      <section className="section" id="guia">
        <div className="container">
          <div className="venus-box">
            <h2 className="venus-caps">¿Dónde te pide revisar un vínculo esta Luna?</h2>
            <p className="lead">No es igual para todos. Depende de tu ascendente.</p>
            <p>
              Te preparé la guía gratuita con la casa exacta y la pregunta que te trae esta Luna Nueva según tu ascendente, más mi calendario completo de Venus retrógrado hasta el 15 de diciembre, cuando termina su sombra.
            </p>
            <VenusGuideForm />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container reading venus-final">
          <h2>¿Quieres que lo miremos en tu carta?</h2>
          <p className="lead">Esta guía es general por ascendente. En tu carta natal vemos el grado exacto y qué planeta personal te está tocando Venus y Marte.</p>
          <Link href="/carta" className="btn btn-primary">
            Conocer mi carta natal
          </Link>
        </div>
      </section>
    </>
  );
}
