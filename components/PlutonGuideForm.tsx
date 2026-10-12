"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { requestPlutonGuide, type PlutonGuideState } from "@/app/actions/pluton-guia";
import { BirthDateTimeFields } from "@/components/BirthDateTimeFields";
import { PlacePicker } from "@/components/PlacePicker";
import { PlutonGuideView } from "@/components/PlutonGuideView";

export function PlutonGuideForm() {
  const [state, action, pending] = useActionState<PlutonGuideState, FormData>(requestPlutonGuide, {});
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
    return <PlutonGuideView guide={state.guide} aviso={aviso} />;
  }

  return (
    <form action={action} className="form">
      {/* Campo trampa contra automatismos: se oculta a las personas. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
        <label htmlFor="pluton-web">No rellenes este campo</label>
        <input id="pluton-web" name="web" tabIndex={-1} autoComplete="off" />
      </div>
      <BirthDateTimeFields idPrefix="pluton" />
      <PlacePicker />
      <div className="field">
        <label htmlFor="pluton-nombre">Tu nombre (opcional)</label>
        <input id="pluton-nombre" name="nombre" className="input" maxLength={80} autoComplete="given-name" />
      </div>
      <label className="check">
        <input type="checkbox" name="enviar_correo" checked={porCorreo} onChange={(e) => setPorCorreo(e.target.checked)} />
        <span>Quiero recibir también la guía en mi correo.</span>
      </label>
      {porCorreo && (
        <div className="field">
          <label htmlFor="pluton-email">Tu correo</label>
          <input id="pluton-email" name="email" type="email" className="input" required autoComplete="email" placeholder="nombre@correo.com" />
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
          {pending ? "Escribiendo tu guía…" : "Ver mi guía gratis"}
        </button>
      </div>
      <p className="small muted" style={{ margin: 0 }} aria-live="polite">
        {pending
          ? "Estamos calculando tu carta y escribiendo tu guía. Tarda cerca de un minuto: no cierres la página."
          : "La guía aparece en pantalla en cerca de un minuto. Guardamos tus datos de nacimiento para calcularla; para redactarla se envían a Anthropic sin tu nombre ni tu correo (privacidad)."}
      </p>
    </form>
  );
}
