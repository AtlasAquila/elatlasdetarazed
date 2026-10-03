import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteSynastry } from "@/app/actions/synastry";
import { PrintButton } from "@/components/PrintButton";
import { SynastryWheel } from "@/components/SynastryWheel";
import { birthSummary } from "@/lib/charts";
import { ASPECT_LABELS, BODY_LABELS, HOUSE_SYSTEM_LABELS, ROMAN, formatOrb, g } from "@/lib/engine/labels";
import { computeSynastryData, getSynastry, getSynastryCharts, RELATIONSHIP_LABELS, SYNASTRY_BODIES } from "@/lib/synastry";
import { getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sinastría" };

type Props = { params: Promise<{ id: string }> };

export default async function SynastryPage({ params }: Props) {
  const session = await getSession();
  const { id } = await params;
  if (!session) redirect(`/entrar?siguiente=/sinastria/${id}`);

  const row = await getSynastry(id);
  if (!row) notFound();
  const charts = await getSynastryCharts(row);
  if (!charts) notFound();

  const { chartA, chartB, crossAspects, overlay } = computeSynastryData(charts.a, charts.b);

  return (
    <section className="chart-page">
      <div className="container">
        <Link href="/sinastria" className="small">
          ← Sinastrías
        </Link>

        <div className="print-row">
          <PrintButton />
        </div>

        <div style={{ marginTop: 20 }}>
          <p className="kicker" style={{ marginBottom: 6 }}>
            Sinastría · {RELATIONSHIP_LABELS[row.relationship_type]}
          </p>
          <h1 className="chart-name">
            {charts.a.name} × {charts.b.name}
          </h1>
          <p className="muted small">
            {charts.a.name}: {birthSummary(charts.a)}
          </p>
          <p className="muted small">
            {charts.b.name}: {birthSummary(charts.b)}
          </p>
        </div>

        <div className="wheel-block">
          <SynastryWheel
            chartA={chartA}
            chartB={chartB}
            nameA={charts.a.name}
            nameB={charts.b.name}
            bodiesA={chartA.bodies.filter((b) => SYNASTRY_BODIES.includes(b.id))}
            bodiesB={chartB.bodies.filter((b) => SYNASTRY_BODIES.includes(b.id))}
            crossAspects={crossAspects}
          />
          <p className="wheel-legend small muted">
            <span>
              <i style={{ borderColor: "var(--oro)" }} /> {charts.a.name} (exterior)
            </span>
            <span>
              <i style={{ borderColor: "var(--azul-cielo)" }} /> {charts.b.name} (interior)
            </span>
          </p>
        </div>

        <div className="folds">
          <details className="fold" open>
            <summary>
              <h3>Aspectos cruzados</h3>
              <span className="small muted">{crossAspects.length} aspectos</span>
            </summary>
            <div className="fold-body">
              <div className="table-wrap">
                <table className="pos-table">
                  <tbody>
                    {crossAspects.map((a, i) => (
                      <tr key={i}>
                        <td className="glyph-font" aria-hidden="true">
                          {g(BODY_LABELS[a.a as keyof typeof BODY_LABELS].glyph)}
                        </td>
                        <td
                          className="glyph-font"
                          style={{ color: ASPECT_LABELS[a.type].nature === "tenso" ? "var(--error)" : ASPECT_LABELS[a.type].nature === "armónico" ? "var(--azul-cielo)" : "var(--oro)" }}
                          aria-hidden="true"
                        >
                          {g(ASPECT_LABELS[a.type].glyph)}
                        </td>
                        <td className="glyph-font" aria-hidden="true">
                          {g(BODY_LABELS[a.b as keyof typeof BODY_LABELS].glyph)}
                        </td>
                        <td>
                          {BODY_LABELS[a.a as keyof typeof BODY_LABELS].name} ({charts.a.name}) {ASPECT_LABELS[a.type].name.toLowerCase()} {BODY_LABELS[a.b as keyof typeof BODY_LABELS].name} ({charts.b.name})
                        </td>
                        <td className="muted small" style={{ whiteSpace: "nowrap" }}>
                          orbe {formatOrb(a.orb)}
                        </td>
                      </tr>
                    ))}
                    {crossAspects.length === 0 && (
                      <tr>
                        <td colSpan={5} className="muted">
                          No hay aspectos dentro de orbe entre las dos cartas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </details>

          {overlay && chartA.houses && (
            <details className="fold">
              <summary>
                <h3>
                  Casas de {charts.a.name} · {HOUSE_SYSTEM_LABELS[chartA.houses.systemUsed]}
                </h3>
                <span className="small muted">planetas de {charts.b.name}</span>
              </summary>
              <div className="fold-body">
                <div className="table-wrap">
                  <table className="pos-table">
                    <tbody>
                      {overlay.map((o) => (
                        <tr key={o.bodyId}>
                          <td className="glyph-font" aria-hidden="true">
                            {g(BODY_LABELS[o.bodyId].glyph)}
                          </td>
                          <td>{BODY_LABELS[o.bodyId].name}</td>
                          <td className="muted small">
                            casa {ROMAN[o.house - 1]} de {charts.a.name}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </details>
          )}
        </div>

        <details className="panel" style={{ marginTop: 56 }}>
          <summary style={{ cursor: "pointer", color: "var(--ink-muted)" }}>Borrar esta sinastría</summary>
          <form action={deleteSynastry} style={{ marginTop: 16 }}>
            <input type="hidden" name="id" value={row.id} />
            <button type="submit" className="btn btn-ghost btn-small" style={{ borderColor: "var(--error)", color: "var(--error)" }}>
              Borrar «{charts.a.name} × {charts.b.name}»
            </button>
          </form>
        </details>
      </div>
    </section>
  );
}
