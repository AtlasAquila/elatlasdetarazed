"use client";

import { useEffect } from "react";
import { registerDevice, unregisterDevice } from "@/app/actions/avisos";
import { nativeBridge, registerForPush, storeToken, storedToken } from "@/lib/native";

/**
 * Se monta en toda la app (no pinta nada): abre la página del aviso que se toca, mantiene al día el
 * identificador del dispositivo y lo borra si se cierra la sesión.
 */
export function AppPush({ loggedIn }: { loggedIn: boolean }) {
  useEffect(() => {
    nativeBridge()?.addListener("PushNotifications", "pushNotificationActionPerformed", (action) => {
      const url = action?.notification?.data?.url;
      if (typeof url === "string" && url.startsWith("/") && !url.startsWith("//")) window.location.assign(url);
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

  return null;
}
