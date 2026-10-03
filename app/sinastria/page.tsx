import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SynastryForm } from "@/components/SynastryForm";
import { birthSummary, listMyCharts } from "@/lib/charts";
import { getSynastryStatus, listMySynastries, RELATIONSHIP_LABELS } from "@/lib/synastry";
import { getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sinastría" };

export default async function SynastryListPage() {
  const session = await getSession();

  if (!session) {
    return (
      <section className="hero">
        <div className="container">
          <div>
            <p className="kicker">Sinastría</p>
            <h1>Cómo dialogan dos cartas</h1>
            <p className="lead">
              La sinastría compara dos cartas natales: los aspectos entre los planetas de una persona y los de otra, y en qué casas caen. Función Premium, hasta 3 cálculos al mes.
            </p>
            <div className="actions" style={{ marginTop: 32 }}>
              <Link href="/registro?siguiente=/sinastria" className="btn btn-primary">
                Crea tu cuenta gratis
              </Link>
              <Link href="/entrar?siguiente=/sinastria" className="btn btn-ghost">
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const [charts, status, synastries] = await Promise.all([listMyCharts(), getSynastryStatus(), listMySynastries()]);
  const isPremium = status?.plan === "premium";
  const chartById = new Map(charts.map((c) => [c.id, c]));
  const options = charts.map((c) => ({ id: c.id, label: `${c.name} · ${birthSummary(c)}` }));

  return (
    <section className="hero">
      <div className="container reading">
        <p className="kicker">Sinastría</p>
        <h1>Cómo dialogan dos cartas</h1>
        <p className="lead">La comparación entre dos cartas natales: cómo se relacionan los planetas de una persona con los de otra, en la pareja, la familia o el trabajo.</p>

        {!isPremium ? (
          <div className="panel" style={{ marginTop: 24 }}>
            <h3>Función Premium</h3>
            <p className="muted">La sinastría está disponible con Premium: hasta 3 cálculos al mes.</p>
            <Link href="/planes" className="btn btn-primary" style={{ marginTop: 12 }}>
              Ver planes
            </Link>
          </div>
        ) : charts.length < 2 ? (
          <div className="panel" style={{ marginTop: 24 }}>
            <h3>Necesitas al menos dos cartas</h3>
            <p className="muted" style={{ marginBottom: 0 }}>
              Guarda una segunda carta en{" "}
              <Link href="/carta/nueva" className="small">
                Tu carta natal
              </Link>{" "}
              para poder comparar.
            </p>
          </div>
        ) : (
          <div className="panel" style={{ marginTop: 24 }}>
            <h3>Nueva sinastría</h3>
            {status && status.remaining <= 0 ? (
              <p className="notice">Has usado tus {status.limit} sinastrías de este mes. Se renuevan el día 1.</p>
            ) : (
              <>
                <SynastryForm charts={options} />
                {status && (
                  <p className="small muted" style={{ marginTop: 16 }}>
                    Te quedan {status.remaining} de {status.limit} este mes.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {synastries.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <h3>Calculadas</h3>
            <div className="grid-3" style={{ marginTop: 16 }}>
              {synastries.map((s) => {
                const a = chartById.get(s.chart_a_id);
                const b = chartById.get(s.chart_b_id);
                return (
                  <Link key={s.id} href={`/sinastria/${s.id}`} className="card card-link">
                    <span className="tag" style={{ marginBottom: 8 }}>
                      {RELATIONSHIP_LABELS[s.relationship_type]}
                    </span>
                    <h3>
                      {a?.name ?? "…"} × {b?.name ?? "…"}
                    </h3>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
