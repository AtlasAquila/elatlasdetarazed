import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteAllDreams } from "@/app/actions/dreams";
import { StreamedReading } from "@/components/StreamedReading";
import { aiConfigured } from "@/lib/ai/anthropic";
import { DREAMS_ENABLED, DREAM_LIMITS, dreamTitle, formatDreamDate, listMyDreams, symbolCounts } from "@/lib/dreams";
import { createClient, getSession } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Diario de sueños",
  description: "Anota tus sueños y recibe una interpretación simbólica que recuerda los anteriores, detecta los símbolos que se repiten y los relaciona con tu carta natal.",
};

type Props = { searchParams: Promise<{ simbolo?: string; borrar?: string }> };

export default async function SuenosPage({ searchParams }: Props) {
  if (!DREAMS_ENABLED) notFound();
  const session = await getSession();

  if (!session) {
    return (
      <section className="hero">
        <div className="container">
          <div>
            <p className="kicker">Diario de sueños</p>
            <h1>Lo que dices cuando duermes</h1>
            <p className="lead">
              Anota tus sueños y Alshain los interpreta como lo que son: un lenguaje simbólico de tu mundo interior. Cada interpretación recuerda los sueños anteriores, y con el tiempo el diario revela los símbolos y los temas que vuelven.
            </p>
            <ul className="lead" style={{ paddingLeft: 24 }}>
              <li>Interpretación de cada sueño, en la línea de la psicología de Jung.</li>
              <li>Memoria: relaciona cada sueño con los que ya has anotado.</li>
              <li>Símbolos recurrentes y un análisis de los patrones de tu diario.</li>
              <li>Si quieres, leídos también con tu carta natal: la Luna, Neptuno y la casa XII.</li>
            </ul>
            <div className="actions" style={{ marginTop: 32 }}>
              <Link href="/registro?siguiente=/suenos" className="btn btn-primary">
                Crea tu cuenta gratis
              </Link>
              <Link href="/entrar?siguiente=/suenos" className="btn btn-ghost">
                Ya tengo cuenta
              </Link>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <svg viewBox="0 0 200 200" width="320" height="320" className="dream-art">
              <circle cx="100" cy="100" r="92" fill="none" stroke="var(--line)" />
              <path d="M128 40a64 64 0 1 0 0 120a54 54 0 1 1 0-120z" fill="var(--oro-soft)" stroke="var(--oro)" strokeWidth="1.5" />
              <circle cx="150" cy="62" r="2.5" fill="var(--estrella)" />
              <circle cx="162" cy="96" r="1.6" fill="var(--estrella)" />
              <circle cx="140" cy="132" r="2" fill="var(--estrella)" />
              <circle cx="58" cy="44" r="1.4" fill="var(--estrella)" />
            </svg>
          </div>
        </div>
      </section>
    );
  }

  const sp = await searchParams;
  const dreams = await listMyDreams();
  const interpreted = dreams.filter((d) => d.summary);
  const symbols = symbolCounts(interpreted);
  const recurringSymbols = symbols.filter(([, n]) => n > 1).slice(0, 20);
  const filter = sp.simbolo?.toLowerCase() ?? null;
  const shown = filter ? dreams.filter((d) => d.symbols.includes(filter)) : dreams;

  let patterns: { content: string; dream_count: number } | null = null;
  const supabase = await createClient();
  if (supabase) {
    const { data } = await supabase.from("dream_patterns").select("content, dream_count").eq("user_id", session.userId).maybeSingle();
    patterns = data;
  }
  const stale = patterns ? patterns.dream_count !== interpreted.length : false;

  return (
    <section className="hero">
      <div className="container">
        <p className="kicker">Diario de sueños</p>
        <h1>Tu diario de sueños</h1>
        <p className="lead">{dreams.length === 0 ? "Aún no has anotado ningún sueño." : `${dreams.length} ${dreams.length === 1 ? "sueño anotado" : "sueños anotados"}.`}</p>
        <div className="actions" style={{ margin: "24px 0 40px" }}>
          <Link href="/suenos/nuevo" className="btn btn-primary">
            Anotar un sueño
          </Link>
        </div>

        {dreams.length === 0 ? (
          <div className="panel">
            <h3>Empieza esta noche</h3>
            <p className="muted" style={{ marginBottom: 0 }}>
              Deja el móvil cerca y anota el sueño nada más despertar, aunque solo recuerdes una imagen. Con unos pocos sueños, Alshain empezará a ver qué símbolos se repiten y qué temas vuelven.
            </p>
          </div>
        ) : (
          <div className="dream-layout">
            <div>
              {filter && (
                <p className="notice small" style={{ marginBottom: 20 }}>
                  Sueños con el símbolo «{filter}» ({shown.length}). <Link href="/suenos">Ver todos</Link>
                </p>
              )}
              <div className="post-list">
                {shown.map((d) => (
                  <Link key={d.id} href={`/suenos/${d.id}`} className="post-item">
                    <span className="date">
                      {formatDreamDate(d.dream_date)}
                      {d.recurring ? " · recurrente" : ""}
                      {!d.interpretation ? " · sin interpretar" : ""}
                    </span>
                    <h3 style={{ margin: "6px 0" }}>{dreamTitle(d)}</h3>
                    {d.summary && <p className="muted small" style={{ margin: 0 }}>{d.summary}</p>}
                    {d.symbols.length > 0 && <p className="small" style={{ margin: "8px 0 0", color: "var(--oro)" }}>{d.symbols.join(" · ")}</p>}
                  </Link>
                ))}
              </div>
            </div>

            <aside className="dream-aside">
              <div className="panel">
                <h3>Símbolos que vuelven</h3>
                {recurringSymbols.length > 0 ? (
                  <div className="toggles">
                    {recurringSymbols.map(([s, n]) => (
                      <Link key={s} href={filter === s ? "/suenos" : `/suenos?simbolo=${encodeURIComponent(s)}`} className="toggle" data-on={filter === s ? "true" : "false"}>
                        {s} <span className="muted small">{n}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="muted small" style={{ marginBottom: 0 }}>
                    Cuando un símbolo aparezca en más de un sueño, lo verás aquí.
                  </p>
                )}
              </div>

              <div className="panel">
                <p className="kicker" style={{ marginBottom: 4 }}>
                  Patrones de tu diario
                </p>
                {interpreted.length < DREAM_LIMITS.minForPatterns && !patterns ? (
                  <p className="muted small" style={{ marginBottom: 0 }}>
                    Con {DREAM_LIMITS.minForPatterns} sueños interpretados, Alshain podrá analizar los temas, emociones y símbolos que se repiten en tu diario. Llevas {interpreted.length}.
                  </p>
                ) : (
                  <StreamedReading
                    endpoint="/api/suenos/patrones"
                    initial={patterns?.content ?? null}
                    enabled={aiConfigured()}
                    description="Un análisis de todo tu diario: símbolos que vuelven, clima emocional, hilos de fondo y cómo han evolucionado."
                    button="Analizar mi diario"
                    waiting="Alshain está releyendo tu diario completo. Tardará alrededor de un minuto."
                    refreshLabel={stale ? "Actualizar con los sueños nuevos" : undefined}
                  />
                )}
              </div>
            </aside>
          </div>
        )}

        {dreams.length > 0 && (
          <details className="panel" style={{ marginTop: 56 }} open={sp.borrar === "confirmar"}>
            <summary style={{ cursor: "pointer", color: "var(--ink-muted)" }}>Borrar el diario entero</summary>
            <form action={deleteAllDreams} style={{ marginTop: 16 }}>
              <label className="check" style={{ marginBottom: 16 }}>
                <input type="checkbox" name="confirm" />
                Entiendo que se borrarán todos mis sueños, sus interpretaciones y el análisis de patrones, y que no se puede deshacer.
              </label>
              <button type="submit" className="btn btn-ghost btn-small" style={{ borderColor: "var(--error)", color: "var(--error)" }}>
                Borrar todo el diario
              </button>
            </form>
          </details>
        )}
      </div>
    </section>
  );
}
