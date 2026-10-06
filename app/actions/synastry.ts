"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// La sinastría se compra por lectura (app/actions/purchases.ts) y la crea /api/sinastria.

export async function deleteSynastry(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (supabase && id) await supabase.from("synastries").delete().eq("id", id);
  revalidatePath("/sinastria");
  redirect("/sinastria");
}
