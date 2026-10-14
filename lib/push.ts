import { createSign } from "node:crypto";

type ServiceAccount = { project_id: string; client_email: string; private_key: string };

/** Clave de servicio de Firebase (JSON completo) guardada en la variable FIREBASE_SERVICE_ACCOUNT. */
function account(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const json = JSON.parse(raw) as Partial<ServiceAccount>;
    if (!json.project_id || !json.client_email || !json.private_key) return null;
    return { project_id: json.project_id, client_email: json.client_email, private_key: json.private_key.replace(/\\n/g, "\n") };
  } catch {
    return null;
  }
}

export const pushConfigured = () => account() !== null;

const b64url = (value: string | Buffer) => Buffer.from(value).toString("base64url");

let cached: { token: string; expires: number } | null = null;

/** Token de acceso de Google (OAuth con la cuenta de servicio), reutilizado mientras no caduque. */
async function accessToken(acc: ServiceAccount): Promise<string> {
  if (cached && cached.expires > Date.now() + 60_000) return cached.token;
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(
    JSON.stringify({ iss: acc.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }),
  )}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(acc.private_key);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${b64url(signature)}` }),
  });
  if (!res.ok) throw new Error(`Google OAuth ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: data.access_token, expires: Date.now() + data.expires_in * 1000 };
  return cached.token;
}

/** `url` es la ruta interna que abre la app al tocar el aviso. */
export type PushMessage = { title: string; body: string; url: string };
/** `invalid`: el dispositivo ya no existe (app desinstalada); hay que borrarlo. */
export type PushResult = "ok" | "invalid" | "error";

export async function sendPush(token: string, message: PushMessage): Promise<PushResult> {
  const acc = account();
  if (!acc) return "error";
  try {
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${acc.project_id}/messages:send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${await accessToken(acc)}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          token,
          notification: { title: message.title, body: message.body },
          data: { url: message.url },
          android: { priority: "HIGH" },
        },
      }),
    });
    if (res.ok) return "ok";
    const text = await res.text();
    if (res.status === 404 || (res.status === 400 && /registration token/i.test(text))) return "invalid";
    return "error";
  } catch {
    return "error";
  }
}
