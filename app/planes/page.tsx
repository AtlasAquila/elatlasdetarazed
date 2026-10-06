import type { Metadata } from "next";
import Link from "next/link";
import { openPortal, startCheckout } from "@/app/actions/billing";
import { billingReady } from "@/lib/stripe";
import { getSession } from "@/lib/supabase/server";
import { getTexts } from "@/lib/texts";

export const metadata: Metadata = {
  title: "Planes",
  description: "El atlas de Tarazed es gratuito para empezar, con la lectura extensa de tus cartas. Premium añade el asistente con memoria y más cartas guardadas.",
};

type Props = { searchParams: Promise<{ pago?: string; error?: string }> };

export default async function PlanesPage({ searchParams }: Props) {
  const [{ t, list }, session, sp] = await Promise.all([getTexts(), getSession(), searchParams]);
  const ready = billingReady();
  const isPremium = session?.plan === "premium";
  return (
    <>
      <section className="hero">
        <div className="container reading">
          <p className="kicker">Planes</p>
          <h1>{t("planes.title")}</h1>
          <p className="lead">{t("planes.lead")}</p>
          {sp.pago === "cancelado" && <p className="notice">Has salido del pago sin completarlo. No se ha hecho ningún cargo.</p>}
          {sp.error === "pagos" && (
            <p className="notice notice-error" role="alert">
              No hemos podido abrir la página de pago. Inténtalo de nuevo en unos minutos.
            </p>
          )}
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container grid-2">
          <div className="card" style={{ padding: 40 }}>
            <p className="kicker">Gratuito</p>
            <h2>0 €</h2>
            <p className="muted">{t("planes.free.subtitle")}</p>
            <ul style={{ paddingLeft: 20, marginBottom: 32 }}>
              {list("planes.free.items").map((f) => (
                <li key={f} style={{ marginBottom: 8 }}>
                  {f}
                </li>
              ))}
            </ul>
            {session ? (
              <span className="tag">{isPremium ? "Incluido en tu plan" : "Tu plan actual"}</span>
            ) : (
              <Link href="/registro" className="btn btn-ghost">
                Crear cuenta
              </Link>
            )}
          </div>
          <div className="plate">
            <div style={{ padding: 40 }}>
              <p className="kicker">Premium</p>
              <h2>
                {t("planes.premium.price")} <span className="muted" style={{ fontSize: 22 }}>/ mes</span>
              </h2>
              <p className="muted">{t("planes.premium.subtitle")}</p>
              <ul style={{ paddingLeft: 20, marginBottom: 32 }}>
                {list("planes.premium.items").map((f) => (
                  <li key={f} style={{ marginBottom: 8 }}>
                    {f}
                  </li>
                ))}
              </ul>
              {!ready ? (
                <span className="tag" style={{ marginBottom: 0 }}>
                  Disponible en el lanzamiento
                </span>
              ) : isPremium ? (
                <form action={openPortal}>
                  <p className="muted small">Ya eres Premium. Gracias por apoyar El atlas de Tarazed.</p>
                  <button type="submit" className="btn btn-ghost">
                    Gestionar mi suscripción
                  </button>
                </form>
              ) : session ? (
                <>
                  <div className="actions">
                    <form action={startCheckout}>
                      <input type="hidden" name="interval" value="month" />
                      <button type="submit" className="btn btn-primary">
                        Mensual · 9,99 €
                      </button>
                    </form>
                    <form action={startCheckout}>
                      <input type="hidden" name="interval" value="year" />
                      <button type="submit" className="btn btn-ghost">
                        Anual · 69,99 €
                      </button>
                    </form>
                  </div>
                  <p className="small muted" style={{ marginTop: 16, marginBottom: 0 }}>
                    Pago seguro con tarjeta a través de Stripe. IVA incluido. Cancela cuando quieras desde tu cuenta.
                  </p>
                </>
              ) : (
                <>
                  <Link href="/registro?siguiente=/planes" className="btn btn-primary">
                    Crear cuenta y suscribirme
                  </Link>
                  <p className="small muted" style={{ marginTop: 16, marginBottom: 0 }}>
                    ¿Ya tienes cuenta? <Link href="/entrar?siguiente=/planes">Entra</Link> para suscribirte.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="container reading" style={{ marginTop: 40 }}>
          <p className="kicker">Recursos astrológicos</p>
          <p className="muted">{t("planes.recursos")}</p>
          <Link href="/recursos" className="btn btn-ghost btn-small">
            Ver los recursos
          </Link>
        </div>
      </section>
    </>
  );
}
