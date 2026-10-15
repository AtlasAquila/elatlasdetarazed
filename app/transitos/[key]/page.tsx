import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RichText } from "@/components/RichText";
import { ReportContent } from "@/components/ReportContent";
import { StreamedReading } from "@/components/StreamedReading";
import { aiConfigured } from "@/lib/ai/anthropic";
import { eventSummary } from "@/lib/avisos";
import { listMyCharts } from "@/lib/charts";
import { getSession } from "@/lib/supabase/server";
import { findEvent, getReport } from "@/lib/transitos-reportes";

export const metadata: Metadata = { title: "Reporte de tránsito" };

type Props = { params: Promise<{ key: string }>; searchParams: Promise<{ carta?: string }> };

const whenFmt = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });

export default async function ReporteTransitoPage({ params, searchParams }: Props) {
  const { key } = await params;
  const { carta } = await searchParams;
  const here = `/transitos/${key}${carta ? `?carta=${carta}` : ""}`;
  if (!(await getSession())) redirect(`/entrar?siguiente=${encodeURIComponent(here)}`);

  const charts = await listMyCharts();
  const row = charts.find((c) => c.id === carta) ?? charts.find((c) => c.is_self) ?? charts[0];
  if (!row) redirect("/carta/nueva");

  const saved = await getReport(row.id, key);
  const found = saved ? null : findEvent(row, key);
  if (!saved && !found) notFound();

  const title = saved ? saved.title : eventSummary(found!.event);
  const at = saved ? new Date(saved.event_at) : new Date(found!.event.at);

  return (
    <section className="hero">
      <div className="container reading">
        <Link href={`/transitos?carta=${row.id}`} className="small">
          ← Tránsitos
        </Link>
        <p className="kicker" style={{ marginTop: 24 }}>
          {whenFmt.format(at)} · carta de {row.name}
        </p>
        <h1>{title}</h1>
        {saved ? (
          <>
            <RichText text={saved.content} />
            <ReportContent kind="lectura" content={saved.content} />
          </>
        ) : (
          <StreamedReading
            endpoint="/api/transitos"
            body={{ chartId: row.id, key }}
            initial={null}
            button="Escribir mi reporte"
            waiting="Alshain está colocando este tránsito sobre tu carta…"
            enabled={aiConfigured()}
            autoStart
            refreshOnDone
            note="Lectura orientativa, generada con inteligencia artificial a partir de los cálculos de tu carta."
          />
        )}
        {saved && (
          <p className="small muted" style={{ marginTop: 24 }}>
            Lectura orientativa, generada con inteligencia artificial a partir de los cálculos de tu carta.
          </p>
        )}
      </div>
    </section>
  );
}
