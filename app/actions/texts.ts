"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TEXT_GROUPS } from "@/lib/texts";
import { createClient, getSession } from "@/lib/supabase/server";

export type TextsFormState = { error?: string; message?: string };

export async function saveTexts(_prev: TextsFormState, formData: FormData): Promise<TextsFormState> {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/entrar?siguiente=/admin/textos");
  const supabase = await createClient();
  if (!supabase) return { error: "La base de datos no está conectada." };

  const group = TEXT_GROUPS.find((g) => g.id === formData.get("group"));
  if (!group) return { error: "Sección desconocida." };

  const toSave: { key: string; value: string; updated_at: string }[] = [];
  const toReset: string[] = [];
  const now = new Date().toISOString();

  for (const field of group.fields) {
    const raw = formData.get(field.key);
    if (raw === null) continue;
    let value = String(raw).replace(/\r\n/g, "\n").trim();
    if (field.kind !== "list" && field.kind !== "paragraph") value = value.replace(/\s*\n\s*/g, " ");
    if (field.kind === "list") value = value.split("\n").map((l) => l.trim()).filter(Boolean).join("\n");
    if (value.length > 5000) return { error: `«${field.label}» es demasiado largo.` };
    // Vacío o igual que el original: se vuelve al texto por defecto.
    if (!value || value === field.default) toReset.push(field.key);
    else toSave.push({ key: field.key, value, updated_at: now });
  }

  if (toSave.length) {
    const { error } = await supabase.from("site_texts").upsert(toSave, { onConflict: "key" });
    if (error) return { error: "No se han podido guardar los cambios." };
  }
  if (toReset.length) {
    const { error } = await supabase.from("site_texts").delete().in("key", toReset);
    if (error) return { error: "No se han podido guardar los cambios." };
  }

  revalidatePath("/", "layout");
  return { message: "Cambios guardados. Ya están en la web." };
}
