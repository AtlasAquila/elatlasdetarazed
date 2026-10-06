import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { openPortal } from "@/app/actions/billing";
import { DeleteAccountForm, ProfileForm } from "@/components/AuthForms";
import { PRODUCTS } from "@/lib/purchase-info";
import { listMyPurchases, returnPath, type PurchaseStatus } from "@/lib/purchases";
import { billingReady, stripe, syncCustomer } from "@/lib/stripe";
import { createClient, getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mi cuenta" };

type Props = { searchParams: Promise<{ pago?: string; session_id?: string; error?: string }> };

const PURCHASE_LABELS: Record<PurchaseStatus, string> = {
  pending: "pago sin confirmar",
  paid: "pagada, pendiente de generar",
  used: "entregada",
  refunded: "reembolsada",
};

const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" });

export default async function CuentaPage({ searchParams }: Props) {
  const sp = await searchParams;
  let session = await getSession();
  if (!session) redirect("/entrar?siguiente=/cuenta");

  // Vuelta desde el pago: confirmamos con Stripe sin esperar al aviso (webhook).
  let justPaid = false;
  if (sp.pago === "ok" && sp.session_id && billingReady() && /^cs_[A-Za-z0-9_]+$/.test(sp.session_id)) {
    try {
      const checkout = await stripe<{ client_reference_id: string | null; customer: string | null; status: string }>("GET", `/checkout/sessions/${sp.session_id}`);
      if (checkout.client_reference_id === session.userId && checkout.customer && checkout.status === "complete") {
        await syncCustomer(checkout.customer);
        justPaid = true;
        session = (await getSession()) ?? session;
      }
    } catch {
      // Si falla, el webhook lo actualizará en unos segundos.
    }
  }

  const supabase = await createClient();
  const { data: sub } = supabase
    ? await supabase.from("profiles").select("subscription_status, subscription_interval, current_period_end, cancel_at_period_end, stripe_customer_id").eq("id", session.userId).maybeSingle()
    : { data: null };
  const isPremium = session.plan === "premium";
  // Las compras que no llegaron a pagarse (pantalla de pago abandonada) no se muestran.
  const purchases = (await listMyPurchases(10)).filter((p) => p.status !== "pending");

  return (
    <section className="hero">
      <div className="container reading">
        <p className="kicker">Mi cuenta</p>
        <h1>{session.displayName ? `Hola, ${session.displayName}` : "Tu cuenta"}</h1>
        <p className="lead">{session.email}</p>

        <div className="panel" style={{ marginTop: 32 }}>
          <h3>Tus cartas</h3>
          <p className="muted">Calcula y guarda tus cartas natales y las de las personas que te importan.</p>
          <Link href="/carta" className="btn btn-ghost btn-small">
            Ver mis cartas
          </Link>
        </div>

        {justPaid && isPremium && (
          <p className="notice" style={{ marginTop: 32 }}>
            ¡Bienvenido a Premium! Ya tienes hasta 10 cartas guardadas y 300 mensajes al mes con Alshain.
          </p>
        )}
        {sp.error === "pagos" && (
          <p className="notice notice-error" role="alert" style={{ marginTop: 32 }}>
            No hemos podido abrir la gestión de pagos. Inténtalo de nuevo en unos minutos.
          </p>
        )}

        <div className="panel" style={{ marginTop: 24 }}>
          <h3>Plan</h3>
          {isPremium ? (
            <>
              <p style={{ marginBottom: 8 }}>
                <strong>Premium</strong>
                {sub?.subscription_interval === "year" ? " · anual" : sub?.subscription_interval === "month" ? " · mensual" : ""}
              </p>
              {sub?.subscription_status === "past_due" ? (
                <p className="notice notice-error">No hemos podido cobrar la última cuota. Actualiza tu tarjeta para no perder Premium.</p>
              ) : sub?.current_period_end ? (
                <p className="muted">
                  {sub.cancel_at_period_end ? `Cancelada: seguirás siendo Premium hasta el ${fecha(sub.current_period_end)}.` : `Se renueva el ${fecha(sub.current_period_end)}.`}
                </p>
              ) : null}
              {sub?.stripe_customer_id && (
                <form action={openPortal}>
                  <button type="submit" className="btn btn-ghost btn-small">
                    Gestionar suscripción y facturas
                  </button>
                </form>
              )}
            </>
          ) : (
            <>
              <p className="muted">Gratuito: 3 cartas, la lectura extensa de cada una y 3 preguntas a Alshain.</p>
              {billingReady() ? (
                <div className="actions">
                  <Link href="/planes" className="btn btn-primary btn-small">
                    Hazte Premium
                  </Link>
                  {sub?.stripe_customer_id && (
                    <form action={openPortal}>
                      <button type="submit" className="btn btn-ghost btn-small">
                        Ver mis facturas
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <p className="small muted" style={{ marginBottom: 0 }}>
                  Premium estará disponible en el lanzamiento.
                </p>
              )}
            </>
          )}
          {session.isAdmin && <p className="small muted" style={{ marginTop: 12, marginBottom: 0 }}>Como administrador tienes acceso completo sin suscripción.</p>}
        </div>

        <div className="panel" style={{ marginTop: 24 }}>
          <h3>Tus lecturas compradas</h3>
          {purchases.length === 0 ? (
            <p className="muted" style={{ marginBottom: 0 }}>
              Aún no has comprado ninguna. El clima astral personalizado, la revolución solar y la sinastría se compran por separado en{" "}
              <Link href="/recursos">Más recursos astrológicos</Link>.
            </p>
          ) : (
            <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
              {purchases.map((p) => (
                <li key={p.id} style={{ marginBottom: 8 }}>
                  <Link href={returnPath(p.product, p.params)}>{PRODUCTS[p.product].name}</Link> · {fecha(p.created_at)} · <span className="muted">{PURCHASE_LABELS[p.status]}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel" style={{ marginTop: 24 }}>
          <h3>Tus datos</h3>
          <ProfileForm name={session.displayName ?? ""} />
          <p className="small" style={{ marginTop: 20, marginBottom: 0 }}>
            <Link href="/nueva-contrasena">Cambiar la contraseña</Link>
          </p>
        </div>

        <div className="actions" style={{ marginTop: 24 }}>
          {session.isAdmin && (
            <Link href="/admin" className="btn btn-primary">
              Panel de publicación
            </Link>
          )}
          <form action={signOut}>
            <button type="submit" className="btn btn-ghost">
              Cerrar sesión
            </button>
          </form>
        </div>

        <details className="panel" style={{ marginTop: 48 }}>
          <summary style={{ cursor: "pointer", color: "var(--ink-muted)" }}>Borrar mi cuenta</summary>
          <div style={{ marginTop: 20 }}>
            <DeleteAccountForm />
          </div>
        </details>
      </div>
    </section>
  );
}
