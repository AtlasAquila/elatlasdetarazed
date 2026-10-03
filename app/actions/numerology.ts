"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nameWords } from "@/lib/numerology";
import { NUMEROLOGY_PEOPLE_LIMIT } from "@/lib/people";
import { createClient } from "@/lib/supabase/server";

export type PersonFormState = { error?: string };

function readForm(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
  const currentName = String(formData.get("current_name") ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
  const date = String(formData.get("date") ?? "");
  const label = String(formData.get("label") ?? "").trim().slice(0, 40);
  const isSelf = formData.get("is_self") === "on";

  let error: string | undefined;
  if (nameWords(fullName).join("").length < 2) error = "Escribe el nombre completo de nacimiento, con los apellidos.";
  else if (currentName && nameWords(currentName).join("").length < 2) error = "El nombre de uso debe tener letras.";
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) error = "Escribe la fecha de nacimiento.";
  else {
    const year = Number(date.slice(0, 4));
    if (year < 1800 || year > 2200) error = "La fecha debe estar entre 1800 y 2200.";
  }
  return {
    error,
    values: { full_name: fullName, current_name: currentName || null, birth_date: date, label: label || null, is_self: isSelf },
  };
}

export async function createPerson(_prev: PersonFormState, formData: FormData): Promise<PersonFormState> {
  const supabase = await createClient();
  if (!supabase) return { error: "La base de datos no está conectada." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?siguiente=/numerologia");

  const { error, values } = readForm(formData);
  if (error) return { error };

  const { count } = await supabase.from("numerology_people").select("id", { count: "exact", head: true });
  if ((count ?? 0) >= NUMEROLOGY_PEOPLE_LIMIT) return { error: `Has llegado al máximo de ${NUMEROLOGY_PEOPLE_LIMIT} personas. Borra alguna para añadir otra.` };

  if (values.is_self) await supabase.from("numerology_people").update({ is_self: false }).eq("is_self", true);
  const { data, error: dbError } = await supabase
    .from("numerology_people")
    .insert({ user_id: user.id, ...values })
    .select("id")
    .single();
  if (dbError || !data) return { error: "No se ha podido guardar. Inténtalo de nuevo." };

  revalidatePath("/numerologia");
  redirect(`/numerologia/${data.id}`);
}

export async function updatePerson(_prev: PersonFormState, formData: FormData): Promise<PersonFormState> {
  const supabase = await createClient();
  if (!supabase) return { error: "La base de datos no está conectada." };
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "No encontramos a esa persona." };
  const { error, values } = readForm(formData);
  if (error) return { error };

  const { data: before } = await supabase.from("numerology_people").select("full_name, current_name, birth_date").eq("id", id).maybeSingle();
  if (!before) return { error: "No encontramos a esa persona." };

  if (values.is_self) await supabase.from("numerology_people").update({ is_self: false }).eq("is_self", true).neq("id", id);
  const { error: dbError } = await supabase
    .from("numerology_people")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (dbError) return { error: "No se han podido guardar los cambios." };

  // Si cambian el nombre o la fecha, los números cambian: las lecturas guardadas dejan de valer.
  const changed = before.full_name !== values.full_name || (before.current_name ?? null) !== values.current_name || before.birth_date !== values.birth_date;
  if (changed) await supabase.from("numerology_readings").delete().or(`person_id.eq.${id},other_person_id.eq.${id}`);

  revalidatePath("/numerologia");
  revalidatePath(`/numerologia/${id}`);
  redirect(`/numerologia/${id}`);
}

export async function deletePerson(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (supabase && /^[0-9a-f-]{36}$/i.test(id)) await supabase.from("numerology_people").delete().eq("id", id);
  revalidatePath("/numerologia");
  redirect("/numerologia");
}
