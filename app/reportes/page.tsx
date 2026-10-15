import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ReportesMarkRead } from "@/components/ReportesMarkRead";
import { listReportes } from "@/lib/reportes";
import { getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Reportes" };

const dateFmt = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });

export default async function ReportesPage() {
  const session = await getSession();
  if (!session) redirect("/entrar?siguiente=/reportes");
  const reportes = await listReportes();
  const unread = reportes.filter((r) => !r.read_at).length;

  return (
    <section className="hero">
      <div className="container reading">
        <p className="kicker">Reportes</p>
        <h1>Tus avisos</h1>
        <p className="lead">El clima astral de cada semana y lo importante que llega a tu carta, guardado para que lo veas cuando quieras.</p>

        {reportes.length === 0 ? (
          <div className="panel" style={{ marginTop: 32 }}>
            <p className="muted" style={{ marginBottom: 16 }}>
              Todavía no hay reportes. Aparecerán aquí cuando se publique el clima de la semana o llegue una lunación o un tránsito importante a tu carta.
            </p>
            <Link href="/cuenta" className="btn btn-ghost btn-small">
              Activar los avisos
            </Link>
          </div>
        ) : (
          <ul className="reportes">
            {reportes.map((r) => (
              <li key={r.id}>
                <Link href={r.url} className={r.read_at ? "reporte" : "reporte nuevo"}>
                  <span className="reporte-fecha">{dateFmt.format(new Date(r.created_at))}</span>
                  <strong>{r.title}</strong>
                  <span>{r.body}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <ReportesMarkRead unread={unread} />
      </div>
    </section>
  );
}
