import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { SolarReturnForm } from "@/components/SolarReturnForm";
import { StreamedReading } from "@/components/StreamedReading";
import { aiConfigured } from "@/lib/ai/anthropic";
import { getMyChart } from "@/lib/charts";
import { PRICE_LABEL, confirmCheckout, findUsablePurchase, reconcilePending } from "@/lib/purchases";
import { listSolarReturns, solarReturnSummary } from "@/lib/solar-returns";
import { getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Revolución solar" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pago?: string; session_id?: string; error?: string; mensaje?: string }>;
};

const ERRORS: Record<string, string> = {
  consentimiento: "Marca la casilla de aceptación para poder comprar la lectura.",
  pagos: "No hemos podido abrir el pago. Inténtalo de nuevo en unos minutos; no se ha hecho ningún cargo.",
};

export default async function SolarReturnListPage({ params, searchParams }: Props) {
  const session = await getSession();
  const { id } = await params;
  if (!session) redirect(`/entrar?siguiente=/carta/${id}/revolucion`);

  const natalRow = await getMyChart(id);
  if (!natalRow) notFound();

  const sp = await searchParams;
  // Vuelta del pago: se confirma con Stripe sin esperar al aviso. Si no, se repasan pagos pendientes.
  if (sp.session_id) await confirmCheckout(sp.session_id, session.userId);
  else await reconcilePending(session.userId);

  const [returns, usable] = await Promise.all([listSolarReturns(id), findUsablePurchase("revolucion", { chart_id: id })]);
  const thisYear = new Date().getUTCFullYear();
  const error = sp.error === "datos" ? sp.mensaje?.slice(0, 200) : sp.error ? ERRORS[sp.error] : null;

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
          cumpleaños. Cada compra incluye el cálculo y una lectura extensa que la relaciona con tu carta natal.
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
              endpoint="/api/revolucion-solar"
              body={{ chartId: id, purchaseId: usable.id }}
              initial={null}
              title={`Tu revolución solar ${usable.params.year} está pagada`}
              description={`Se calcula para ${usable.params.place_name} y se escribe su lectura. Tarda entre dos y tres minutos; puedes ir leyendo mientras tanto.`}
              button="Generar mi revolución solar"
              waiting="Alshain está leyendo la carta de tu año. Es una lectura larga y tardará entre dos y tres minutos en completarse."
              enabled={aiConfigured()}
              autoStart={sp.pago === "ok"}
              doneLink={{ header: "x-lectura-id", base: `/carta/${id}/revolucion/`, label: "Ver mi revolución solar con su rueda y sus tablas" }}
              note="Lectura orientativa, generada con inteligencia artificial a partir de los cálculos de tu carta."
            />
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
            <h3>Nueva revolución solar · {PRICE_LABEL}</h3>
            <p className="muted small">Un solo pago por cada revolución: no es una suscripción. Usa las casas Placidus.</p>
            {aiConfigured() ? <SolarReturnForm chartId={id} defaultYear={thisYear} free={session.isAdmin} /> : <p className="muted small">Disponible muy pronto.</p>}
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
