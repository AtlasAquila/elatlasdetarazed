import type { Metadata } from "next";
import Link from "next/link";
import { computeNumerology, formatNumber } from "@/lib/numerology";
import { NUMBER_MEANINGS } from "@/lib/numerology-texts";
import { NUMEROLOGY_PEOPLE_LIMIT, formatBirth, listMyPeople } from "@/lib/people";
import { getSession } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Numerología",
  description: "Calcula con exactitud el camino de vida, la expresión, el número del alma y los ciclos personales a partir del nombre y la fecha de nacimiento.",
};

const EXAMPLE = [
  { n: "Camino de vida", from: "la fecha de nacimiento" },
  { n: "Expresión", from: "todas las letras del nombre" },
  { n: "Alma", from: "las vocales" },
  { n: "Personalidad", from: "las consonantes" },
  { n: "Año personal", from: "tu ciclo de nueve años" },
];

export default async function NumerologiaPage() {
  const session = await getSession();

  if (!session) {
    return (
      <>
        <section className="hero">
          <div className="container reading">
            <p className="kicker">Numerología</p>
            <NumerologyIntro />
          </div>
        </section>
        <NumerologyAstrologySection />
        <section className="section" style={{ borderTop: 0, paddingTop: 0 }}>
          <div className="container">
            <div className="actions" style={{ margin: "0 0 40px", alignItems: "center" }}>
              <Link href="/registro?siguiente=/numerologia" className="btn btn-primary">
                Crea tu cuenta gratis
              </Link>
              <Link href="/entrar?siguiente=/numerologia" className="btn btn-ghost">
                Ya tengo cuenta
              </Link>
            </div>
            <div className="panel">
              <h3>Empieza por tu nombre</h3>
              <p className="muted" style={{ marginBottom: 0 }}>
                Solo necesitas el nombre completo de nacimiento, con los apellidos, y la fecha. No hace falta la hora ni el lugar.
              </p>
            </div>
          </div>
        </section>
      </>
    );
  }

  const people = await listMyPeople();
  const canCreate = people.length < NUMEROLOGY_PEOPLE_LIMIT;

  return (
    <>
    <section className="hero">
      <div className="container reading">
        <p className="kicker">Numerología</p>
        <NumerologyIntro />
      </div>
    </section>
    <NumerologyAstrologySection />
    <section className="section" style={{ borderTop: 0, paddingTop: 0 }}>
      <div className="container">
        <div className="actions" style={{ margin: "0 0 40px", alignItems: "center" }}>
          {canCreate ? (
            <Link href="/numerologia/nueva" className="btn btn-primary">
              Añadir persona
            </Link>
          ) : (
            <span className="notice">Has llegado al máximo de {NUMEROLOGY_PEOPLE_LIMIT} personas. Borra alguna para añadir otra.</span>
          )}
          <span className="muted small">
            {people.length} de {NUMEROLOGY_PEOPLE_LIMIT} personas guardadas.
          </span>
        </div>
        {people.length === 0 ? (
          <div className="panel">
            <h3>Empieza por tu nombre</h3>
            <p className="muted" style={{ marginBottom: 0 }}>
              Solo necesitas el nombre completo de nacimiento, con los apellidos, y la fecha. No hace falta la hora ni el lugar.
            </p>
          </div>
        ) : (
          <div className="grid-3">
            {people.map((p) => {
              const num = computeNumerology(p.full_name, p.birth_date, p.current_name);
              const lp = num.lifePath.value;
              return (
                <Link key={p.id} href={`/numerologia/${p.id}`} className="card card-link person-card">
                  <div className="num-badge" aria-label={`Camino de vida ${formatNumber(lp)}`}>
                    {lp}
                  </div>
                  <div>
                    {(p.is_self || p.label) && <span className="tag">{p.is_self ? "Yo" : p.label}</span>}
                    <h3>{p.current_name || p.full_name}</h3>
                    <p className="muted small">{formatBirth(p.birth_date)}</p>
                    <p className="small" style={{ marginBottom: 0 }}>
                      Camino de vida {formatNumber(lp)} · {NUMBER_MEANINGS[lp].name.toLowerCase()}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
    </>
  );
}

function NumerologyIntro() {
  return (
    <>
      <p className="lead">
        La numerología pitagórica traduce el nombre completo y la fecha de nacimiento en unos pocos números que describen talentos, deseos y ciclos. Aquí los calculamos con exactitud, con los números maestros y las deudas y lecciones kármicas.
      </p>
      <ul className="lead" style={{ paddingLeft: 24 }}>
        {EXAMPLE.map((e) => (
          <li key={e.n}>
            <strong>{e.n}</strong>, a partir de {e.from}.
          </li>
        ))}
      </ul>
      <p className="muted">Gratis: guarda hasta {NUMEROLOGY_PEOPLE_LIMIT} personas con todos sus números explicados. Con Premium: lecturas completas, compatibilidad entre personas y numerología cruzada con la carta astral.</p>
    </>
  );
}

function NumerologyAstrologySection() {
  return (
    <section className="section" id="numerologia-astrologia">
      <div className="container reading">
        <p className="kicker">Numerología y astrología</p>
        <h2>Las huellas del alma</h2>
        <p className="lead" style={{ fontWeight: 600 }}>
          Nada en nuestro nacimiento es completamente casual. El instante en el que llegamos al mundo y el nombre que nos acompaña forman parte del mapa que nuestra alma trazó antes de comenzar este viaje.
        </p>
        <p className="muted" style={{ fontSize: 17, lineHeight: 1.6 }}>
          La astrología observa la configuración del cielo en ese primer instante; la numerología descifra la vibración contenida en nuestra fecha de nacimiento y nuestro nombre. Dos lenguajes diferentes que parecen hablar, desde lugares distintos, de nuestros aprendizajes, dones y propósito.
        </p>
        <p className="muted" style={{ fontSize: 17, lineHeight: 1.6 }}>
          Cuando ambos mapas se encuentran, sus símbolos se entrelazan y enriquecen mutuamente, ofreciéndonos nuevas claves para recordar quiénes somos y comprender el camino que hemos venido a recorrer.
        </p>
      </div>
    </section>
  );
}
