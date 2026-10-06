import { headers } from "next/headers";

/** Dirección pública de la web (para las direcciones de vuelta de Stripe), según la petición en curso. */
export async function siteUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL ?? "https://elatlasdetarazed.com");
}
