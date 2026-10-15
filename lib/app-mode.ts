import { headers } from "next/headers";

import { getSession } from "@/lib/supabase/server";
import { APP_UA_MARK } from "./app-ua";

export { APP_UA_MARK };

/** True si la petición viene de la app de Android y no de un navegador. */
export async function isAppRequest(): Promise<boolean> {
  const ua = (await headers()).get("user-agent") ?? "";
  return ua.includes(APP_UA_MARK);
}

/** True dentro de la app si hay que ocultar todo lo de pago (la app es gratuita para los testers). Los administradores lo ven para probarlo. */
export async function hidePayments(): Promise<boolean> {
  if (!(await isAppRequest())) return false;
  return !(await getSession())?.isAdmin;
}
