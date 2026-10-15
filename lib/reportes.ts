import { createClient } from "@/lib/supabase/server";

/** Un aviso enviado a la persona, guardado para poder verlo cuando quiera (pestaña «Reportes» de la app). */
export type Reporte = {
  id: string;
  kind: "weekly" | "transit";
  title: string;
  body: string;
  url: string;
  created_at: string;
  read_at: string | null;
};

export async function listReportes(limit = 60): Promise<Reporte[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.from("reportes").select("id, kind, title, body, url, created_at, read_at").order("created_at", { ascending: false }).limit(limit);
  return (data as Reporte[] | null) ?? [];
}

export async function countUnreadReportes(): Promise<number> {
  const supabase = await createClient();
  if (!supabase) return 0;
  const { count } = await supabase.from("reportes").select("id", { count: "exact", head: true }).is("read_at", null);
  return count ?? 0;
}
