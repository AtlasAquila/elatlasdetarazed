"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { billingReady, ensureCustomer, priceId, stripe, type Interval } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

async function siteUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL ?? "https://elatlasdetarazed.com");
}

async function currentUser() {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("plan, subscription_status").eq("id", user.id).maybeSingle();
  return { id: user.id, email: user.email ?? "", plan: profile?.plan as string | undefined };
}

/** Lleva al usuario a la página de pago de Stripe. */
export async function startCheckout(formData: FormData) {
  const interval: Interval = formData.get("interval") === "year" ? "year" : "month";
  const user = await currentUser();
  if (!user) redirect("/registro?siguiente=/planes");
  if (!billingReady()) redirect("/planes?error=pagos");
  // Ya es Premium: se gestiona desde el portal (cambiar de mensual a anual, cancelar…).
  if (user.plan === "premium") return openPortal();

  let url: string | null = null;
  try {
    const origin = await siteUrl();
    const customer = await ensureCustomer(user.id, user.email);
    const session = await stripe<{ url: string }>("POST", "/checkout/sessions", {
      mode: "subscription",
      customer,
      client_reference_id: user.id,
      line_items: [{ price: await priceId(interval), quantity: 1 }],
      locale: "es",
      allow_promotion_codes: true,
      subscription_data: { metadata: { supabase_user_id: user.id } },
      success_url: `${origin}/cuenta?pago=ok&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/planes?pago=cancelado`,
    });
    url = session.url;
  } catch {
    url = null;
  }
  redirect(url ?? "/planes?error=pagos");
}

/** Portal de cliente de Stripe: cambiar tarjeta, ver facturas, cambiar de plan o cancelar. */
export async function openPortal() {
  const user = await currentUser();
  if (!user) redirect("/entrar?siguiente=/cuenta");
  if (!billingReady()) redirect("/cuenta?error=pagos");

  let url: string | null = null;
  try {
    const origin = await siteUrl();
    const customer = await ensureCustomer(user.id, user.email);
    const session = await stripe<{ url: string }>("POST", "/billing_portal/sessions", { customer, return_url: `${origin}/cuenta`, locale: "es" });
    url = session.url;
  } catch {
    url = null;
  }
  redirect(url ?? "/cuenta?error=pagos");
}
