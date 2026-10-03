"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMyChart } from "@/lib/charts";
import { ENGINE_VERSION } from "@/lib/engine";
import { getSynastryStatus, type RelationshipType } from "@/lib/synastry";
import { createClient } from "@/lib/supabase/server";

export type SynastryFormState = { error?: string };

const RELATIONSHIP_TYPES: RelationshipType[] = ["pareja", "familia", "amistad", "trabajo", "otro"];

export async function createSynastry(_prev: SynastryFormState, formData: FormData): Promise<SynastryFormState> {
  const supabase = await createClient();
  if (!supabase) return { error: "La base de datos no está conectada." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?siguiente=/sinastria");

  const chartAId = String(formData.get("chart_a_id") ?? "");
  const chartBId = String(formData.get("chart_b_id") ?? "");
  if (!chartAId || !chartBId) return { error: "Elige las dos cartas." };
  if (chartAId === chartBId) return { error: "Elige dos cartas distintas." };

  const relationshipTypeRaw = String(formData.get("relationship_type") ?? "");
  if (!RELATIONSHIP_TYPES.includes(relationshipTypeRaw as RelationshipType)) return { error: "Elige qué relación tenéis." };
  const relationshipType = relationshipTypeRaw as RelationshipType;

  const status = await getSynastryStatus();
  if (!status || status.plan !== "premium") {
    return { error: "La sinastría es una función Premium." };
  }
  if (status.remaining <= 0) {
    return { error: `Has usado tus ${status.limit} sinastrías de este mes. Se renuevan el día 1.` };
  }

  const [rowA, rowB] = await Promise.all([getMyChart(chartAId), getMyChart(chartBId)]);
  if (!rowA || !rowB) return { error: "No encontramos alguna de esas cartas." };
  if (rowA.time_unknown || rowB.time_unknown) {
    return { error: "Las dos cartas necesitan hora de nacimiento para calcular las casas superpuestas." };
  }

  const { data, error } = await supabase
    .from("synastries")
    .insert({ user_id: user.id, chart_a_id: chartAId, chart_b_id: chartBId, relationship_type: relationshipType, engine_version: ENGINE_VERSION })
    .select("id")
    .single();
  if (error || !data) return { error: "No se ha podido guardar la sinastría. Inténtalo de nuevo." };

  await supabase.rpc("consume_synastry");

  revalidatePath("/sinastria");
  redirect(`/sinastria/${data.id}`);
}

export async function deleteSynastry(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (supabase && id) await supabase.from("synastries").delete().eq("id", id);
  revalidatePath("/sinastria");
  redirect("/sinastria");
}
