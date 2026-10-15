"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getSession } from "@/lib/supabase/server";

export type ClimaDiarioFormState = { error?: string; message?: string };

async function requireAdmin() {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/entrar?siguiente=/admin/clima-diario");
  const supabase = await createClient();
  if (!supabase) redirect("/");
  return supabase;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Corrige una lectura ya escrita (titular, cielo del día, texto o cierre). */
export async function saveClimaDiario(_prev: ClimaDiarioFormState, formData: FormData): Promise<ClimaDiarioFormState> {
  const supabase = await requireAdmin();
  const day = String(formData.get("day") ?? "");
  const headline = String(formData.get("headline") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const closing = String(formData.get("closing") ?? "").trim();
  const tags = String(formData.get("tags") ?? "").split("\n").map((t) => t.trim()).filter(Boolean);
  if (!DAY.test(day)) return { error: "El día no es válido." };
  if (!headline) return { error: "El titular es obligatorio." };
  if (!body) return { error: "El texto está vacío." };

  const { error } = await supabase.from("clima_diario").update({ headline, tags, body, closing, updated_at: new Date().toISOString() }).eq("day", day);
  if (error) return { error: "No se ha podido guardar." };
  revalidatePath("/clima-astral");
  return { message: "Guardado." };
}

/** Retira una lectura: deja de verse en la web y en la app. */
export async function deleteClimaDiario(formData: FormData) {
  const supabase = await requireAdmin();
  const day = String(formData.get("day") ?? "");
  if (DAY.test(day)) await supabase.from("clima_diario").delete().eq("day", day);
  revalidatePath("/clima-astral");
  revalidatePath("/admin/clima-diario");
}
