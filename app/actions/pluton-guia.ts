"use server";

import { aiConfigured } from "@/lib/ai/anthropic";
import { computeChart } from "@/lib/engine";
import { isValidTimeZone } from "@/lib/engine/time";
import { guiaEmail } from "@/lib/guia-email";
import { calcularBase, componerGuia, type PlutonGuide } from "@/lib/pluton-guia";
import { redactarConIA } from "@/lib/pluton-guia-ia";
import { createClient } from "@/lib/supabase/server";

export type PlutonGuideState = {
  error?: string;
  guide?: PlutonGuide;
  /** Solo si se pidió por correo. "enviado": el correo salió ahora. "anterior": ese correo ya había pedido la guía. "no": no se pudo enviar. */
  email?: "enviado" | "anterior" | "no";
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sendEmail(to: string, guide: PlutonGuide) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!key || !from) {
    console.error("pluton-guia: faltan RESEND_API_KEY o RESEND_FROM en este entorno");
    return false;
  }
  const { subject, html } = guiaEmail(guide, {
    asunto: "Tu guía de Plutón directo en Acuario",
    titulo: "Tu guía de Plutón directo en Acuario",
    introduccion: "Esta guía lee la estación directa de Plutón del 16 de octubre y la marea de los meses siguientes sobre tu carta. Está hecha con tu fecha, tu hora y tu lugar de nacimiento. Tómate unos minutos: se lee en diez.",
  });
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    // Se registra el motivo (sin la clave ni el destinatario) para poder diagnosticarlo en los logs de Vercel.
    if (!res.ok) console.error(`pluton-guia: Resend respondió ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return res.ok;
  } catch (e) {
    console.error("pluton-guia: no se pudo contactar con Resend", e instanceof Error ? e.message : e);
    return false;
  }
}

export async function requestPlutonGuide(_prev: PlutonGuideState, formData: FormData): Promise<PlutonGuideState> {
  // Campo trampa: las personas no lo ven; si llega relleno, se ignora sin avisar.
  if (String(formData.get("web") ?? "") !== "") return { error: "No hemos podido procesar el formulario." };

  // Nombre y correo son opcionales; el correo solo cuenta si se marca la casilla de recibir la guía por correo.
  const nombre = String(formData.get("nombre") ?? "").trim().slice(0, 80);
  const quiereCorreo = formData.get("enviar_correo") === "on";
  const email = quiereCorreo ? String(formData.get("email") ?? "").trim().toLowerCase() : "";
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const placeName = String(formData.get("place_name") ?? "").trim().slice(0, 200);
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const timeZone = String(formData.get("time_zone") ?? "");

  if (quiereCorreo && (!EMAIL.test(email) || email.length > 254)) return { error: "Escribe un correo electrónico válido o desmarca la casilla del correo." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Escribe tu fecha de nacimiento." };
  const year = Number(date.slice(0, 4));
  if (year < 1800 || year > 2200) return { error: "La fecha debe estar entre 1800 y 2200." };
  if (!/^\d{2}:\d{2}$/.test(time)) return { error: "Escribe tu hora de nacimiento: sin ella no se pueden calcular las casas." };
  if (!placeName || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || !isValidTimeZone(timeZone)) {
    return { error: "Elige tu lugar de nacimiento de la lista." };
  }

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

  // Todo lo que es dato se calcula con el motor; la IA solo redacta tres secciones con esos datos. Si la IA falla o
  // un texto no pasa la validación, esa sección sale con el texto determinista y la guía se entrega igual.
  const base = calcularBase(chart, nombre);
  let guide: PlutonGuide;
  if (aiConfigured()) {
    const { redaccion, errores } = await redactarConIA(base);
    if (errores.length) console.error(`pluton-guia: ${errores.join(" | ")}`);
    guide = componerGuia(base, redaccion);
  } else {
    console.error("pluton-guia: falta ANTHROPIC_API_KEY en este entorno; la guía sale solo con el texto determinista");
    guide = componerGuia(base);
  }

  const supabase = await createClient();
  if (!supabase) return { error: "El formulario aún no está conectado. Inténtalo más tarde." };
  const { error } = await supabase.from("pluton_guia").insert({
    nombre: nombre || null,
    email: email || null,
    birth_date: date,
    birth_time: time,
    place_name: placeName,
    latitude,
    longitude,
    time_zone: timeZone,
    ascendente: guide.ascendente,
    casa_estacion: guide.casa,
    secciones_ia: guide.seccionesIA,
    consent: quiereCorreo,
  });
  // 23505: ese correo ya pidió la guía. Se la mostramos, pero no se le vuelve a escribir (evita usar el formulario para saturar un buzón).
  if (error && error.code !== "23505") return { error: "No hemos podido guardar tus datos. Inténtalo de nuevo." };
  if (error) return { guide, email: "anterior" };

  if (!quiereCorreo) return { guide };
  return { guide, email: (await sendEmail(email, guide)) ? "enviado" : "no" };
}
