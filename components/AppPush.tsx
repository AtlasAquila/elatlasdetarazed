"use client";

import { useEffect, useState } from "react";
import { registerDevice, unregisterDevice } from "@/app/actions/avisos";
import { nativeBridge, registerForPush, storeToken, storedToken } from "@/lib/native";

/**
 * Se monta en toda la app (no pinta nada): abre la página del aviso que se toca, mantiene al día el
 * identificador del dispositivo y lo borra si se cierra la sesión.
 */
type Banner = { title: string; body: string; url: string | null };

const internal = (url: unknown): string | null => (typeof url === "string" && url.startsWith("/") && !url.startsWith("//") ? url : null);

export function AppPush({ loggedIn }: { loggedIn: boolean }) {
  const [banner, setBanner] = useState<Banner | null>(null);

  // Con la app abierta Android no muestra el aviso: lo enseñamos nosotros arriba unos segundos.
  useEffect(() => {
    nativeBridge()?.addListener("PushNotifications", "pushNotificationReceived", (n) => {
      setBanner({ title: String(n?.title ?? "Códice Orbital"), body: String(n?.body ?? ""), url: internal(n?.data?.url) });
    });
  }, []);
  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(() => setBanner(null), 9000);
    return () => clearTimeout(timer);
  }, [banner]);

  useEffect(() => {
    nativeBridge()?.addListener("PushNotifications", "pushNotificationActionPerformed", (action) => {
      const url = internal(action?.notification?.data?.url);
      if (url) window.location.assign(url);
    });
  }, []);

  useEffect(() => {
    const token = storedToken();
    if (!token) return;
    if (!loggedIn) {
      unregisterDevice(token).finally(() => storeToken(null));
      return;
    }
    // Android puede cambiar el identificador: se vuelve a pedir en cada apertura.
    registerForPush((t) => {
      storeToken(t);
      registerDevice(t);
    });
  }, [loggedIn]);

  if (!banner) return null;
  const content = (
    <>
      <strong>{banner.title}</strong>
      <span>{banner.body}</span>
    </>
  );
  return banner.url ? (
    <a className="app-aviso" href={banner.url} role="status" onClick={() => setBanner(null)}>
      {content}
    </a>
  ) : (
    <div className="app-aviso" role="status" onClick={() => setBanner(null)}>
      {content}
    </div>
  );
}
