import { createClient } from "@/lib/supabase/server";

export type AdminUser = {
  id: string;
  email: string;
  display_name: string | null;
  plan: string;
  is_admin: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
  charts: number;
  questions: number;
  readings: number;
  numerology_people: number;
  dreams: number;
  last_activity: string | null;
};

export type AdminMessage = { id: string; created_at: string; role: "user" | "assistant"; content: string; chart_name: string; chart_id: string };
export type AdminQuestion = { id: string; created_at: string; content: string; user_id: string; email: string; chart_name: string };

export async function adminUsers(): Promise<AdminUser[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.rpc("admin_users");
  return (data as AdminUser[] | null) ?? [];
}

export async function adminUserMessages(uid: string): Promise<AdminMessage[]> {
  const supabase = await createClient();
  if (!supabase || !/^[0-9a-f-]{36}$/i.test(uid)) return [];
  const { data } = await supabase.rpc("admin_user_messages", { uid });
  return (data as AdminMessage[] | null) ?? [];
}

export async function adminRecentQuestions(lim = 150): Promise<AdminQuestion[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.rpc("admin_recent_questions", { lim });
  return (data as AdminQuestion[] | null) ?? [];
}

const dateTime = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });
const dateOnly = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Madrid" });
export const fmtDateTime = (iso: string | null) => (iso ? dateTime.format(new Date(iso)) : "—");
export const fmtDate = (iso: string | null) => (iso ? dateOnly.format(new Date(iso)) : "—");

/** «hace 3 h», «hace 2 días»… */
export function ago(iso: string | null, now = Date.now()) {
  if (!iso) return "nunca";
  const min = Math.round((now - new Date(iso).getTime()) / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `hace ${d} ${d === 1 ? "día" : "días"}`;
  return fmtDate(iso);
}
