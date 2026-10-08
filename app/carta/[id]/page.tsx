import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteChart } from "@/app/actions/charts";
import { ChartQuestions, pairMessages, type QaMessage } from "@/components/ChartQuestions";
import { ChartWheel } from "@/components/ChartWheel";
import { PrintButton } from "@/components/PrintButton";
import { ReadingPanel } from "@/components/ReadingPanel";
import { aiConfigured } from "@/lib/ai/anthropic";
import { chartFromRow, getMyChart } from "@/lib/charts";
import { AspectGrid, AspectLegend, ChartFacts, ElementGrid, HousesGrid, PositionsTable } from "@/components/ChartSheet";
import { ASPECT_LABELS, HOUSE_SYSTEM_LABELS, POINT_LABELS, formatOrb, g } from "@/lib/engine/labels";
import type { BodyId } from "@/lib/engine/types";
import { createClient, getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Carta natal" };

type Search = { quiron?: string; lilith?: string; nodo?: string; estrellas?: string };
type Props = { params: Promise<{ id: string }>; searchParams: Promise<Search> };

const PLANETS: BodyId[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];

export default async function ChartPage({ params, searchParams }: Props) {
  const session = await getSession();
  const { id } = await params;
  if (!session) redirect(`/entrar?siguiente=/carta/${id}`);
  const row = await getMyChart(id);
  if (!row) notFound();

  const sp = await searchParams;
  const showChiron = sp.quiron === "1";
  const lilith = sp.lilith === "media" || sp.lilith === "verdadera" ? sp.lilith : null;
  const node = sp.nodo === "0" ? null : sp.nodo === "verdadero" ? "verdadero" : "medio";
  const showStars = sp.estrellas === "1";
  const chart = chartFromRow(row);

  // Lectura guardada (una por carta, extensa y para todas las cuentas).
  const supabase = await createClient();
  let reading: string | null = null;
  let questions: { question: string; answer: string }[] = [];
  if (supabase) {
    const { data } = await supabase.from("readings").select("content").eq("chart_id", id).eq("kind", "extensa").maybeSingle();
    reading = data?.content ?? null;
    // Preguntas hechas a Alshain sobre esta carta.
    const { data: conv } = await supabase.from("conversations").select("id").eq("chart_id", id).maybeSingle();
    if (conv) {
      const { data: msgs } = await supabase.from("messages").select("role, content").eq("conversation_id", conv.id).order("created_at", { ascending: true });
      questions = pairMessages((msgs ?? []) as QaMessage[]);
    }
  }

  const visible = new Set<string>(PLANETS);
  if (showChiron) visible.add("chiron");
  if (node) visible.add(node === "medio" ? "meanNode" : "trueNode");
  if (lilith) visible.add(lilith === "media" ? "meanLilith" : "trueLilith");

  const bodies = chart.bodies.filter((b) => visible.has(b.id));
  const aspects = chart.aspects.filter((a) => (visible.has(a.a) || a.a === "asc" || a.a === "mc") && (visible.has(a.b) || a.b === "asc" || a.b === "mc"));

  // Enlaces que cambian una opción y conservan las demás.
  const current: Search = {
    quiron: showChiron ? "1" : undefined,
    lilith: lilith ?? undefined,
    nodo: node === "medio" ? undefined : node === null ? "0" : "verdadero",
    estrellas: showStars ? "1" : undefined,
  };
  const href = (change: Partial<Search>) => {
    const next = { ...current, ...change };
    const qs = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]).toString();
    return `/carta/${row.id}${qs ? `?${qs}` : ""}`;
  };

  // Puntos de la cuadrícula de aspectos: cuerpos visibles y, si hay hora, Ascendente y Medio Cielo.
  const gridPoints: string[] = [...bodies.map((b) => b.id as string), ...(chart.angles ? ["asc", "mc"] : [])];

  return (
    <section className="chart-page">
      <div className="container">
        <Link href="/carta" className="small">
          ← Tus cartas
        </Link>

        <div className="print-row">
          <PrintButton />
        </div>

        <div style={{ marginTop: 20 }}>
          <ChartFacts
            birth={{
              name: row.name,
              date: row.birth_date,
              time: row.birth_time,
              timeUnknown: row.time_unknown,
              place: row.place_name,
              latitude: row.latitude,
              longitude: row.longitude,
              timeZone: row.time_zone,
            }}
            chart={chart}
          />
        </div>
        {chart.timeNotes.map((n) => (
          <p key={n} className="notice small" style={{ marginTop: 12 }}>
            {n}
          </p>
        ))}

        <div className="wheel-block">
          <ChartWheel chart={chart} show={visible} />
          <p className="wheel-legend small muted">
            <span>
              <i style={{ borderColor: "var(--azul-cielo)" }} />
              Trígono
            </span>
            <span>
              <i style={{ borderColor: "var(--azul-cielo)", borderTopStyle: "dashed" }} />
              Sextil
            </span>
            <span>
              <i style={{ borderColor: "var(--error)" }} />
              Cuadratura y oposición
            </span>
          </p>
          <div className="toggles" style={{ marginTop: 20 }} aria-label="Opciones de la carta">
            <Link className="toggle" data-on={showChiron ? "true" : "false"} href={href({ quiron: showChiron ? undefined : "1" })}>
              <span className="glyph-font">{g("⚷")}</span> Quirón
            </Link>
            <Link className="toggle" data-on={lilith === "media" ? "true" : "false"} href={href({ lilith: lilith === "media" ? undefined : "media" })}>
              <span className="glyph-font">{g("⚸")}</span> Lilith media
            </Link>
            <Link className="toggle" data-on={lilith === "verdadera" ? "true" : "false"} href={href({ lilith: lilith === "verdadera" ? undefined : "verdadera" })}>
              <span className="glyph-font">{g("⚸")}</span> Lilith verdadera
            </Link>
            <Link className="toggle" data-on={node === "medio" ? "true" : "false"} href={href({ nodo: node === "medio" ? "0" : undefined })}>
              <span className="glyph-font">{g("☊")}</span> Nodo medio
            </Link>
            <Link className="toggle" data-on={node === "verdadero" ? "true" : "false"} href={href({ nodo: node === "verdadero" ? "0" : "verdadero" })}>
              <span className="glyph-font">{g("☊")}</span> Nodo verdadero
            </Link>
            <Link className="toggle" data-on={showStars ? "true" : "false"} href={href({ estrellas: showStars ? undefined : "1" })}>
              ✦ Estrellas fijas
            </Link>
          </div>
        </div>

        <div className="sheet">
          <div>
            <div>
              <h3>Posiciones</h3>
              <PositionsTable bodies={bodies} chart={chart} />
            </div>
          </div>
          <div>
            <div>
              <h3>Elementos y modalidades</h3>
              <ElementGrid bodies={bodies} chart={chart} />
            </div>
            {showStars && (
              <div>
                <h3>Estrellas fijas</h3>
                {chart.fixedStars.length ? (
                  <div className="table-wrap">
                    <table className="pos-table">
                      <tbody>
                        {chart.fixedStars.map((f, i) => (
                          <tr key={i}>
                            <td>✦ {f.star}</td>
                            <td>en conjunción con {POINT_LABELS[f.point]?.name ?? f.point}</td>
                            <td className="muted small">orbe {formatOrb(f.orb)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="muted">Ninguna estrella fija principal está a menos de 1° de tus planetas o ángulos.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="folds">
          {chart.houses && (
            <details className="fold">
              <summary>
                <h3>Casas · {HOUSE_SYSTEM_LABELS[chart.houses.systemUsed]}</h3>
              </summary>
              <div className="fold-body">
                <HousesGrid chart={chart} />
              </div>
            </details>
          )}
          <details className="fold">
            <summary>
              <h3>Aspectos</h3>
              <span className="small muted">{aspects.length} aspectos</span>
            </summary>
            <div className="fold-body">
              <AspectGrid points={gridPoints} aspects={aspects} />
              <AspectLegend />
              <details style={{ marginTop: 16 }}>
                <summary className="small" style={{ cursor: "pointer", color: "var(--ink-muted)" }}>
                  Ver los aspectos en lista
                </summary>
                <div className="table-wrap" style={{ marginTop: 12 }}>
                  <table className="pos-table">
                    <tbody>
                      {aspects.map((a, i) => (
                        <tr key={i}>
                          <td className="glyph-font" aria-hidden="true">
                            {g(POINT_LABELS[a.a].glyph)}
                          </td>
                          <td className="glyph-font" style={{ color: ASPECT_LABELS[a.type].nature === "tenso" ? "var(--error)" : ASPECT_LABELS[a.type].nature === "armónico" ? "var(--azul-cielo)" : "var(--oro)" }} aria-hidden="true">
                            {g(ASPECT_LABELS[a.type].glyph)}
                          </td>
                          <td className="glyph-font" aria-hidden="true">
                            {g(POINT_LABELS[a.b].glyph)}
                          </td>
                          <td>
                            {POINT_LABELS[a.a].name} {ASPECT_LABELS[a.type].name.toLowerCase()} {POINT_LABELS[a.b].name}
                          </td>
                          <td className="muted small" style={{ whiteSpace: "nowrap" }}>
                            orbe {formatOrb(a.orb)}
                            {a.applying === true ? " · aplicativo" : a.applying === false ? " · separativo" : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          </details>
          <details className="fold">
            <summary>
              <h3>Lectura de tu carta</h3>
              <span className="small muted">{reading ? "Escrita" : "Aún sin generar"}</span>
            </summary>
            <div className="fold-body">
              <ReadingPanel chartId={row.id} reading={reading} enabled={aiConfigured()} />
            </div>
          </details>
          <details className="fold">
            <summary>
              <h3>Preguntas a Alshain</h3>
              <span className="small muted">{questions.length === 1 ? "1 pregunta" : `${questions.length} preguntas`}</span>
            </summary>
            <div className="fold-body">
              <ChartQuestions chartId={row.id} pairs={questions} />
            </div>
          </details>
        </div>

        <div className="reading-block" style={{ marginTop: 56 }}>
          <div className="card" style={{ padding: 28, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p className="kicker" style={{ marginBottom: 4 }}>
                Clima astral personalizado
              </p>
              <p style={{ margin: 0 }}>Los tránsitos de los próximos 30 días colocados sobre esta carta: casas que se activan, planetas lentos y lunaciones. Lectura extensa, 5 €.</p>
            </div>
            <Link href={`/carta/${row.id}/clima`} className="btn btn-primary">
              Ver mi clima astral
            </Link>
          </div>
          <div className="card" style={{ padding: 28, marginTop: 24, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p className="kicker" style={{ marginBottom: 4 }}>
                Revolución solar
              </p>
              <p style={{ margin: 0 }}>La carta del año que empieza en tu cumpleaños, calculada para donde estés ese día, con su lectura extensa. 5 €.</p>
            </div>
            <Link href={`/carta/${row.id}/revolucion`} className="btn btn-primary">
              Ver revolución solar
            </Link>
          </div>
        </div>

        <details className="panel" style={{ marginTop: 56 }}>
          <summary style={{ cursor: "pointer", color: "var(--ink-muted)" }}>Borrar esta carta</summary>
          <form action={deleteChart} style={{ marginTop: 16 }}>
            <input type="hidden" name="id" value={row.id} />
            <button type="submit" className="btn btn-ghost btn-small" style={{ borderColor: "var(--error)", color: "var(--error)" }}>
              Borrar «{row.name}»
            </button>
          </form>
        </details>
      </div>
    </section>
  );
}
