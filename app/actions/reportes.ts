"use server";

import { createServiceClient, getSession } from "@/lib/supabase/server";

/** Marca como leídos todos los reportes de la persona. */
export async function markReportesRead(): Promise<void> {
  const session = await getSession();
  const sb = createServiceClient();
  if (!session || !sb) return;
  await sb.from("reportes").update({ read_at: new Date().toISOString() }).eq("user_id", session.userId).is("read_at", null);
}
