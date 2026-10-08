import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChartForm } from "@/components/ChartForm";
import { FREE_CHART_LIMIT, listMyCharts } from "@/lib/charts";
import { getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nueva carta" };

type Props = { searchParams: Promise<{ origen?: string }> };

export default async function NuevaCartaPage({ searchParams }: Props) {
  const { origen: origenParam } = await searchParams;
  const origen = origenParam === "venus" ? "venus" : undefined;
  const session = await getSession();
  if (!session) redirect(`/entrar?siguiente=${encodeURIComponent(origen ? "/carta/nueva?origen=venus" : "/carta/nueva")}`);
  const charts = await listMyCharts();
  const hasSelf = charts.some((c) => c.is_self);
  const existing = charts.find((c) => c.is_self) ?? charts[0];

  return (
    <section className="hero">
      <div className="container reading">
        <Link href="/carta" className="small">
          ← Tus cartas
        </Link>
        <p className="kicker" style={{ marginTop: 24 }}>
          Nueva carta
        </p>
        <h1>Tus datos de nacimiento</h1>
        <p className="lead">Con la fecha, la hora y el lugar exactos calculamos el cielo tal como era en ese instante.</p>
        {origen && (
          <p className="notice" style={{ marginTop: 24 }}>
            Vienes de la guía de Venus retrógrado. Al guardar tu carta, Alshain te propondrá preguntar cómo afecta la Luna Nueva con Venus retrógrado en Escorpio a tu carta.
            {existing && (
              <>
                {" "}
                Si prefieres usar una carta que ya tienes, <Link href={`/carta/${existing.id}/asistente?pregunta=venus`}>pregúntale a Alshain desde la carta de {existing.name}</Link>.
              </>
            )}
          </p>
        )}
        <div className="panel" style={{ marginTop: 24 }}>
          <ChartForm suggestSelf={!hasSelf} origen={origen} />
        </div>
        <p className="small muted" style={{ marginTop: 20 }}>
          La hora se interpreta en el horario oficial del lugar y la fecha de nacimiento, con sus cambios históricos de horario de verano. Puedes guardar hasta {FREE_CHART_LIMIT} cartas en el plan gratuito.
        </p>
      </div>
    </section>
  );
}
