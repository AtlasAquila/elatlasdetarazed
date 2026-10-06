import { NextResponse, type NextRequest } from "next/server";
import { applyCheckoutSession, applyRefund } from "@/lib/purchases";
import { StripeError, billingReady, stripe, syncCustomer } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Avisos de Stripe (pagos, renovaciones, cancelaciones, compras de lecturas).
 *
 * No nos fiamos del contenido recibido: solo tomamos el id del evento y lo volvemos a pedir
 * a Stripe con nuestra clave secreta. Si el evento no existe en nuestra cuenta, se descarta.
 * Después se sincroniza el estado real del cliente, así que el orden de llegada no importa.
 *
 * Compras de lecturas (pago único): checkout.session.completed y checkout.session.async_payment_succeeded
 * dan la compra por pagada; charge.refunded (reembolso total) la anula. Hay que tener activados estos
 * eventos en el endpoint del webhook de Stripe; si faltan, la compra se confirma igualmente cuando
 * el usuario vuelve del pago o abre la página del recurso.
 */
export async function POST(request: NextRequest) {
  if (!billingReady()) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const payload = (await request.json().catch(() => null)) as { id?: string } | null;
  const eventId = payload?.id;
  if (!eventId || !/^evt_[A-Za-z0-9]+$/.test(eventId)) return NextResponse.json({ error: "bad request" }, { status: 400 });

  let event: { id: string; type: string; data: { object: Record<string, any> } };
  try {
    event = await stripe("GET", `/events/${eventId}`);
  } catch (e) {
    const status = e instanceof StripeError && e.status === 404 ? 400 : 500;
    return NextResponse.json({ error: "unknown event" }, { status });
  }

  const admin = createServiceClient()!;
  const { data: seen } = await admin.from("stripe_events").select("id").eq("id", event.id).maybeSingle();
  if (seen) return NextResponse.json({ received: true, duplicate: true });

  const obj = event.data.object;

  // Compras de lecturas.
  try {
    if ((event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") && obj.object === "checkout.session") {
      await applyCheckoutSession(obj as Parameters<typeof applyCheckoutSession>[0]);
    } else if (event.type === "charge.refunded" && obj.refunded === true && typeof obj.payment_intent === "string") {
      await applyRefund(obj.payment_intent);
    }
  } catch {
    // Stripe reintentará el aviso más tarde.
    return NextResponse.json({ error: "purchase failed" }, { status: 500 });
  }

  // Suscripciones: se sincroniza el estado real del cliente.
  const customerId = obj.object === "customer" ? obj.id : obj.customer;
  if (customerId) {
    try {
      await syncCustomer(customerId);
    } catch {
      return NextResponse.json({ error: "sync failed" }, { status: 500 });
    }
  }

  await admin.from("stripe_events").insert({ id: event.id, type: event.type });
  return NextResponse.json({ received: true });
}
