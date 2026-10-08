"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestVenusGuide, type VenusGuideState } from "@/app/actions/venus-guia";
import { PlacePicker } from "@/components/PlacePicker";
import { guideSummary, VENUS_CALENDAR } from "@/lib/venus-retrogrado";

export function VenusGuideForm() {
  const [state, action, pending] = useActionState<VenusGuideState, FormData>(requestVenusGuide, {});

  if (state.guide) {
    const s = guideSummary(state.guide);
    return (
      <div className="venus-guide" role="status">
        <p className="kicker">Tu guía, {state.guide.nombre}</p>
        <h3>Ascendente {s.ascendente} · la Luna Nueva cae en tu casa {s.casa}</h3>
        <p>
          La Luna Nueva del 10 de octubre, a 17°22' de Libra, toca en tu carta {s.tema}.
          {state.guide.aproximada && " En la latitud de tu lugar de nacimiento las casas Placidus no se pueden calcular con exactitud, así que la casa es aproximada."}
        </p>
        <p className="venus-guide-question">{s.pregunta}</p>
        <h4>Calendario de Venus retrógrado</h4>
        <ul className="venus-calendar">
          {VENUS_CALENDAR.map((c) => (
            <li key={c.fecha}>
              <strong>{c.fecha}.</strong> {c.texto}
            </li>
          ))}
        </ul>
        <p className="small muted">
          {state.email === "enviado" && "Te la hemos enviado también por correo. "}
          {state.email === "anterior" && "Ese correo ya había pedido la guía, así que no te la reenviamos. "}
          {state.email === "no" && "No hemos podido enviártela por correo; guarda esta página. "}
          Es una guía general: habla de tendencias, no de destinos.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="form">
      {/* Campo trampa contra automatismos: se oculta a las personas. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
        <label htmlFor="venus-web">No rellenes este campo</label>
        <input id="venus-web" name="web" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="field">
        <label htmlFor="venus-nombre">Nombre</label>
        <input id="venus-nombre" name="nombre" className="input" required maxLength={80} autoComplete="given-name" />
      </div>
      <div className="grid-2" style={{ gap: 20 }}>
        <div className="field">
          <label htmlFor="venus-date">Fecha de nacimiento</label>
          <input id="venus-date" name="date" type="date" className="input" required min="1800-01-01" max="2200-12-31" autoComplete="bday" />
        </div>
        <div className="field">
          <label htmlFor="venus-time">Hora de nacimiento</label>
          <input id="venus-time" name="time" type="time" className="input" required />
        </div>
      </div>
      <PlacePicker />
      <div className="field">
        <label htmlFor="venus-email">Tu email</label>
        <input id="venus-email" name="email" type="email" className="input" required autoComplete="email" placeholder="nombre@correo.com" />
      </div>
      <label className="check">
        <input type="checkbox" name="consent" required />
        <span>
          Acepto que El atlas de Tarazed guarde mis datos de nacimiento y mi correo para calcular y enviarme la guía, según la <Link href="/privacidad">política de privacidad</Link>.
        </span>
      </label>
      {state.error && (
        <p className="notice notice-error" role="alert">
          {state.error}
        </p>
      )}
      <div>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Calculando…" : "Envíame la guía gratis"}
        </button>
      </div>
      <p className="small muted" style={{ margin: 0 }}>
        Te la envío en 2 minutos. Sin spam.
      </p>
    </form>
  );
}
