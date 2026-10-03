import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { adminRecentQuestions, fmtDateTime } from "@/lib/admin";
import { getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Preguntas a Alshain · Panel" };
export const dynamic = "force-dynamic";

export default async function AdminConsultasPage() {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/cuenta");
  const questions = await adminRecentQuestions(300);

  return (
    <section className="chart-page">
      <div className="container reading">
        <Link href="/admin/usuarios" className="small">
          ← Usuarios
        </Link>
        <p className="kicker" style={{ marginTop: 24 }}>
          Panel de administración
        </p>
        <h1>Preguntas a Alshain</h1>
        <p className="lead">
          {questions.length === 1 ? "La pregunta más reciente" : `Las ${questions.length} preguntas más recientes`} de todos los usuarios. Pulsa en una para ver la conversación completa de esa persona.
        </p>
        {questions.length === 0 ? (
          <p className="muted">Nadie ha preguntado nada todavía.</p>
        ) : (
          <div className="post-list">
            {questions.map((q) => (
              <Link key={q.id} href={`/admin/usuarios/${q.user_id}`} className="post-item" style={{ padding: "18px 0" }}>
                <span className="date">
                  {fmtDateTime(q.created_at)} · {q.email} · carta «{q.chart_name}»
                </span>
                <p style={{ margin: "6px 0 0", fontSize: 19 }}>{q.content}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
