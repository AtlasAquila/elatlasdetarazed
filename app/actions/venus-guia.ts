"use server";

import { computeChart } from "@/lib/engine";
import { isValidTimeZone } from "@/lib/engine/time";
import { createClient } from "@/lib/supabase/server";
import { buildGuide, guideEmail, type GuideContent } from "@/lib/venus-guia";

export type VenusGuideState = {
  error?: string;
  guide?: GuideContent;
  /** "enviado": el correo salió ahora. "anterior": ese correo ya había pedido la guía. "no": no se pudo enviar. */
  email?: "enviado" | "anterior" | "no";
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sendEmail(to: string, guide: GuideContent) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!key || !from) {
    console.error("venus-guia: faltan RESEND_API_KEY o RESEND_FROM en este entorno");
    return false;
  }
  const { subject, html } = guideEmail(guide);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    // Se registra el motivo (sin la clave ni el destinatario) para poder diagnosticarlo en los logs de Vercel.
    if (!res.ok) console.error(`venus-guia: Resend respondió ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return res.ok;
  } catch (e) {
    console.error("venus-guia: no se pudo contactar con Resend", e instanceof Error ? e.message : e);
    return false;
  }
}

export async function requestVenusGuide(_prev: VenusGuideState, formData: FormData): Promise<VenusGuideState> {
  // Campo trampa: las personas no lo ven; si llega relleno, se ignora sin avisar.
  if (String(formData.get("web") ?? "") !== "") return { error: "No hemos podido procesar el formulario." };

  const nombre = String(formData.get("nombre") ?? "").trim().slice(0, 80);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const placeName = String(formData.get("place_name") ?? "").trim().slice(0, 200);
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const timeZone = String(formData.get("time_zone") ?? "");

  if (!nombre) return { error: "Escribe tu nombre." };
  if (!EMAIL.test(email) || email.length > 254) return { error: "Escribe un correo electrónico válido." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Escribe tu fecha de nacimiento." };
  const year = Number(date.slice(0, 4));
  if (year < 1800 || year > 2200) return { error: "La fecha debe estar entre 1800 y 2200." };
  if (!/^\d{2}:\d{2}$/.test(time)) return { error: "Escribe tu hora de nacimiento: sin ella no se puede calcular el ascendente." };
  if (!placeName || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || !isValidTimeZone(timeZone)) {
    return { error: "Elige tu lugar de nacimiento de la lista." };
  }
  if (formData.get("consent") !== "on") return { error: "Necesitamos tu permiso para guardar tus datos y enviarte la guía." };

  const chart = computeChart({
    year,
    month: Number(date.slice(5, 7)),
    day: Number(date.slice(8, 10)),
    hour: Number(time.slice(0, 2)),
    minute: Number(time.slice(3, 5)),
    timeZone,
    latitude,
    longitude,
    houseSystem: "placidus",
  });
  if (!chart.angles || !chart.houses) return { error: "No se ha podido calcular el ascendente con esos datos. Revisa la hora y el lugar." };

  const guide = buildGuide(chart, nombre);

  const supabase = await createClient();
  if (!supabase) return { error: "El formulario aún no está conectado. Inténtalo más tarde." };
  const { error } = await supabase.from("venus_guia").insert({
    nombre,
    email,
    birth_date: date,
    birth_time: time,
    place_name: placeName,
    latitude,
    longitude,
    time_zone: timeZone,
    ascendente: guide.ascendente,
    casa_luna_nueva: guide.casa,
    consent: true,
  });
  // 23505: ese correo ya pidió la guía. Se la mostramos, pero no se le vuelve a escribir (evita usar el formulario para saturar un buzón).
  if (error && error.code !== "23505") return { error: "No hemos podido guardar tus datos. Inténtalo de nuevo." };
  if (error) return { guide, email: "anterior" };

  return { guide, email: (await sendEmail(email, guide)) ? "enviado" : "no" };
}
