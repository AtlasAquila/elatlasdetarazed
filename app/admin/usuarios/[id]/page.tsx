import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RichText } from "@/components/RichText";
import { adminUserMessages, adminUsers, ago, fmtDate, fmtDateTime } from "@/lib/admin";
import { getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Usuario · Panel" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminUsuarioPage({ params }: Props) {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/cuenta");
  const { id } = await params;
  const users = await adminUsers();
  const user = users.find((u) => u.id === id);
  if (!user) notFound();
  const messages = (await adminUserMessages(id)).reverse(); // cronológico

  // Agrupadas por carta; cada pregunta con su respuesta.
  const byChart = new Map<string, { name: string; items: { q: (typeof messages)[number]; a?: (typeof messages)[number] }[] }>();
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (m.role !== "user") continue;
    const next = messages[i + 1];
    const group = byChart.get(m.chart_id) ?? { name: m.chart_name, items: [] };
    group.items.push({ q: m, a: next && next.role === "assistant" && next.chart_id === m.chart_id ? next : undefined });
    byChart.set(m.chart_id, group);
  }

  const facts = [
    ["Plan", user.is_admin ? "Administrador" : user.plan === "premium" ? "Premium" : "Gratuito"],
    ["Alta", fmtDate(user.created_at)],
    ["Último acceso", fmtDateTime(user.last_sign_in_at)],
    ["Última actividad", ago(user.last_activity)],
    ["Cartas", String(user.charts)],
    ["Lecturas de carta", String(user.readings)],
    ["Preguntas a Alshain", String(user.questions)],
    ["Numerología", `${user.numerology_people} ${user.numerology_people === 1 ? "persona" : "personas"}`],
  ];

  return (
    <section className="chart-page">
      <div className="container reading">
        <Link href="/admin/usuarios" className="small">
          ← Usuarios
        </Link>
        <p className="kicker" style={{ marginTop: 24 }}>
          Usuario
        </p>
        <h1 style={{ overflowWrap: "anywhere" }}>{user.display_name || user.email}</h1>
        {user.display_name && <p className="muted">{user.email}</p>}
        {!user.email_confirmed && <p className="notice small">Aún no ha confirmado su correo.</p>}

        <dl className="facts-grid admin-facts">
          {facts.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>

        <h2 style={{ marginTop: 48 }}>Preguntas a Alshain</h2>
        {byChart.size === 0 ? (
          <p className="muted">No ha hecho ninguna pregunta todavía.</p>
        ) : (
          [...byChart.entries()].map(([chartId, g]) => (
            <div key={chartId} style={{ marginTop: 32 }}>
              <h3>
                Carta «{g.name}» <span className="small muted">· {g.items.length} {g.items.length === 1 ? "pregunta" : "preguntas"}</span>
              </h3>
              <div className="post-list">
                {g.items.map(({ q, a }) => (
                  <div key={q.id} className="post-item" style={{ padding: "18px 0" }}>
                    <span className="date">{fmtDateTime(q.created_at)}</span>
                    <p style={{ margin: "6px 0 0", fontSize: 19 }}>{q.content}</p>
                    {a && (
                      <details style={{ marginTop: 10 }}>
                        <summary className="small" style={{ cursor: "pointer", color: "var(--ink-muted)" }}>
                          Ver la respuesta de Alshain
                        </summary>
                        <div className="chat-msg chat-assistant" style={{ maxWidth: "100%", marginTop: 10 }}>
                          <RichText text={a.content} />
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        <p className="small muted" style={{ marginTop: 40 }}>
          Por privacidad, el panel no muestra los nombres de la numerología: solo cuántos hay.
        </p>
      </div>
    </section>
  );
}
