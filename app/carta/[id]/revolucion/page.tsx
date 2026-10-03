import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { SolarReturnForm } from "@/components/SolarReturnForm";
import { getMyChart } from "@/lib/charts";
import { getSolarReturnStatus, listSolarReturns, solarReturnSummary } from "@/lib/solar-returns";
import { getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Revolución solar" };

type Props = { params: Promise<{ id: string }> };

export default async function SolarReturnListPage({ params }: Props) {
  const session = await getSession();
  const { id } = await params;
  if (!session) redirect(`/entrar?siguiente=/carta/${id}/revolucion`);

  const natalRow = await getMyChart(id);
  if (!natalRow) notFound();

  const [status, returns] = await Promise.all([getSolarReturnStatus(), listSolarReturns(id)]);
  const isPremium = status?.plan === "premium";
  const thisYear = new Date().getUTCFullYear();

  return (
    <section className="hero">
      <div className="container reading">
        <Link href={`/carta/${id}`} className="small">
          ← {natalRow.name}
        </Link>
        <p className="kicker" style={{ marginTop: 24 }}>
          Revolución solar
        </p>
        <h1>La carta de tu próximo año</h1>
        <p className="lead">
          La revolución solar es la carta calculada para el instante exacto en que el Sol vuelve a su grado natal, cada año, en el lugar donde te encuentres ese día. Señala los temas que dominarán los doce meses que empiezan en tu
          cumpleaños.
        </p>

        {!isPremium ? (
          <div className="panel" style={{ marginTop: 24 }}>
            <h3>Función Premium</h3>
            <p className="muted">La revolución solar está disponible con Premium: hasta 2 cálculos al mes.</p>
            <Link href="/planes" className="btn btn-primary" style={{ marginTop: 12 }}>
              Ver planes
            </Link>
          </div>
        ) : natalRow.time_unknown ? (
          <div className="panel" style={{ marginTop: 24 }}>
            <h3>Falta la hora de nacimiento</h3>
            <p className="muted" style={{ marginBottom: 0 }}>
              «{natalRow.name}» no tiene hora de nacimiento, así que no se pueden calcular las casas ni los ángulos de la revolución solar.
            </p>
          </div>
        ) : (
          <div className="panel" style={{ marginTop: 24 }}>
            <h3>Nueva revolución solar</h3>
            {status && status.remaining <= 0 ? (
              <p className="notice">Has usado tus {status.limit} revoluciones solares de este mes. Se renuevan el día 1.</p>
            ) : (
              <>
                <SolarReturnForm chartId={id} defaultYear={thisYear} defaultHouseSystem={natalRow.house_system} />
                {status && (
                  <p className="small muted" style={{ marginTop: 16 }}>
                    Te quedan {status.remaining} de {status.limit} este mes.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {returns.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <h3>Calculadas</h3>
            <div className="grid-3" style={{ marginTop: 16 }}>
              {returns.map((r) => (
                <Link key={r.id} href={`/carta/${id}/revolucion/${r.id}`} className="card card-link">
                  <h3>Revolución {r.year}</h3>
                  <p className="muted small" style={{ marginBottom: 0 }}>
                    {solarReturnSummary(r)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
