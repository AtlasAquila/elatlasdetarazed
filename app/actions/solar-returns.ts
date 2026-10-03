"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isValidTimeZone } from "@/lib/engine/time";
import { ENGINE_VERSION, computeSolarReturn } from "@/lib/engine";
import { getMyChart } from "@/lib/charts";
import { getSolarReturnStatus, natalSunLongitude } from "@/lib/solar-returns";
import { createClient } from "@/lib/supabase/server";

export type SolarReturnFormState = { error?: string };

const SYSTEMS = new Set(["placidus", "koch", "equal", "whole"]);

export async function createSolarReturn(_prev: SolarReturnFormState, formData: FormData): Promise<SolarReturnFormState> {
  const supabase = await createClient();
  if (!supabase) return { error: "La base de datos no está conectada." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const chartId = String(formData.get("chart_id") ?? "");
  if (!user) redirect(`/entrar?siguiente=/carta/${chartId}/revolucion`);

  const natalRow = await getMyChart(chartId);
  if (!natalRow) return { error: "No encontramos esa carta natal." };
  if (natalRow.time_unknown) return { error: "Esta carta no tiene hora de nacimiento, así que no se pueden calcular casas ni ángulos para la revolución solar." };

  const status = await getSolarReturnStatus();
  if (!status || status.plan !== "premium") {
    return { error: "La revolución solar es una función Premium." };
  }
  if (status.remaining <= 0) {
    return { error: `Has usado tus ${status.limit} revoluciones solares de este mes. Se renuevan el día 1.` };
  }

  const year = Number(formData.get("year"));
  const placeName = String(formData.get("place_name") ?? "").trim().slice(0, 200);
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const timeZone = String(formData.get("time_zone") ?? "");
  const houseSystem = String(formData.get("house_system") ?? natalRow.house_system);

  if (!Number.isInteger(year) || year < 1900 || year > 2200) return { error: "Elige un año válido." };
  if (!placeName || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return { error: "Elige de la lista el lugar donde estarás ese cumpleaños." };
  }
  if (!isValidTimeZone(timeZone)) return { error: "Elige de la lista el lugar donde estarás ese cumpleaños." };
  if (!SYSTEMS.has(houseSystem)) return { error: "Sistema de casas no válido." };

  const sunLon = natalSunLongitude(natalRow);
  let returnUtc: string;
  try {
    const chart = computeSolarReturn({
      natalSunLongitude: sunLon,
      year,
      birthMonth: Number(natalRow.birth_date.slice(5, 7)),
      birthDay: Number(natalRow.birth_date.slice(8, 10)),
      latitude,
      longitude,
      houseSystem: houseSystem as "placidus" | "koch" | "equal" | "whole",
    });
    returnUtc = chart.utc;
  } catch {
    return { error: "No se ha podido calcular la revolución solar. Inténtalo de nuevo." };
  }

  const { data, error } = await supabase
    .from("solar_returns")
    .insert({
      chart_id: chartId,
      user_id: user.id,
      year,
      place_name: placeName,
      latitude,
      longitude,
      time_zone: timeZone,
      house_system: houseSystem,
      engine_version: ENGINE_VERSION,
      return_utc: returnUtc,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "No se ha podido guardar la revolución solar. Inténtalo de nuevo." };

  await supabase.rpc("consume_solar_return");

  revalidatePath(`/carta/${chartId}/revolucion`);
  redirect(`/carta/${chartId}/revolucion/${data.id}`);
}

export async function deleteSolarReturn(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const chartId = String(formData.get("chart_id") ?? "");
  if (supabase && id) await supabase.from("solar_returns").delete().eq("id", id);
  revalidatePath(`/carta/${chartId}/revolucion`);
  redirect(`/carta/${chartId}/revolucion`);
}
