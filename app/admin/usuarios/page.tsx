import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { adminRecentQuestions, adminUsers, ago, fmtDate } from "@/lib/admin";
import { getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Usuarios · Panel" };
export const dynamic = "force-dynamic";

export default async function AdminUsuariosPage() {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/cuenta");

  const [users, recent] = await Promise.all([adminUsers(), adminRecentQuestions(8)]);
  const now = Date.now();
  const week = 7 * 86400000;
  const stats = [
    { label: "Usuarios", value: users.length },
    { label: "Premium", value: users.filter((u) => u.plan === "premium").length },
    { label: "Nuevos en 7 días", value: users.filter((u) => now - new Date(u.created_at).getTime() < week).length },
    { label: "Activos en 7 días", value: users.filter((u) => u.last_activity && now - new Date(u.last_activity).getTime() < week).length },
    { label: "Preguntas a Alshain", value: users.reduce((a, u) => a + u.questions, 0) },
    { label: "Cartas guardadas", value: users.reduce((a, u) => a + u.charts, 0) },
  ];

  return (
    <section className="chart-page">
      <div className="container">
        <Link href="/admin" className="small">
          ← Panel
        </Link>
        <p className="kicker" style={{ marginTop: 24 }}>
          Panel de administración
        </p>
        <h1>Usuarios</h1>

        <div className="admin-stats">
          {stats.map((s) => (
            <div key={s.label} className="card admin-stat">
              <span className="admin-stat-value">{s.value}</span>
              <span className="admin-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="admin-cols">
          <div>
            <h2 style={{ fontSize: 30 }}>Cuentas</h2>
            <div className="table-wrap">
              <table className="pos-table admin-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Plan</th>
                    <th>Alta</th>
                    <th>Última actividad</th>
                    <th title="Cartas">Cartas</th>
                    <th title="Preguntas a Alshain">Preg.</th>
                    <th title="Personas en numerología">Num.</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <Link href={`/admin/usuarios/${u.id}`}>{u.email}</Link>
                        {u.display_name && <div className="small muted">{u.display_name}</div>}
                        {!u.email_confirmed && <div className="small" style={{ color: "var(--error)" }}>Correo sin confirmar</div>}
                      </td>
                      <td>{u.is_admin ? "Admin" : u.plan === "premium" ? "Premium" : "Gratuito"}</td>
                      <td className="small" style={{ whiteSpace: "nowrap" }}>{fmtDate(u.created_at)}</td>
                      <td className="small" style={{ whiteSpace: "nowrap" }}>{ago(u.last_activity, now)}</td>
                      <td className="num">{u.charts}</td>
                      <td className="num">{u.questions}</td>
                      <td className="num">{u.numerology_people}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="small muted" style={{ marginTop: 12 }}>
              «Última actividad» es el último inicio de sesión, pregunta, carta, persona o sueño. Las visitas anónimas se ven en Vercel Analytics.
            </p>
          </div>

          <aside>
            <h2 style={{ fontSize: 30 }}>Últimas preguntas</h2>
            {recent.length === 0 ? (
              <p className="muted">Nadie ha preguntado nada a Alshain todavía.</p>
            ) : (
              <div className="post-list">
                {recent.map((q) => (
                  <Link key={q.id} href={`/admin/usuarios/${q.user_id}`} className="post-item" style={{ padding: "16px 0" }}>
                    <span className="date">
                      {ago(q.created_at, now)} · {q.email} · carta «{q.chart_name}»
                    </span>
                    <p style={{ margin: "6px 0 0" }}>{q.content.length > 220 ? q.content.slice(0, 220) + "…" : q.content}</p>
                  </Link>
                ))}
              </div>
            )}
            <Link href="/admin/consultas" className="btn btn-ghost btn-small" style={{ marginTop: 16 }}>
              Ver todas las preguntas
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
