import { headers } from "next/headers";

/** La app de Android añade esta marca al identificador del navegador (app-android/capacitor.config.json). */
export const APP_UA_MARK = "CodiceOrbitalApp";

/** True si la petición viene de la app de Android y no de un navegador. */
export async function isAppRequest(): Promise<boolean> {
  const ua = (await headers()).get("user-agent") ?? "";
  return ua.includes(APP_UA_MARK);
}
