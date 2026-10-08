"use client";

import { useActionState, useState } from "react";
import { createChart, type ChartFormState } from "@/app/actions/charts";
import { PlacePicker } from "@/components/PlacePicker";

export function ChartForm({ suggestSelf, origen }: { suggestSelf: boolean; origen?: string }) {
  const [state, action, pending] = useActionState<ChartFormState, FormData>(createChart, {});
  const [unknown, setUnknown] = useState(false);

  return (
    <form action={action} className="form">
      {origen && <input type="hidden" name="origen" value={origen} />}
      <div className="field">
        <label htmlFor="name">Nombre de la carta</label>
        <input id="name" name="name" className="input" required maxLength={80} placeholder="Tu nombre, o el de quien sea la carta" />
      </div>
      <label className="check">
        <input type="checkbox" name="is_self" defaultChecked={suggestSelf} />
        <span>Es mi propia carta</span>
      </label>
      <div className="grid-2" style={{ gap: 20 }}>
        <div className="field">
          <label htmlFor="date">Fecha de nacimiento</label>
          <input id="date" name="date" type="date" className="input" required min="1800-01-01" max="2200-12-31" />
        </div>
        <div className="field">
          <label htmlFor="time">Hora (local, del lugar de nacimiento)</label>
          <input id="time" name="time" type="time" className="input" required={!unknown} disabled={unknown} />
        </div>
      </div>
      <label className="check">
        <input type="checkbox" name="time_unknown" checked={unknown} onChange={(e) => setUnknown(e.target.checked)} />
        <span>No sé la hora de nacimiento (no se calcularán el Ascendente ni las casas)</span>
      </label>
      <PlacePicker />
      <div className="field">
        <label htmlFor="house_system">Sistema de casas</label>
        <select id="house_system" name="house_system" className="input" defaultValue="placidus">
          <option value="placidus">Placidus (el más usado)</option>
          <option value="koch">Koch</option>
          <option value="equal">Casas iguales</option>
          <option value="whole">Signos enteros</option>
        </select>
      </div>
      {state.error && (
        <p className="notice notice-error" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={pending} style={{ alignSelf: "flex-start" }}>
        {pending ? "Calculando…" : "Calcular mi carta"}
      </button>
    </form>
  );
}
