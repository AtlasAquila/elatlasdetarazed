"use server";

import { redirect } from "next/navigation";
import {
  CONSENT_TEXT,
  PRICE_CENTS,
  PRODUCTS,
  PRODUCT_LIST,
  attachSession,
  createPurchase,
  discardPending,
  fallbackReturnPath,
  findUsablePurchase,
  parsePurchaseParams,
  returnPath,
  type Product,
  type PurchaseParams,
} from "@/lib/purchases";
import { siteUrl } from "@/lib/site-url";
import { billingReady, ensureCustomer, stripe } from "@/lib/stripe";
import { getSession } from "@/lib/supabase/server";

/** Qué compra ya pagada y sin usar sirve para estos datos (si existe, no se vuelve a cobrar). */
function usableMatch(product: Product, params: PurchaseParams): PurchaseParams {
  if (product === "sinastria") return { chart_a_id: params.chart_a_id, chart_b_id: params.chart_b_id };
  return { chart_id: params.chart_id };
}

/**
 * Lleva al usuario a pagar una lectura (5 €, pago único de Stripe). Si ya tiene una pagada sin
 * usar para esos datos, vuelve a la página del recurso sin cobrar otra vez. Los administradores
 * la reciben ya pagada, para poder probar. Los errores vuelven a la página del recurso con
 * `?error=<código>`: consentimiento, datos o pagos.
 */
export async function startPurchase(formData: FormData) {
  const product = String(formData.get("product") ?? "") as Product;
  if (!PRODUCT_LIST.includes(product)) redirect("/recursos");

  const back = fallbackReturnPath(product, formData);
  const session = await getSession();
  if (!session) redirect(`/entrar?siguiente=${back}`);

  const parsed = await parsePurchaseParams(product, formData);
  if ("error" in parsed) redirect(`${back}?error=datos&mensaje=${encodeURIComponent(parsed.error)}`);
  const { params } = parsed;
  const path = returnPath(product, params);

  if (formData.get("consent") !== "on") redirect(`${path}?error=consentimiento`);

  // Ya pagada y sin usar: se va a la página del recurso a generarla.
  if (await findUsablePurchase(product, usableMatch(product, params))) redirect(`${path}?pago=ok`);

  // Los administradores no pagan.
  if (session.isAdmin) {
    await createPurchase(session.userId, product, params, { free: true });
    redirect(`${path}?pago=ok`);
  }

  if (!billingReady()) redirect(`${path}?error=pagos`);

  let url: string | null = null;
  let purchaseId: string | null = null;
  try {
    const purchase = await createPurchase(session.userId, product, params);
    purchaseId = purchase.id;
    const origin = await siteUrl();
    const customer = await ensureCustomer(session.userId, session.email);
    const metadata = { purchase_id: purchase.id, product };
    const checkout = await stripe<{ id: string; url: string }>(
      "POST",
      "/checkout/sessions",
      {
        mode: "payment",
        customer,
        client_reference_id: session.userId,
        line_items: [
          {
            quantity: 1,
            price_data: { currency: "eur", unit_amount: PRICE_CENTS, product_data: { name: PRODUCTS[product].name, description: PRODUCTS[product].description } },
          },
        ],
        metadata,
        payment_intent_data: { metadata, description: PRODUCTS[product].name },
        custom_text: { submit: { message: CONSENT_TEXT } },
        locale: "es",
        allow_promotion_codes: true,
        success_url: `${origin}${path}?pago=ok&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}${path}?pago=cancelado`,
      },
      `purchase-${purchase.id}`,
    );
    await attachSession(purchase.id, checkout.id);
    url = checkout.url;
  } catch {
    if (purchaseId) await discardPending(purchaseId).catch(() => {});
    url = null;
  }
  redirect(url ?? `${path}?error=pagos`);
}
