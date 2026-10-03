"use server";

import { createClient } from "@/lib/supabase/server";

export type FormState = { ok?: boolean; message?: string; error?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function joinWaitlist(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) return { error: "Escribe un correo electrónico válido." };
  if (formData.get("consent") !== "on") return { error: "Necesitamos tu permiso para escribirte cuando abramos." };

  const supabase = await createClient();
  if (!supabase) return { error: "La lista de espera aún no está conectada. Inténtalo más tarde." };

  const { error } = await supabase.from("waitlist").insert({ email });
  if (error && error.code !== "23505") return { error: "No hemos podido guardar tu correo. Inténtalo de nuevo." };
  return { ok: true, message: "Estás en la lista. Te escribiremos en cuanto El atlas de Tarazed abra sus puertas." };
}
