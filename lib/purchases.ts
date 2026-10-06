/**
 * Compras de lecturas. Cada recurso astrológico (clima personal, revolución solar, sinastría) se
 * paga por separado: un pago único de Stripe de 5 € da derecho a UNA lectura.
 *
 * Ciclo: pending (se crea al ir a pagar) → paid (Stripe confirma el cobro) → used (la lectura ya
 * está guardada). Todo cambio de estado lo hace el servidor con la clave de servicio; el usuario
 * solo puede ver sus compras (RLS). Los avisos de Stripe y la vuelta del pago convergen en
 * `applyCheckoutSession`, que no se fía de lo recibido: lo vuelve a pedir a Stripe y comprueba el
 * importe, la moneda y el dueño de la compra.
 */
import { getMyChart } from "@/lib/charts";
import { isValidTimeZone } from "@/lib/engine/time";
import { billingReady, stripe } from "@/lib/stripe";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export type Product = "clima" | "revolucion" | "sinastria";
export const PRODUCT_LIST: Product[] = ["clima", "revolucion", "sinastria"];

export const PRODUCTS: Record<Product, { name: string; description: string }> = {
  clima: { name: "Clima astral personalizado", description: "Lectura extensa de tu cielo de los próximos 30 días sobre tu carta natal." },
  revolucion: { name: "Revolución solar", description: "Lectura extensa de la carta de tu próximo año." },
  sinastria: { name: "Sinastría", description: "Lectura extensa de cómo dialogan dos cartas." },
};

export const PRICE_CENTS = 500;
export const PRICE_LABEL = "5 €";

export const CONSENT_TEXT =
  "Acepto que la lectura se prepara y se entrega en el momento de la compra y que, una vez entregada, pierdo el derecho de desistimiento.";

export type PurchaseStatus = "pending" | "paid" | "used" | "refunded";
export type PurchaseParams = Record<string, string | number>;

export type PurchaseRow = {
  id: string;
  user_id: string;
  product: Product;
  status: PurchaseStatus;
  params: PurchaseParams;
  amount_cents: number;
  paid_cents: number | null;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  consent_at: string;
  paid_at: string | null;
  used_at: string | null;
  refunded_at: string | null;
  generating_since: string | null;
  created_at: string;
};

export const PURCHASE_COLUMNS =
  "id, user_id, product, status, params, amount_cents, paid_cents, stripe_session_id, stripe_payment_intent, consent_at, paid_at, used_at, refunded_at, generating_since, created_at";

const UUID = /^[0-9a-f-]{36}$/i;
/** Minutos que dura el candado de generación antes de darse por abandonado. */
const LOCK_MINUTES = 10;

function admin() {
  const client = createServiceClient();
  if (!client) throw new Error("Falta la clave de servicio de Supabase.");
  return client;
}

// ─────────────────────────────────────────────────────────────
// Qué se compra

/** Página a la que se vuelve tras pagar (o cancelar): la del recurso. No viene del usuario. */
export function returnPath(product: Product, params: PurchaseParams): string {
  const chartId = String(params.chart_id ?? "");
  if (product === "sinastria") return "/sinastria";
  if (!UUID.test(chartId)) return "/recursos";
  return product === "clima" ? `/carta/${chartId}/clima` : `/carta/${chartId}/revolucion`;
}

/** Mejor esfuerzo para volver a la página del recurso cuando los datos no son válidos. */
export function fallbackReturnPath(product: Product, formData: FormData): string {
  const chartId = String(formData.get("chart_id") ?? "");
  return UUID.test(chartId) ? returnPath(product, { chart_id: chartId }) : product === "sinastria" ? "/sinastria" : "/recursos";
}

const RELATIONSHIP_TYPES = ["pareja", "familia", "amistad", "trabajo", "otro"];

