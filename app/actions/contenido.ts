"use server";

import { revalidatePath } from "next/cache";
import { REPORT_KINDS, REPORT_REASONS, type ReportInput, type ReportResult } from "@/lib/contenido";
import { createClient, getSession } from "@/lib/supabase/server";

/** Guarda el reporte de un contenido generado por IA (lo ve el administrador en el panel). */
export async function reportContent(input: ReportInput): Promise<ReportResult> {
  const session = await getSession();
  const supabase = await createClient();
  if (!session || !supabase) return { ok: false, error: "Tu sesión ha caducado. Vuelve a entrar." };
  if (!REPORT_KINDS.includes(input.kind) || !REPORT_REASONS.includes(input.reason)) return { ok: false, error: "No se ha podido enviar el reporte." };
  const content = String(input.content ?? "").trim().slice(0, 4000);
  if (!content) return { ok: false, error: "No hay nada que reportar." };
  const comment = String(input.comment ?? "").trim().slice(0, 1000);
  const path = String(input.path ?? "").slice(0, 300);

  const { error } = await supabase.from("contenido_reportado").insert({ user_id: session.userId, kind: input.kind, reason: input.reason, comment: comment || null, content, path: path || null });
  return error ? { ok: false, error: "No se ha podido enviar el reporte. Inténtalo de nuevo." } : { ok: true };
}

/** Marca un reporte como resuelto (solo administradores; la política de la tabla lo exige). */
export async function resolveReport(formData: FormData): Promise<void> {
  const session = await getSession();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!session?.isAdmin || !supabase || !/^[0-9a-f-]{36}$/i.test(id)) return;
  await supabase.from("contenido_reportado").update({ resolved_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin/reportes-ia");
}
