import type { Metadata } from "next";
import Link from "next/link";
import { chartFromRow, listMyCharts } from "@/lib/charts";
import { computeClimate, topEvents, type TransitEvent } from "@/lib/clima/transitos";
import { describeEvent } from "@/lib/clima/facts";
import { getSession } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Tránsitos",
  description: "Los movimientos planetarios más importantes de la semana sobre tu carta natal.",
};

type Props = { searchParams: Promise<{ carta?: string }> };

const WEEK_DAYS = 7;
const MAX_EVENTS = 10;
const whenFmt = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });

const KIND_LABEL: Record<TransitEvent["kind"], string> = { aspect: "Aspecto a tu carta", house: "Cambio de casa", sign: "Cambio de signo", station: "Estación", lunation: "Lunación" };

export default async function TransitosPage({ searchParams }: Props) {
  const { carta } = await searchParams;
  const session = await getSession();

  if (!session) {
    return (
      <Shell>
        <p className="lead">Los tránsitos se calculan sobre tu carta natal. Entra en tu cuenta para verlos.</p>
        <div className="actions" style={{ marginTop: 24 }}>
          <Link href="/entrar?siguiente=/transitos" className="btn btn-primary">
            Entrar
          </Link>
          <Link href="/registro?siguiente=/transitos" className="btn btn-ghost">
            Crear cuenta gratis
          </Link>
        </div>
      </Shell>
    );
  }

  const charts = await listMyCharts();
  const row = charts.find((c) => c.id === carta) ?? charts.find((c) => c.is_self) ?? charts[0];
  if (!row) {
    return (
      <Shell>
        <p className="lead">Para ver cómo te afectan los tránsitos necesitamos tu carta natal: fecha, hora y lugar de nacimiento.</p>
        <div className="actions" style={{ marginTop: 24 }}>
          <Link href="/carta/nueva" className="btn btn-primary">
            Crear mi carta
          </Link>
        </div>
      </Shell>
    );
  }

  const now = new Date();
  const data = computeClimate(chartFromRow(row), now);
  const weekEnd = now.getTime() + WEEK_DAYS * 86_400_000;
  const week = topEvents(data.events.filter((e) => e.at <= weekEnd), MAX_EVENTS).sort((a, b) => a.at - b.at);

  return (
    <Shell>
      <p className="muted">
        Sobre la carta de <strong>{row.name}</strong>
        {charts.length > 1 && (
          <>
            {" · "}
            {charts
              .filter((c) => c.id !== row.id)
              .map((c) => (
                <Link key={c.id} href={`/transitos?carta=${c.id}`} className="small" style={{ marginRight: 12 }}>
                  Ver {c.name}
                </Link>
              ))}
          </>
        )}
      </p>
      {!data.hasHouses && <p className="notice small">Esta carta no tiene hora de nacimiento: se muestran los aspectos, pero no las casas.</p>}

      <h2 className="transitos-titulo">Esta semana</h2>
      {week.length === 0 ? (
        <p className="muted">Una semana tranquila: no hay tránsitos importantes sobre tu carta en los próximos {WEEK_DAYS} días.</p>
      ) : (
        <ol className="transitos">
          {week.map((e) => (
            <li key={`${e.kind}-${e.at}-${describeEvent(e)}`} className="transito">
              <span className="transito-fecha">{whenFmt.format(new Date(e.at))}</span>
              <span className="transito-tipo">{KIND_LABEL[e.kind]}</span>
              <span>{describeEvent(e)}</span>
            </li>
          ))}
        </ol>
      )}

      <p className="small muted" style={{ marginTop: 32 }}>
        Horas de España. Los datos astronómicos se calculan con el motor de Códice Orbital; los tránsitos marcan tendencias, no destinos.
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="hero">
      <div className="container reading">
        <h1 style={{ color: "var(--oro)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Tránsitos</h1>
        {children}
      </div>
    </section>
  );
}
