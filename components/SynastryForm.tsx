"use client";

import { useActionState } from "react";
import { createSynastry, type SynastryFormState } from "@/app/actions/synastry";

type ChartOption = { id: string; label: string };

export function SynastryForm({ charts }: { charts: ChartOption[] }) {
  const [state, action, pending] = useActionState<SynastryFormState, FormData>(createSynastry, {});

  return (
    <form action={action} className="form">
      <div className="grid-2" style={{ gap: 20 }}>
        <div className="field">
          <label htmlFor="chart_a_id">Primera carta</label>
          <select id="chart_a_id" name="chart_a_id" className="input" required defaultValue="">
            <option value="" disabled>
              Elige una carta
            </option>
            {charts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="chart_b_id">Segunda carta</label>
          <select id="chart_b_id" name="chart_b_id" className="input" required defaultValue="">
            <option value="" disabled>
              Elige una carta
            </option>
            {charts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="relationship_type">¿Qué relación tenéis?</label>
        <select id="relationship_type" name="relationship_type" className="input" defaultValue="pareja">
          <option value="pareja">Pareja</option>
          <option value="familia">Familia</option>
          <option value="amistad">Amistad</option>
          <option value="trabajo">Trabajo o socios</option>
          <option value="otro">Otro vínculo</option>
        </select>
        <p className="small muted" style={{ marginTop: 6 }}>
          La lectura se adapta a este tipo de vínculo: no es lo mismo leer los aspectos entre una pareja que entre hermanos o socios.
        </p>
      </div>
      <p className="small muted">Las casas superpuestas se calculan en un sentido: dónde caen los planetas de la segunda carta en las casas de la primera.</p>
      {state.error && (
        <p className="notice notice-error" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={pending} style={{ alignSelf: "flex-start" }}>
        {pending ? "Calculando…" : "Calcular sinastría"}
      </button>
    </form>
  );
}
