import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveReport } from "@/app/actions/contenido";
import { fmtDateTime } from "@/lib/admin";
import { createClient, getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Contenido reportado · Panel" };
export const dynamic = "force-dynamic";

const KINDS: Record<string, string> = { asistente: "Respuesta del asistente", lectura: "Lectura", numerologia: "Numerología" };
const REASONS: Record<string, string> = { inexacto: "Incorrecto o inexacto", ofensivo: "Ofensivo o dañino", inapropiado: "Inapropiado", otro: "Otro motivo" };

type Row = { id: string; user_id: string; kind: string; reason: string; comment: string | null; content: string; path: string | null; created_at: string; resolved_at: string | null };

export default async function ReportesIaPage() {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/cuenta");
  const supabase = await createClient();
  const { data } = supabase
    ? await supabase.from("contenido_reportado").select("id, user_id, kind, reason, comment, content, path, created_at, resolved_at").order("created_at", { ascending: false }).limit(200)
    : { data: null };
  const rows = (data as Row[] | null) ?? [];
  const pending = rows.filter((r) => !r.resolved_at);
  const resolved = rows.filter((r) => r.resolved_at);

  const item = (r: Row) => (
    <div key={r.id} className="panel" style={{ marginBottom: 16 }}>
      <p className="small muted" style={{ marginTop: 0 }}>
        {fmtDateTime(r.created_at)} · {KINDS[r.kind] ?? r.kind} ·{" "}
        <Link href={`/admin/usuarios/${r.user_id}`}>ver persona</Link>
        {r.path ? ` · ${r.path}` : ""}
      </p>
      <p style={{ margin: "0 0 8px" }}>
        <strong>{REASONS[r.reason] ?? r.reason}</strong>
        {r.comment ? `: ${r.comment}` : ""}
      </p>
      <details>
        <summary style={{ cursor: "pointer", color: "var(--ink-muted)" }}>Contenido reportado</summary>
        <p style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>{r.content}</p>
      </details>
      {!r.resolved_at && (
        <form action={resolveReport} style={{ marginTop: 12 }}>
          <input type="hidden" name="id" value={r.id} />
          <button type="submit" className="btn btn-ghost btn-small">
            Marcar como resuelto
          </button>
        </form>
      )}
    </div>
  );

  return (
    <section className="chart-page">
      <div className="container reading">
        <Link href="/admin" className="small">
          ← Panel
        </Link>
        <p className="kicker" style={{ marginTop: 24 }}>
          Panel de administración
        </p>
        <h1>Contenido reportado</h1>
        <p className="lead">Textos generados por IA que las personas han marcado desde la app o la web.</p>
        <h2>Pendientes ({pending.length})</h2>
        {pending.length === 0 ? <p className="muted">No hay nada pendiente.</p> : pending.map(item)}
        {resolved.length > 0 && (
          <>
            <h2 style={{ marginTop: 40 }}>Resueltos ({resolved.length})</h2>
            {resolved.map(item)}
          </>
        )}
      </div>
    </section>
  );
}
