import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteDream } from "@/app/actions/dreams";
import { StreamedReading } from "@/components/StreamedReading";
import { aiConfigured } from "@/lib/ai/anthropic";
import { getMyChart } from "@/lib/charts";
import { DREAMS_ENABLED, dreamTitle, formatDreamDate, getMyDream } from "@/lib/dreams";
import { getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sueño" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ interpretar?: string }> };

export default async function SuenoPage({ params, searchParams }: Props) {
  if (!DREAMS_ENABLED) notFound();
  const session = await getSession();
  const { id } = await params;
  if (!session) redirect(`/entrar?siguiente=/suenos/${id}`);
  const dream = await getMyDream(id);
  if (!dream) notFound();
  const sp = await searchParams;
  const chart = dream.chart_id ? await getMyChart(dream.chart_id) : null;

  return (
    <section className="chart-page">
      <div className="container reading">
        <Link href="/suenos" className="small">
          ← Tu diario de sueños
        </Link>

        <p className="kicker" style={{ marginTop: 24 }}>
          {formatDreamDate(dream.dream_date)}
          {dream.recurring ? " · recurrente" : ""}
        </p>
        <h1 style={{ marginBottom: 16 }}>{dreamTitle(dream)}</h1>
        <div className="dream-text">
          {dream.content.split(/\n+/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {(dream.emotions.length > 0 || chart) && (
          <p className="small muted" style={{ marginTop: 16 }}>
            {dream.emotions.length > 0 && <>Sentías: {dream.emotions.join(", ")}. </>}
            {chart && <>Leído con la carta de {chart.name}.</>}
          </p>
        )}
        {dream.symbols.length > 0 && (
          <div className="toggles" style={{ marginTop: 12 }} aria-label="Símbolos del sueño">
            {dream.symbols.map((s) => (
              <Link key={s} href={`/suenos?simbolo=${encodeURIComponent(s)}`} className="toggle">
                {s}
              </Link>
            ))}
          </div>
        )}

        <div className="plate" style={{ marginTop: 40 }}>
          <div>
            <p className="kicker">Interpretación de Alshain</p>
            <StreamedReading
              endpoint="/api/suenos"
              body={{ dreamId: dream.id }}
              initial={dream.interpretation}
              enabled={aiConfigured()}
              autoStart={sp.interpretar === "1"}
              refreshOnDone
              description="Una lectura simbólica del sueño que tiene en cuenta los que ya has anotado y, si has elegido una carta, tu cielo natal."
              button="Interpretar el sueño"
              waiting="Alshain está leyendo tu sueño. Tardará menos de un minuto; puedes ir leyendo mientras se escribe."
              note="Interpretación simbólica y orientativa, generada con inteligencia artificial. Los sueños no predicen el futuro."
            />
          </div>
        </div>

        <details className="panel" style={{ marginTop: 48 }}>
          <summary style={{ cursor: "pointer", color: "var(--ink-muted)" }}>Borrar este sueño</summary>
          <form action={deleteDream} style={{ marginTop: 16 }}>
            <input type="hidden" name="id" value={dream.id} />
            <p className="small muted">Se borran el relato y su interpretación. No se puede deshacer.</p>
            <button type="submit" className="btn btn-ghost btn-small" style={{ borderColor: "var(--error)", color: "var(--error)" }}>
              Borrar el sueño
            </button>
          </form>
        </details>
      </div>
    </section>
  );
}
