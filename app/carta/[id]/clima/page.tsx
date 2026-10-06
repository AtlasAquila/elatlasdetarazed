import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";
import { PurchaseForm } from "@/components/PurchaseForm";
import { RichText } from "@/components/RichText";
import { StreamedReading } from "@/components/StreamedReading";
import { aiConfigured } from "@/lib/ai/anthropic";
import { getMyChart } from "@/lib/charts";
import { activeClimate, climatePeriodLabel, listClimates } from "@/lib/clima/personal";
import { PRICE_LABEL, confirmCheckout, findUsablePurchase, reconcilePending } from "@/lib/purchases";
import { getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Clima astral personalizado" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pago?: string; session_id?: string; error?: string; mensaje?: string }>;
};

const ERRORS: Record<string, string> = {
  consentimiento: "Marca la casilla de aceptación para poder comprar la lectura.",
  pagos: "No hemos podido abrir el pago. Inténtalo de nuevo en unos minutos; no se ha hecho ningún cargo.",
};

export default async function ClimatePage({ params, searchParams }: Props) {
  const session = await getSession();
  const { id } = await params;
  if (!session) redirect(`/entrar?siguiente=/carta/${id}/clima`);

  const row = await getMyChart(id);
  if (!row) notFound();

  const sp = await searchParams;
  // Vuelta del pago: se confirma con Stripe sin esperar al aviso. Si no, se repasan pagos pendientes.
  if (sp.session_id) await confirmCheckout(sp.session_id, session.userId);
  else await reconcilePending(session.userId);

  const [active, history, usable] = await Promise.all([activeClimate(id), listClimates(id), findUsablePurchase("clima", { chart_id: id })]);
  const past = history.filter((c) => c.id !== active?.id);
  const error = sp.error === "datos" ? sp.mensaje?.slice(0, 200) : sp.error ? ERRORS[sp.error] : null;

  return (
    <section className="hero">
      <div className="container reading">
        <Link href={`/carta/${id}`} className="small">
          ← {row.name}
        </Link>
        <p className="kicker" style={{ marginTop: 24 }}>
          Clima astral personalizado
        </p>
        <h1>Tu cielo de los próximos 30 días</h1>
        <p className="lead">
          Los tránsitos de las próximas semanas colocados sobre tu carta natal: qué casas se activan, qué planetas lentos tocan tus puntos clave y qué lunaciones caen en tu carta. Una lectura extensa y de conjunto, escrita a partir de los
          cálculos exactos de tu carta.
        </p>

        {sp.pago === "cancelado" && <p className="notice">Has salido del pago sin completarlo. No se ha hecho ningún cargo.</p>}
        {error && (
          <p className="notice notice-error" role="alert">
            {error}
          </p>
        )}

        {active ? (
          <div style={{ marginTop: 24 }}>
            <p className="kicker" style={{ marginBottom: 8 }}>
              Del {climatePeriodLabel(active)}
            </p>
            <div className="print-row">
              <PrintButton />
            </div>
            <RichText text={active.content} />
            <p className="small muted" style={{ marginTop: 24 }}>
              Lectura orientativa, generada con inteligencia artificial a partir de los cálculos de tu carta. Podrás comprar otra cuando termine este periodo.
            </p>
          </div>
        ) : usable ? (
          <div className="panel" style={{ marginTop: 24 }}>
            <StreamedReading
              endpoint="/api/clima"
              body={{ chartId: id }}
              initial={null}
              title="Tu lectura está pagada"
              description="El periodo empieza en el momento en que se genera la lectura. Tarda entre dos y tres minutos en escribirse; puedes ir leyendo mientras tanto."
              button="Generar mi clima astral"
              waiting="Alshain está colocando el cielo de las próximas semanas sobre tu carta. Es una lectura larga y tardará entre dos y tres minutos en completarse."
              enabled={aiConfigured()}
              autoStart={sp.pago === "ok"}
              refreshOnDone
              note="Lectura orientativa, generada con inteligencia artificial a partir de los cálculos de tu carta."
            />
          </div>
        ) : (
          <div className="panel" style={{ marginTop: 24 }}>
            <h3>Comprar la lectura · {PRICE_LABEL}</h3>
            <ul className="muted" style={{ paddingLeft: 20 }}>
              <li>Cubre 30 días desde que la generas, y hasta 10 más si justo después cae un evento importante (una lunación, una estación o un aspecto fuerte a tu carta).</li>
              <li>Usa las casas Placidus de tu carta y los tránsitos exactos, con sus fechas.</li>
              <li>Un solo pago: no es una suscripción. Podrás comprar otra cuando termine el periodo.</li>
            </ul>
            {row.time_unknown && (
              <p className="notice small">Esta carta no tiene hora de nacimiento: la lectura incluirá los aspectos a tus planetas, pero no las casas ni los ángulos.</p>
            )}
            {aiConfigured() ? (
              <PurchaseForm product="clima" fields={{ chart_id: id }} free={session.isAdmin} />
            ) : (
              <p className="muted small">Disponible muy pronto.</p>
            )}
          </div>
        )}

        {past.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <h3>Climas anteriores</h3>
            <div className="grid-3" style={{ marginTop: 16 }}>
              {past.map((c) => (
                <Link key={c.id} href={`/carta/${id}/clima/${c.id}`} className="card card-link">
                  <h3>Del {climatePeriodLabel(c)}</h3>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
