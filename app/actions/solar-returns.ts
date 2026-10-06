"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// La revolución solar se compra por lectura (app/actions/purchases.ts) y la crea /api/revolucion-solar.

export async function deleteSolarReturn(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const chartId = String(formData.get("chart_id") ?? "");
  if (supabase && id) await supabase.from("solar_returns").delete().eq("id", id);
  revalidatePath(`/carta/${chartId}/revolucion`);
  redirect(`/carta/${chartId}/revolucion`);
}
