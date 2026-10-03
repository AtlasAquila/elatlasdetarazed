import { NextResponse, type NextRequest } from "next/server";
import { StripeError, billingReady, stripe, syncCustomer } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Avisos de Stripe (pagos, renovaciones, cancelaciones).
 *
 * No nos fiamos del contenido recibido: solo tomamos el id del evento y lo volvemos a pedir
 * a Stripe con nuestra clave secreta. Si el evento no existe en nuestra cuenta, se descarta.
 * Después se sincroniza el estado real del cliente, así que el orden de llegada no importa.
 */
export async function POST(request: NextRequest) {
  if (!billingReady()) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const payload = (await request.json().catch(() => null)) as { id?: string } | null;
  const eventId = payload?.id;
  if (!eventId || !/^evt_[A-Za-z0-9]+$/.test(eventId)) return NextResponse.json({ error: "bad request" }, { status: 400 });

  let event: { id: string; type: string; data: { object: { object?: string; id?: string; customer?: string | null } } };
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
  const customerId = obj.object === "customer" ? obj.id : obj.customer;
  if (customerId) {
    try {
      await syncCustomer(customerId);
    } catch {
      // Stripe reintentará el aviso más tarde.
      return NextResponse.json({ error: "sync failed" }, { status: 500 });
    }
  }

  await admin.from("stripe_events").insert({ id: event.id, type: event.type });
  return NextResponse.json({ received: true });
}
