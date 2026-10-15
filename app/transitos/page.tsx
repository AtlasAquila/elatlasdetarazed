import type { Metadata } from "next";
import Link from "next/link";
import { eventSummary } from "@/lib/avisos";
import { listMyCharts } from "@/lib/charts";
import { getSession } from "@/lib/supabase/server";
import { AHEAD_DAYS, eventKey, eventPath, importantEvents, listReports, PAST_DAYS, skyForEvents } from "@/lib/transitos-reportes";

export const metadata: Metadata = {
  title: "Tránsitos",
  description: "Los movimientos planetarios importantes que tocan tu carta natal, con un reporte personal de cada uno.",
};

type Props = { searchParams: Promise<{ carta?: string }> };

const DAY = 86_400_000;
const whenFmt = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });
const dayFmt = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", timeZone: "Europe/Madrid" });

export default async function TransitosPage({ searchParams }: Props) {
  const { carta } = await searchParams;
  const session = await getSession();

  if (!session) {
    return (
      <Shell>
        <p className="lead">Los tránsitos se calculan sobre tu carta natal. Entra en tu cuenta para ver los que te tocan.</p>
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
  const data = skyForEvents(row, now);
  const events = importantEvents(data, now.getTime() - PAST_DAYS * DAY, now.getTime() + AHEAD_DAYS * DAY);
  const saved = await listReports(row.id);
  const savedKeys = new Set(saved.map((r) => r.event_key));
  const listedKeys = new Set(events.map(eventKey));
  const earlier = saved.filter((r) => !listedKeys.has(r.event_key));

  return (
    <Shell>
      <p className="muted">
        Sobre la carta de <strong>{row.name}</strong>
        {charts.length > 1 &&
          charts
            .filter((c) => c.id !== row.id)
            .map((c) => (
              <Link key={c.id} href={`/transitos?carta=${c.id}`} className="small" style={{ marginLeft: 12 }}>
                Ver {c.name}
              </Link>
            ))}
      </p>
      {!data.hasHouses && <p className="notice small">Esta carta no tiene hora de nacimiento: los reportes hablarán de aspectos y signos, no de casas.</p>}

      <h2 className="transitos-titulo">Ahora y lo que viene</h2>
      {events.length === 0 ? (
        <p className="muted">Un momento tranquilo: no hay tránsitos importantes sobre tu carta en los próximos {AHEAD_DAYS} días.</p>
      ) : (
        <ol className="transitos">
          {events.map((e) => {
            const key = eventKey(e);
            const ready = savedKeys.has(key);
            const soon = e.at <= now.getTime() + DAY;
            return (
              <li key={key}>
                <Link href={eventPath(row.id, e)} className={ready || !soon ? "transito" : "transito nuevo"}>
                  <span className="transito-fecha">{whenFmt.format(new Date(e.at))}</span>
                  <span className="transito-tipo">{eventSummary(e)}</span>
                  <span className="transito-estado">{ready ? "Reporte listo · leer" : soon ? "Nuevo · pulsa para leer tu reporte" : "Próximamente · ver mi reporte"}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}

      {earlier.length > 0 && (
        <>
          <h2 className="transitos-titulo">Reportes anteriores</h2>
          <ol className="transitos">
            {earlier.map((r) => (
              <li key={r.id}>
                <Link href={`/transitos/${r.event_key}?carta=${row.id}`} className="transito">
                  <span className="transito-fecha">{dayFmt.format(new Date(r.event_at))}</span>
                  <span className="transito-tipo">{r.title}</span>
                </Link>
              </li>
            ))}
          </ol>
        </>
      )}

      <p className="small muted" style={{ marginTop: 32 }}>
        Horas de España. Los tránsitos marcan tendencias, no destinos. Los reportes los escribe una inteligencia artificial a partir de los cálculos de tu carta.
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
