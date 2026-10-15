import { headers } from "next/headers";

import { APP_UA_MARK } from "./app-ua";

export { APP_UA_MARK };

/** True si la petición viene de la app de Android y no de un navegador. */
export async function isAppRequest(): Promise<boolean> {
  const ua = (await headers()).get("user-agent") ?? "";
  return ua.includes(APP_UA_MARK);
}
