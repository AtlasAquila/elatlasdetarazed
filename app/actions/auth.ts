"use server";

import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { siteUrl } from "@/lib/supabase/config";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Solo permitimos volver a rutas internas de la web. */
function safeNext(value: FormDataEntryValue | null, fallback = "/cuenta") {
  const next = String(value ?? "");
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

function translate(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "El correo o la contraseña no son correctos.";
  if (m.includes("email not confirmed")) return "Aún no has confirmado tu correo. Revisa tu bandeja de entrada.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Ya existe una cuenta con ese correo. Prueba a entrar.";
  if (m.includes("password") && m.includes("characters")) return "La contraseña debe tener al menos 8 caracteres.";
  if (m.includes("rate limit") || m.includes("too many")) return "Demasiados intentos. Espera unos minutos y vuelve a probar.";
  return "Algo ha fallado. Inténtalo de nuevo en unos minutos.";
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!EMAIL.test(email) || !password) return { error: "Escribe tu correo y tu contraseña." };

  const supabase = await createClient();
  if (!supabase) return { error: "El registro de usuarios aún no está conectado." };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: translate(error.message) };
  redirect(safeNext(formData.get("siguiente")));
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!EMAIL.test(email)) return { error: "Escribe un correo electrónico válido." };
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  if (formData.get("terms") !== "on") return { error: "Para crear la cuenta debes aceptar la política de privacidad." };

  const supabase = await createClient();
  if (!supabase) return { error: "El registro de usuarios aún no está conectado." };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name },
      emailRedirectTo: `${siteUrl}/auth/confirm?next=/cuenta`,
    },
  });
  if (error) return { error: translate(error.message) };
  if (data.session) redirect("/cuenta");
  return { message: "Te hemos enviado un correo. Pulsa el enlace para confirmar tu cuenta y entrar." };
}

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL.test(email)) return { error: "Escribe un correo electrónico válido." };
  const supabase = await createClient();
  if (!supabase) return { error: "El registro de usuarios aún no está conectado." };
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl}/auth/confirm?next=/nueva-contrasena` });
  // Misma respuesta exista o no la cuenta, para no revelar qué correos están registrados.
  return { message: "Si hay una cuenta con ese correo, te llegará un enlace para crear una contraseña nueva." };
}

export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  const repeat = String(formData.get("repeat") ?? "");
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  if (password !== repeat) return { error: "Las dos contraseñas no coinciden." };
  const supabase = await createClient();
  if (!supabase) return { error: "El registro de usuarios aún no está conectado." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: translate(error.message) };
  return { message: "Contraseña actualizada." };
}

export async function updateProfile(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const supabase = await createClient();
  if (!supabase) return { error: "El registro de usuarios aún no está conectado." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión ha caducado. Vuelve a entrar." };
  const { error } = await supabase.from("profiles").update({ display_name: name || null }).eq("id", user.id);
  if (error) return { error: "No hemos podido guardar el cambio." };
  return { message: "Datos guardados." };
}

/**
 * Confirma el enlace del correo (alta de cuenta o recuperación de contraseña).
 * Se ejecuta solo cuando la persona pulsa el botón de la página de confirmación
 * (una petición POST), nunca con la simple visita al enlace (GET): así los
 * escáneres de seguridad de Gmail/Outlook, que abren el enlace por su cuenta
 * para comprobarlo, no consumen el código antes de que lo use el usuario real.
 */
export async function confirmEmailLink(formData: FormData) {
  const tokenHash = String(formData.get("token_hash") ?? "");
  const type = String(formData.get("type") ?? "") as EmailOtpType;
  const code = String(formData.get("code") ?? "");
  const next = safeNext(formData.get("next"));

  const supabase = await createClient();
  if (supabase) {
    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
      if (!error) redirect(next);
    } else if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) redirect(next);
    }
  }
  redirect("/entrar?error=enlace");
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}

export async function deleteAccount(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (String(formData.get("confirm") ?? "").trim().toUpperCase() !== "BORRAR") {
    return { error: "Escribe BORRAR para confirmar." };
  }
  const supabase = await createClient();
  const admin = createServiceClient();
  if (!supabase || !admin) return { error: "El borrado automático aún no está configurado. Escríbenos y lo haremos a mano." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión ha caducado. Vuelve a entrar." };
  // Si tenía una suscripción, se cancela en Stripe antes de borrar la cuenta.
  const { data: profile } = await admin.from("profiles").select("stripe_subscription_id, subscription_status").eq("id", user.id).maybeSingle();
  if (profile?.stripe_subscription_id && stripeConfigured() && !["canceled", "incomplete_expired"].includes(profile.subscription_status ?? "")) {
    try {
      await stripe("DELETE", `/subscriptions/${profile.stripe_subscription_id}`);
    } catch {
      return { error: "No hemos podido cancelar tu suscripción. Inténtalo de nuevo o escríbenos." };
    }
  }
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: "No hemos podido borrar la cuenta. Inténtalo de nuevo." };
  await supabase.auth.signOut();
  redirect("/?cuenta=borrada");
}
