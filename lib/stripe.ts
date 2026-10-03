/**
 * Cliente mínimo de la API de Stripe (fetch + formularios), sin dependencias.
 * Solo se usa en el servidor: necesita STRIPE_SECRET_KEY.
 */
import { createServiceClient } from "@/lib/supabase/server";

const API = "https://api.stripe.com/v1";
const API_VERSION = "2026-08-26.dahlia";

/** Claves de búsqueda de los precios creados en Stripe (iguales en modo prueba y real). */
export const PRICE_KEYS = { month: "premium_mensual", year: "premium_anual" } as const;
export type Interval = keyof typeof PRICE_KEYS;

/** Estados de suscripción que dan acceso Premium. past_due: Stripe está reintentando el cobro. */
const PREMIUM_STATUSES = new Set(["active", "trialing", "past_due"]);

export const stripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);
export const billingReady = () => stripeConfigured() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

export class StripeError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

type Params = Record<string, unknown>;

/** Codifica objetos anidados al formato de formulario de Stripe: a[b][0][c]=valor. */
function encode(params: Params, prefix = "", out = new URLSearchParams()) {
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const name = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((v, i) => {
        if (v !== null && typeof v === "object") encode(v as Params, `${name}[${i}]`, out);
        else out.append(`${name}[${i}]`, String(v));
      });
    } else if (typeof value === "object") {
      encode(value as Params, name, out);
    } else {
      out.append(name, String(value));
    }
  }
  return out;
}

export async function stripe<T = Record<string, any>>(method: "GET" | "POST" | "DELETE", path: string, params: Params = {}, idempotencyKey?: string): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new StripeError("Stripe no está configurado.", 503);
  const body = encode(params);
  const url = method === "GET" && body.toString() ? `${API}${path}?${body}` : `${API}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${key}`,
      "stripe-version": API_VERSION,
      ...(method !== "GET" ? { "content-type": "application/x-www-form-urlencoded" } : {}),
      ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}),
    },
    body: method !== "GET" ? body : undefined,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { error?: { message?: string; code?: string } };
  if (!res.ok) throw new StripeError(data.error?.message ?? `Stripe respondió ${res.status}`, res.status, data.error?.code);
  return data as T;
}

export async function priceId(interval: Interval): Promise<string> {
  const list = await stripe<{ data: { id: string }[] }>("GET", "/prices", { lookup_keys: [PRICE_KEYS[interval]], active: true, limit: 1 });
  const id = list.data[0]?.id;
  if (!id) throw new StripeError(`No existe el precio ${PRICE_KEYS[interval]} en Stripe.`, 500);
  return id;
}

/** Cliente de Stripe del usuario; lo crea la primera vez y lo guarda en su perfil. */
export async function ensureCustomer(userId: string, email: string): Promise<string> {
  const admin = createServiceClient();
  if (!admin) throw new StripeError("Falta la clave de servicio de Supabase.", 503);
  const { data: profile } = await admin.from("profiles").select("stripe_customer_id, display_name").eq("id", userId).maybeSingle();
  if (profile?.stripe_customer_id) return profile.stripe_customer_id as string;
  const customer = await stripe<{ id: string }>(
    "POST",
    "/customers",
    { email, name: profile?.display_name || undefined, preferred_locales: ["es"], metadata: { supabase_user_id: userId } },
    `customer-${userId}`,
  );
  await admin.from("profiles").update({ stripe_customer_id: customer.id }).eq("id", userId);
  return customer.id;
}

type Subscription = {
  id: string;
  status: string;
  created: number;
  cancel_at_period_end: boolean;
  cancel_at: number | null;
  current_period_end?: number;
  items: { data: { current_period_end?: number; price: { recurring: { interval: string } | null } }[] };
};

/**
 * Lee de Stripe el estado real de las suscripciones de un cliente y lo copia al perfil.
 * Es la única vía por la que cambia el plan; se llama desde el webhook y al volver del pago.
 */
export async function syncCustomer(customerId: string): Promise<{ plan: "premium" | "gratuito" } | null> {
  const admin = createServiceClient();
  if (!admin) throw new StripeError("Falta la clave de servicio de Supabase.", 503);

  const subs = await stripe<{ data: Subscription[] }>("GET", "/subscriptions", { customer: customerId, status: "all", limit: 10 });
  // La suscripción que manda: primero las que dan acceso, y entre ellas la más reciente.
  const sorted = [...subs.data].sort((a, b) => Number(PREMIUM_STATUSES.has(b.status)) - Number(PREMIUM_STATUSES.has(a.status)) || b.created - a.created);
  const sub = sorted[0];
  const premium = Boolean(sub && PREMIUM_STATUSES.has(sub.status));
  const item = sub?.items.data[0];
  const periodEnd = item?.current_period_end ?? sub?.current_period_end ?? null;
  const interval = item?.price.recurring?.interval;

  const update = {
    plan: premium ? "premium" : "gratuito",
    stripe_subscription_id: sub?.id ?? null,
    subscription_status: sub?.status ?? null,
    subscription_interval: interval === "month" || interval === "year" ? interval : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: Boolean(sub?.cancel_at_period_end || sub?.cancel_at),
  };

  const { data: rows } = await admin.from("profiles").update(update).eq("stripe_customer_id", customerId).select("id");
  if (!rows?.length) {
    // Perfil aún sin el id de cliente guardado: lo buscamos por los metadatos del cliente.
    const customer = await stripe<{ deleted?: boolean; metadata?: { supabase_user_id?: string } }>("GET", `/customers/${customerId}`);
    const userId = customer.metadata?.supabase_user_id;
    if (!userId) return null;
    await admin
      .from("profiles")
      .update({ ...update, stripe_customer_id: customerId })
      .eq("id", userId);
  }
  return { plan: premium ? "premium" : "gratuito" };
}
