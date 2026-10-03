"use client";

import Link from "next/link";
import { useActionState } from "react";
import { joinWaitlist, type FormState } from "@/app/actions/waitlist";

export function WaitlistForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(joinWaitlist, {});

  if (state.ok) {
    return (
      <p className="notice notice-ok" role="status">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="form" style={{ maxWidth: 520 }}>
      <div className="field">
        <label htmlFor="waitlist-email">Tu correo electrónico</label>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input id="waitlist-email" name="email" type="email" required autoComplete="email" className="input" style={{ flex: "1 1 240px" }} placeholder="nombre@correo.com" />
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Guardando…" : "Apuntarme"}
          </button>
        </div>
      </div>
      <label className="check">
        <input type="checkbox" name="consent" required />
        <span>
          Acepto que El atlas de Tarazed guarde mi correo para avisarme del lanzamiento, según la <Link href="/privacidad">política de privacidad</Link>.
        </span>
      </label>
      {state.error && (
        <p className="notice notice-error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
