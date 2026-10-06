import type { Metadata } from "next";
import Link from "next/link";
import { SynastryForm } from "@/components/SynastryForm";
import { StreamedReading } from "@/components/StreamedReading";
import { aiConfigured } from "@/lib/ai/anthropic";
import { birthSummary, listMyCharts } from "@/lib/charts";
import { PRICE_LABEL, confirmCheckout, findUsablePurchase, reconcilePending } from "@/lib/purchases";
import { listMySynastries, RELATIONSHIP_LABELS, type RelationshipType } from "@/lib/synastry";
import { getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sinastría" };

type Props = { searchParams: Promise<{ pago?: string; session_id?: string; error?: string; mensaje?: string }> };

const ERRORS: Record<string, string> = {
  consentimiento: "Marca la casilla de aceptación para poder comprar la lectura.",
  pagos: "No hemos podido abrir el pago. Inténtalo de nuevo en unos minutos; no se ha hecho ningún cargo.",
};

export default async function SynastryListPage({ searchParams }: Props) {
  const session = await getSession();

  if (!session) {
    return (
      <section className="hero">
        <div className="container">
          <div>
            <p className="kicker">Sinastría</p>
            <h1>Cómo dialogan dos cartas</h1>
            <p className="lead">
              La sinastría compara dos cartas natales: los aspectos entre los planetas de una persona y los de otra, y en qué casas caen. Cada compra ({PRICE_LABEL}) incluye el cálculo y una lectura extensa del vínculo.
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

  const sp = await searchParams;
  // Vuelta del pago: se confirma con Stripe sin esperar al aviso. Si no, se repasan pagos pendientes.
  if (sp.session_id) await confirmCheckout(sp.session_id, session.userId);
  else await reconcilePending(session.userId);

  const [charts, synastries, usable] = await Promise.all([listMyCharts(), listMySynastries(), findUsablePurchase("sinastria", {})]);
  const chartById = new Map(charts.map((c) => [c.id, c]));
  const options = charts.map((c) => ({ id: c.id, label: `${c.name} · ${birthSummary(c)}` }));
  const error = sp.error === "datos" ? sp.mensaje?.slice(0, 200) : sp.error ? ERRORS[sp.error] : null;
  const usableA = usable ? chartById.get(String(usable.params.chart_a_id)) : null;
  const usableB = usable ? chartById.get(String(usable.params.chart_b_id)) : null;

  return (
    <section className="hero">
      <div className="container reading">
        <p className="kicker">Sinastría</p>
        <h1>Cómo dialogan dos cartas</h1>
        <p className="lead">
          La comparación entre dos cartas natales: cómo se relacionan los planetas de una persona con los de otra, en la pareja, la familia o el trabajo. Cada compra incluye el cálculo y una lectura extensa del vínculo.
        </p>

        {sp.pago === "cancelado" && <p className="notice">Has salido del pago sin completarlo. No se ha hecho ningún cargo.</p>}
        {error && (
          <p className="notice notice-error" role="alert">
            {error}
          </p>
        )}

        {usable ? (
          <div className="panel" style={{ marginTop: 24 }}>
            <StreamedReading
              endpoint="/api/sinastria"
              body={{ purchaseId: usable.id }}
              initial={null}
              title={`Tu sinastría ${usableA && usableB ? `de ${usableA.name} y ${usableB.name} ` : ""}está pagada`}
              description={`Vínculo: ${RELATIONSHIP_LABELS[String(usable.params.relationship_type) as RelationshipType] ?? "otro"}. Se calcula y se escribe su lectura. Tarda entre dos y tres minutos; puedes ir leyendo mientras tanto.`}
              button="Generar mi sinastría"
              waiting="Alshain está leyendo cómo dialogan las dos cartas. Es una lectura larga y tardará entre dos y tres minutos en completarse."
              enabled={aiConfigured()}
              autoStart={sp.pago === "ok"}
              doneLink={{ header: "x-lectura-id", base: "/sinastria/", label: "Ver mi sinastría con su rueda y sus tablas" }}
              note="Lectura orientativa, generada con inteligencia artificial a partir de los cálculos de las dos cartas."
            />
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
            <h3>Nueva sinastría · {PRICE_LABEL}</h3>
            <p className="muted small">Un solo pago por cada sinastría: no es una suscripción. Las dos cartas necesitan hora de nacimiento.</p>
            {aiConfigured() ? <SynastryForm charts={options} free={session.isAdmin} /> : <p className="muted small">Disponible muy pronto.</p>}
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