/** Valida los datos del formulario y devuelve lo que se guarda en la compra, o un mensaje de error. */
export async function parsePurchaseParams(product: Product, formData: FormData): Promise<{ params: PurchaseParams } | { error: string }> {
  if (product === "sinastria") {
    const a = String(formData.get("chart_a_id") ?? "");
    const b = String(formData.get("chart_b_id") ?? "");
    const relationship = String(formData.get("relationship_type") ?? "");
    if (!UUID.test(a) || !UUID.test(b)) return { error: "Elige las dos cartas." };
    if (a === b) return { error: "Elige dos cartas distintas." };
    if (!RELATIONSHIP_TYPES.includes(relationship)) return { error: "Elige qué relación tenéis." };
    const [rowA, rowB] = await Promise.all([getMyChart(a), getMyChart(b)]);
    if (!rowA || !rowB) return { error: "No encontramos alguna de esas cartas." };
    if (rowA.time_unknown || rowB.time_unknown) return { error: "Las dos cartas necesitan hora de nacimiento para calcular las casas superpuestas." };
    return { params: { chart_a_id: a, chart_b_id: b, relationship_type: relationship } };
  }

  const chartId = String(formData.get("chart_id") ?? "");
  if (!UUID.test(chartId)) return { error: "Elige una carta." };
  const chart = await getMyChart(chartId);
  if (!chart) return { error: "No encontramos esa carta." };

  if (product === "clima") return { params: { chart_id: chartId } };

  // Revolución solar: año y lugar donde se pasará el cumpleaños.
  if (chart.time_unknown) return { error: "Esta carta no tiene hora de nacimiento, así que no se pueden calcular casas ni ángulos para la revolución solar." };
  const year = Number(formData.get("year"));
  const placeName = String(formData.get("place_name") ?? "").trim().slice(0, 200);
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const timeZone = String(formData.get("time_zone") ?? "");
  if (!Number.isInteger(year) || year < 1900 || year > 2200) return { error: "Elige un año válido." };
  if (!placeName || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || !isValidTimeZone(timeZone)) {
    return { error: "Elige de la lista el lugar donde estarás ese cumpleaños." };
  }
  return { params: { chart_id: chartId, year, place_name: placeName, latitude, longitude, time_zone: timeZone } };
}

// ─────────────────────────────────────────────────────────────
// Lectura de las compras del usuario

/** La compra pagada y sin usar más antigua que coincide con `match` (p. ej. la carta), o null. */
export async function findUsablePurchase(product: Product, match: PurchaseParams): Promise<PurchaseRow | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("purchases")
    .select(PURCHASE_COLUMNS)
    .eq("product", product)
    .eq("status", "paid")
    .contains("params", match)
    .order("paid_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data as PurchaseRow | null) ?? null;
}

export async function listMyPurchases(limit = 20): Promise<PurchaseRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.from("purchases").select(PURCHASE_COLUMNS).order("created_at", { ascending: false }).limit(limit);
  return (data as PurchaseRow[] | null) ?? [];
}

/** Una compra del usuario en curso por su id (solo si es suya; la RLS lo garantiza). */
export async function getMyPurchase(id: string): Promise<PurchaseRow | null> {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.from("purchases").select(PURCHASE_COLUMNS).eq("id", id).maybeSingle();
  return (data as PurchaseRow | null) ?? null;
}

// ─────────────────────────────────────────────────────────────
// Altas y cambios de estado (solo servidor)

/** Crea la compra. Con `free` (administradores) nace ya pagada y sin cobro. */
export async function createPurchase(userId: string, product: Product, params: PurchaseParams, opts: { free?: boolean } = {}): Promise<PurchaseRow> {
  const now = new Date().toISOString();
  const { data, error } = await admin()
    .from("purchases")
    .insert({
      user_id: userId,
      product,
      params,
      amount_cents: opts.free ? 0 : PRICE_CENTS,
      paid_cents: opts.free ? 0 : null,
      status: opts.free ? "paid" : "pending",
      consent_at: now,
      paid_at: opts.free ? now : null,
    })
    .select(PURCHASE_COLUMNS)
    .single();
  if (error || !data) throw new Error("No se ha podido registrar la compra.");
  return data as PurchaseRow;
}

export async function attachSession(purchaseId: string, sessionId: string) {
  await admin().from("purchases").update({ stripe_session_id: sessionId }).eq("id", purchaseId);
}

/** Borra una compra que no llegó a pasar a Stripe. */
export async function discardPending(purchaseId: string) {
  await admin().from("purchases").delete().eq("id", purchaseId).eq("status", "pending");
}

type CheckoutSession = {
  id: string;
  mode: string;
  payment_status: string;
  client_reference_id: string | null;
  amount_total: number | null;
  currency: string | null;
  payment_intent: string | null;
  metadata: Record<string, string> | null;
};

