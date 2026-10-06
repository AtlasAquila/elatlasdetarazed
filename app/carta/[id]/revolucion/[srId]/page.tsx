import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteSolarReturn } from "@/app/actions/solar-returns";
import { ChartWheel } from "@/components/ChartWheel";
import { PrintButton } from "@/components/PrintButton";
import { RichText } from "@/components/RichText";
import { AspectGrid, AspectLegend, ChartFacts, ElementGrid, HousesGrid, PositionsTable } from "@/components/ChartSheet";
import { getMyChart } from "@/lib/charts";
import { ASPECT_LABELS, HOUSE_SYSTEM_LABELS, POINT_LABELS, formatOrb, g } from "@/lib/engine/labels";
import type { BodyId } from "@/lib/engine/types";
import { getSolarReturn, solarReturnFromRow, solarReturnLocalParts } from "@/lib/solar-returns";
import { getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Revolución solar" };

type Props = { params: Promise<{ id: string; srId: string }> };

const PLANETS: BodyId[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];

export default async function SolarReturnPage({ params }: Props) {
  const session = await getSession();
  const { id, srId } = await params;
  if (!session) redirect(`/entrar?siguiente=/carta/${id}/revolucion/${srId}`);

  const [natalRow, row] = await Promise.all([getMyChart(id), getSolarReturn(srId)]);
  if (!natalRow || !row || row.chart_id !== id) notFound();

  const chart = solarReturnFromRow(row, natalRow);
  const local = solarReturnLocalParts(row);

  const visible = new Set<string>(PLANETS);
  const bodies = chart.bodies.filter((b) => visible.has(b.id));
  const aspects = chart.aspects.filter((a) => (visible.has(a.a) || a.a === "asc" || a.a === "mc") && (visible.has(a.b) || a.b === "asc" || a.b === "mc"));
  const gridPoints: string[] = [...bodies.map((b) => b.id as string), ...(chart.angles ? ["asc", "mc"] : [])];

  return (
    <section className="chart-page">
      <div className="container">
        <Link href={`/carta/${id}/revolucion`} className="small">
          ← Revoluciones solares de {natalRow.name}
        </Link>

        <div className="print-row">
          <PrintButton />
        </div>

        <div style={{ marginTop: 20 }}>
          <ChartFacts
            kicker="Revolución solar"
            birth={{
              name: `Revolución solar ${row.year} · ${natalRow.name}`,
              date: local.date,
              time: local.time,
              timeUnknown: false,
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
        </div>

        <div className="reading-block" style={{ marginTop: 56 }}>
          <p className="kicker">Lectura de tu revolución solar</p>
          {row.reading ? (
            <>
              <RichText text={row.reading} />
              <p className="small muted" style={{ marginTop: 24, marginBottom: 0 }}>
                Lectura orientativa, generada con inteligencia artificial a partir de los cálculos de tu carta y de la revolución.
              </p>
            </>
          ) : (
            <p className="notice">
              La lectura de esta revolución solar todavía no se ha generado. Tu compra sigue disponible: vuelve a{" "}
              <Link href={`/carta/${id}/revolucion`}>la lista de revoluciones solares</Link> para generarla sin pagar otra vez.
            </p>
          )}
        </div>

        <details className="panel" style={{ marginTop: 56 }}>
          <summary style={{ cursor: "pointer", color: "var(--ink-muted)" }}>Borrar esta revolución solar</summary>
          <form action={deleteSolarReturn} style={{ marginTop: 16 }}>
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="chart_id" value={id} />
            <button type="submit" className="btn btn-ghost btn-small" style={{ borderColor: "var(--error)", color: "var(--error)" }}>
              Borrar «Revolución {row.year}»
            </button>
          </form>
        </details>
      </div>
    </section>
  );
}
