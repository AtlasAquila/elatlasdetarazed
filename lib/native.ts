/**
 * Puente con la app de Android. Dentro de la app, Capacitor inyecta `window.Capacitor` con estas dos
 * funciones aunque la web se cargue desde codiceorbital.com; en un navegador no existe.
 */
type Bridge = {
  nativePromise: (plugin: string, method: string, options?: object) => Promise<any>;
  addListener: (plugin: string, event: string, callback: (data: any) => void) => unknown;
};

export function nativeBridge(): Bridge | null {
  const cap = (globalThis as { Capacitor?: Partial<Bridge> }).Capacitor;
  return cap && typeof cap.nativePromise === "function" && typeof cap.addListener === "function" ? (cap as Bridge) : null;
}

export const PUSH_TOKEN_KEY = "co-push-token";

export function storedToken(): string | null {
  try {
    return localStorage.getItem(PUSH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(PUSH_TOKEN_KEY, token);
    else localStorage.removeItem(PUSH_TOKEN_KEY);
  } catch {
    // Sin almacenamiento: el aviso funciona igual, solo no se re-sincroniza al abrir la app.
  }
}

/** Pide permiso a Android y obtiene el identificador de este dispositivo en Firebase. */
export async function registerForPush(onToken: (token: string) => void): Promise<"ok" | "denied" | "unavailable"> {
  const cap = nativeBridge();
  if (!cap) return "unavailable";
  try {
    let perm = await cap.nativePromise("PushNotifications", "checkPermissions");
    if (perm?.receive !== "granted") perm = await cap.nativePromise("PushNotifications", "requestPermissions");
    if (perm?.receive !== "granted") return "denied";
    cap.addListener("PushNotifications", "registration", (t) => typeof t?.value === "string" && onToken(t.value));
    await cap.nativePromise("PushNotifications", "register");
    return "ok";
  } catch {
    return "unavailable";
  }
}
