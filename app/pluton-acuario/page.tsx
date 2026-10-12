import type { Metadata } from "next";
import Link from "next/link";
import { PlutonGuideForm } from "@/components/PlutonGuideForm";

// La guía se escribe al momento con la IA: tarda cerca de un minuto.
export const maxDuration = 300;

const TITLE = "Plutón directo en Acuario: la marea de 2026 y 2027";
const DESCRIPTION = "Tu guía gratuita: en qué casa de tu carta se mueve Plutón y qué puntos de tu carta toca, con las fechas.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION },
};

export default function PlutonAcuarioPage() {
  return (
    <>
      <section className="hero venus-hero">
        <div className="container">
          <p className="kicker">Plutón directo · 16 de octubre de 2026</p>
          <h1>Plutón directo en Acuario</h1>
          <p className="hero-intro-body">
            Desde el 6 de mayo, Plutón estaba retrógrado: marea baja. El 16 de octubre vuelve a avanzar y la marea sube. Plutón habla de poder y de transformación; Acuario, de lo colectivo. Este ciclo pregunta a qué grupos perteneces de verdad.
          </p>
          <a href="#guia" className="btn btn-primary">
            Quiero saber en qué casa de mi carta se mueve Plutón →
          </a>
        </div>
      </section>

      <section className="section">
        <div className="container reading">
          <h2 className="venus-caps">¿Qué está pasando en el cielo?</h2>
          <ol className="venus-steps">
            <li>
              <strong>Plutón entró en Acuario el 19 de noviembre de 2024</strong> y se quedará hasta el 19 de enero de 2044.
            </li>
            <li>
              <strong>Cada año se repite un patrón:</strong> retrograda en mayo (marea baja) y vuelve a ir directo en octubre (marea alta). Este año retrogradó el 6 de mayo, a 5°31′ de Acuario.
            </li>
            <li>
              <strong>El 16 de octubre, a las 04:40 (hora de Madrid)</strong>, se detiene a 3°04′ de Acuario y vuelve a avanzar. Estará directo 204 días, hasta el 8 de mayo de 2027.
            </li>
          </ol>
          <p className="venus-result">
            <strong>Resultado: una marea lenta de ideas, poder y pertenencia.</strong> Plutón transforma por acumulación, no de golpe.
          </p>
          <p className="small muted">La interpretación habla de tendencias, no de destinos.</p>
        </div>
      </section>

      <section className="section" id="guia">
        <div className="container">
          <div className="venus-box">
            <h2 className="venus-caps">¿En qué casa de tu carta se mueve Plutón?</h2>
            <p className="lead">No es igual para todos. Depende de tu carta natal.</p>
            <p>
              Te preparo una guía gratuita con la casa donde Plutón se detiene, el recorrido de la marea por tus casas, los puntos de tu carta que toca (con las fechas aproximadas en que pasa por ellos) y el ciclo fase a fase hasta octubre de 2027.
            </p>
            <PlutonGuideForm />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container reading venus-final">
          <h2>¿Quieres que lo miremos en tu carta?</h2>
          <p className="lead">Esta guía lee a Plutón sobre tu carta. En tu carta natal completa vemos cómo se relacionan entre sí tu Sol, tu Luna y tu Plutón natal, y qué te piden estos meses.</p>
          <Link href="/carta" className="btn btn-primary">
            Conocer mi carta natal
          </Link>
        </div>
      </section>
    </>
  );
}
