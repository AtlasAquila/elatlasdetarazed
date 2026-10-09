"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { requestVenusGuide, type VenusGuideState } from "@/app/actions/venus-guia";
import { BirthDateTimeFields } from "@/components/BirthDateTimeFields";
import { PlacePicker } from "@/components/PlacePicker";
import { VenusGuideView } from "@/components/VenusGuideView";

export function VenusGuideForm() {
  const [state, action, pending] = useActionState<VenusGuideState, FormData>(requestVenusGuide, {});
  const [porCorreo, setPorCorreo] = useState(false);

  if (state.guide) {
    const aviso =
      state.email === "enviado"
        ? "Te la hemos enviado también por correo."
        : state.email === "anterior"
          ? "Ese correo ya había pedido la guía, así que no te la reenviamos."
          : state.email === "no"
            ? "No hemos podido enviártela por correo; guarda esta página."
            : "Guarda esta página si quieres volver a leerla.";
    return <VenusGuideView guide={state.guide} aviso={aviso} />;
  }

  return (
    <form action={action} className="form">
      {/* Campo trampa contra automatismos: se oculta a las personas. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
        <label htmlFor="venus-web">No rellenes este campo</label>
        <input id="venus-web" name="web" tabIndex={-1} autoComplete="off" />
      </div>
      <BirthDateTimeFields idPrefix="venus" />
      <PlacePicker />
      <div className="field">
        <label htmlFor="venus-nombre">Tu nombre (opcional)</label>
        <input id="venus-nombre" name="nombre" className="input" maxLength={80} autoComplete="given-name" />
      </div>
      <label className="check">
        <input type="checkbox" name="enviar_correo" checked={porCorreo} onChange={(e) => setPorCorreo(e.target.checked)} />
        <span>Quiero recibir también la guía en mi correo.</span>
      </label>
      {porCorreo && (
        <div className="field">
          <label htmlFor="venus-email">Tu correo</label>
          <input id="venus-email" name="email" type="email" className="input" required autoComplete="email" placeholder="nombre@correo.com" />
          <p className="small muted" style={{ margin: "6px 0 0" }}>
            Lo guardamos solo para enviarte la guía, según la <Link href="/privacidad">política de privacidad</Link>.
          </p>
        </div>
      )}
      {state.error && (
        <p className="notice notice-error" role="alert">
          {state.error}
        </p>
      )}
      <div>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Calculando…" : "Ver mi guía gratis"}
        </button>
      </div>
      <p className="small muted" style={{ margin: 0 }}>
        La guía aparece en pantalla al momento. Guardamos tus datos de nacimiento para calcularla (<Link href="/privacidad">privacidad</Link>).
      </p>
    </form>
  );
}