/**
 * Da por pagada la compra de una sesión de Stripe, si todo cuadra: pago único cobrado (o sin
 * importe por un código promocional del 100 %), mismo usuario, euros y un importe que no supera el
 * precio de lista. Devuelve la compra tal como queda, o null si la sesión no es de una compra.
 */
export async function applyCheckoutSession(s: CheckoutSession): Promise<PurchaseRow | null> {
  const purchaseId = s.metadata?.purchase_id;
  if (s.mode !== "payment" || !purchaseId || !UUID.test(purchaseId)) return null;
  const db = admin();
  const { data } = await db.from("purchases").select(PURCHASE_COLUMNS).eq("id", purchaseId).maybeSingle();
  const purchase = data as PurchaseRow | null;
  if (!purchase || purchase.stripe_session_id !== s.id || purchase.user_id !== s.client_reference_id) return null;
  if (purchase.status !== "pending") return purchase;

  const paidOk = s.payment_status === "paid" || s.payment_status === "no_payment_required";
  const amount = s.amount_total ?? -1;
  if (!paidOk || s.currency !== "eur" || amount < 0 || amount > purchase.amount_cents) return purchase;

  const { data: updated } = await db
    .from("purchases")
    .update({ status: "paid", paid_at: new Date().toISOString(), paid_cents: amount, stripe_payment_intent: s.payment_intent })
    .eq("id", purchase.id)
    .eq("status", "pending")
    .select(PURCHASE_COLUMNS)
    .maybeSingle();
  return (updated as PurchaseRow | null) ?? purchase;
}

/** Vuelta del pago: confirma la sesión con Stripe sin esperar al aviso (webhook). */
export async function confirmCheckout(sessionId: string, userId: string): Promise<PurchaseRow | null> {
  if (!billingReady() || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return null;
  try {
    const s = await stripe<CheckoutSession>("GET", `/checkout/sessions/${sessionId}`);
    if (s.client_reference_id !== userId) return null;
    return await applyCheckoutSession(s);
  } catch {
    return null;
  }
}

/**
 * Compras que se pagaron pero cuyo cobro aún no hemos visto (el usuario cerró la pestaña antes de
 * volver y el aviso no ha llegado): se confirman con Stripe. Se llama al abrir la página de un recurso.
 */
export async function reconcilePending(userId: string) {
  if (!billingReady()) return;
  const supabase = await createClient();
  if (!supabase) return;
  const since = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
  const { data } = await supabase.from("purchases").select("stripe_session_id").eq("status", "pending").not("stripe_session_id", "is", null).gte("created_at", since).limit(5);
  for (const row of (data as { stripe_session_id: string }[] | null) ?? []) await confirmCheckout(row.stripe_session_id, userId);
}

/** Reembolso total de un cobro: la compra deja de poder usarse (si ya se usó, solo se anota). */
export async function applyRefund(paymentIntent: string) {
  const db = admin();
  const now = new Date().toISOString();
  await db.from("purchases").update({ status: "refunded", refunded_at: now, generating_since: null }).eq("stripe_payment_intent", paymentIntent).in("status", ["pending", "paid"]);
  await db.from("purchases").update({ refunded_at: now }).eq("stripe_payment_intent", paymentIntent).eq("status", "used").is("refunded_at", null);
}

// ─────────────────────────────────────────────────────────────
// Uso de la compra al generar la lectura

/** Toma el candado de una compra pagada. Devuelve null si no es suya, no está pagada o ya se está generando. */
export async function claimPurchase(id: string, userId: string): Promise<PurchaseRow | null> {
  const stale = new Date(Date.now() - LOCK_MINUTES * 60_000).toISOString();
  const { data } = await admin()
    .from("purchases")
    .update({ generating_since: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .eq("status", "paid")
    .or(`generating_since.is.null,generating_since.lt.${stale}`)
    .select(PURCHASE_COLUMNS)
    .maybeSingle();
  return (data as PurchaseRow | null) ?? null;
}

/** Suelta el candado sin gastar la compra (la generación falló: se puede reintentar sin pagar otra vez). */
export async function releasePurchase(id: string) {
  await admin().from("purchases").update({ generating_since: null }).eq("id", id).eq("status", "paid");
}

/** La lectura ya está guardada: la compra queda usada. */
export async function finishPurchase(id: string) {
  await admin().from("purchases").update({ status: "used", used_at: new Date().toISOString(), generating_since: null }).eq("id", id).eq("status", "paid");
}
