"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isValidTimeZone } from "@/lib/engine/time";
import { FREE_CHART_LIMIT, PREMIUM_CHART_LIMIT } from "@/lib/charts";
import { createClient } from "@/lib/supabase/server";

export type ChartFormState = { error?: string };

const SYSTEMS = new Set(["placidus", "koch", "equal", "whole"]);

export async function createChart(_prev: ChartFormState, formData: FormData): Promise<ChartFormState> {
  const supabase = await createClient();
  if (!supabase) return { error: "La base de datos no está conectada." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?siguiente=/carta/nueva");

  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const timeUnknown = formData.get("time_unknown") === "on";
  const placeName = String(formData.get("place_name") ?? "").trim().slice(0, 200);
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const timeZone = String(formData.get("time_zone") ?? "");
  const houseSystem = String(formData.get("house_system") ?? "placidus");
  const isSelf = formData.get("is_self") === "on";

  if (!name) return { error: "Ponle un nombre a la carta." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Escribe la fecha de nacimiento." };
  const year = Number(date.slice(0, 4));
  if (year < 1800 || year > 2200) return { error: "La fecha debe estar entre 1800 y 2200." };
  if (!timeUnknown && !/^\d{2}:\d{2}$/.test(time)) return { error: "Escribe la hora de nacimiento o marca que no la sabes." };
  if (!placeName || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return { error: "Elige el lugar de nacimiento de la lista." };
  }
  if (!isValidTimeZone(timeZone)) return { error: "Elige el lugar de nacimiento de la lista." };
  if (!SYSTEMS.has(houseSystem)) return { error: "Sistema de casas no válido." };

  const [{ count }, { data: profile }] = await Promise.all([
    supabase.from("charts").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle(),
  ]);
  const limit = profile?.plan === "premium" ? PREMIUM_CHART_LIMIT : FREE_CHART_LIMIT;
  if ((count ?? 0) >= limit) {
    return { error: `Has llegado al máximo de ${limit} cartas guardadas de tu plan. Borra alguna para crear otra.` };
  }

  const { data, error } = await supabase
    .from("charts")
    .insert({
      user_id: user.id,
      name,
      birth_date: date,
      birth_time: timeUnknown ? null : time,
      time_unknown: timeUnknown,
      place_name: placeName,
      latitude,
      longitude,
      time_zone: timeZone,
      house_system: houseSystem,
      is_self: isSelf,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "No se ha podido guardar la carta. Inténtalo de nuevo." };

  revalidatePath("/carta");
  redirect(`/carta/${data.id}`);
}

export async function deleteChart(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (supabase && id) await supabase.from("charts").delete().eq("id", id);
  revalidatePath("/carta");
  redirect("/carta");
}

export async function setHouseSystem(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const system = String(formData.get("house_system") ?? "");
  if (supabase && id && SYSTEMS.has(system)) await supabase.from("charts").update({ house_system: system, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath(`/carta/${id}`);
}
