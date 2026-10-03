"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DREAMS_ENABLED, EMOTIONS } from "@/lib/dreams";
import { createClient } from "@/lib/supabase/server";

export type DreamFormState = { error?: string };

const UUID = /^[0-9a-f-]{36}$/i;
const EMOTION_SET = new Set<string>(EMOTIONS);

export async function createDream(_prev: DreamFormState, formData: FormData): Promise<DreamFormState> {
  if (!DREAMS_ENABLED) return { error: "El diario de sueños no está disponible." };
  const supabase = await createClient();
  if (!supabase) return { error: "La base de datos no está conectada." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?siguiente=/suenos/nuevo");

  const content = String(formData.get("content") ?? "").trim().slice(0, 8000);
  const title = String(formData.get("title") ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
  const date = String(formData.get("date") ?? "");
  const emotions = formData
    .getAll("emotions")
    .map(String)
    .filter((e) => EMOTION_SET.has(e))
    .slice(0, 8);
  const recurring = formData.get("recurring") === "on";
  const chartId = String(formData.get("chart_id") ?? "");

  if (content.length < 10) return { error: "Cuenta el sueño con un poco más de detalle." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Indica la fecha del sueño." };
  const year = Number(date.slice(0, 4));
  if (year < 1900 || new Date(date + "T00:00:00Z").getTime() > Date.now() + 2 * 86400000) return { error: "La fecha del sueño no es válida." };

  const { data, error } = await supabase
    .from("dreams")
    .insert({ user_id: user.id, content, title: title || null, dream_date: date, emotions, recurring, chart_id: UUID.test(chartId) ? chartId : null })
    .select("id")
    .single();
  if (error || !data) return { error: "No se ha podido guardar el sueño. Inténtalo de nuevo." };

  revalidatePath("/suenos");
  redirect(`/suenos/${data.id}?interpretar=1`);
}

export async function deleteDream(formData: FormData) {
  if (!DREAMS_ENABLED) redirect("/");
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (supabase && UUID.test(id)) await supabase.from("dreams").delete().eq("id", id);
  revalidatePath("/suenos");
  redirect("/suenos");
}

export async function deleteAllDreams(formData: FormData) {
  if (!DREAMS_ENABLED) redirect("/");
  if (formData.get("confirm") !== "on") redirect("/suenos?borrar=confirmar");
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("dreams").delete().eq("user_id", user.id);
      await supabase.from("dream_patterns").delete().eq("user_id", user.id);
    }
  }
  revalidatePath("/suenos");
  redirect("/suenos");
}
