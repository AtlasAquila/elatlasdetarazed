"use server";

import { after } from "next/server";
import { pushConfigProblem, sendPush } from "@/lib/push";
import { createClient, createServiceClient, getSession } from "@/lib/supabase/server";

const TOKEN = /^[A-Za-z0-9:_.\-]{20,4096}$/;

export type AvisosResult = { ok: boolean; error?: string };

/** Guarda (o reasigna a esta cuenta) el dispositivo de la app. */
export async function registerDevice(token: string): Promise<AvisosResult> {
  const session = await getSession();
  const sb = createServiceClient();
  if (!session || !sb || !TOKEN.test(token)) return { ok: false, error: "No se ha podido activar el aviso." };
  const { error } = await sb.from("push_devices").upsert({ user_id: session.userId, token, platform: "android", updated_at: new Date().toISOString() }, { onConflict: "token" });
  return error ? { ok: false, error: "No se ha podido activar el aviso." } : { ok: true };
}

/** Borra el dispositivo. Basta con conocer su token: lo usa la app al cerrar sesión o al desactivar los avisos. */
export async function unregisterDevice(token: string): Promise<AvisosResult> {
  const sb = createServiceClient();
  if (!sb || !TOKEN.test(token)) return { ok: false };
  const { error } = await sb.from("push_devices").delete().eq("token", token);
  return { ok: !error };
}

export type AvisosPrefs = { weekly: boolean; alerts: boolean; chartId: string | null };

/** Preferencias de avisos de la persona (valen para todos sus dispositivos). */
export async function updateAvisos(prefs: AvisosPrefs): Promise<AvisosResult> {
  const session = await getSession();
  const sb = createServiceClient();
  const supabase = await createClient();
  if (!session || !sb || !supabase) return { ok: false, error: "No se han podido guardar los cambios." };

  let chartId: string | null = null;
  if (prefs.chartId) {
    // La carta debe ser de esta persona (la política de seguridad de la tabla solo deja ver las suyas).
    const { data } = await supabase.from("charts").select("id").eq("id", prefs.chartId).maybeSingle();
    if (!data) return { ok: false, error: "Esa carta no existe." };
    chartId = data.id;
  }
  const { error } = await sb
    .from("push_devices")
    .update({ weekly_climate: Boolean(prefs.weekly), chart_alerts: Boolean(prefs.alerts), chart_id: chartId, updated_at: new Date().toISOString() })
    .eq("user_id", session.userId);
  return error ? { ok: false, error: "No se han podido guardar los cambios." } : { ok: true };
}

const TEST_DELAY_MS = 10_000;

/** Envía un aviso de prueba a los dispositivos de la persona, a los 10 segundos para que dé tiempo a salir de la app. */
export async function sendTestPush(): Promise<AvisosResult> {
  const session = await getSession();
  const sb = createServiceClient();
  if (!session || !sb) return { ok: false, error: "No se ha podido enviar." };
  const problem = pushConfigProblem();
  if (problem) return { ok: false, error: session.isAdmin ? `Los avisos no están configurados: ${problem}.` : "Los avisos aún no están disponibles." };
  const { data } = await sb.from("push_devices").select("token").eq("user_id", session.userId);
  if (!data?.length) return { ok: false, error: "Este dispositivo aún no está registrado." };

  after(async () => {
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS));
    await Promise.all(data.map((d) => sendPush(d.token, { title: "Códice Orbital", body: "Los avisos funcionan. El cielo te escribirá por aquí.", url: "/clima-astral" })));
  });
  return { ok: true };
}
