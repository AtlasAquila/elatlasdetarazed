"use client";

import { useActionState } from "react";
import { createDream, type DreamFormState } from "@/app/actions/dreams";

type Props = {
  today: string;
  emotions: readonly string[];
  charts: { id: string; label: string }[];
  defaultChart: string | null;
};

export function DreamForm({ today, emotions, charts, defaultChart }: Props) {
  const [state, action, pending] = useActionState<DreamFormState, FormData>(createDream, {});
  return (
    <form action={action} className="form">
      <div className="field">
        <label htmlFor="content">Tu sueño</label>
        <textarea
          id="content"
          name="content"
          className="textarea"
          required
          minLength={10}
          maxLength={8000}
          style={{ minHeight: 240 }}
          placeholder="Cuéntalo tal como lo recuerdas, en presente si te ayuda: dónde estabas, quién aparecía, qué pasaba, qué sentías, cómo terminaba. Los detalles que parecen absurdos suelen ser los más interesantes."
        />
      </div>
      <div className="grid-2" style={{ gap: 20 }}>
        <div className="field">
          <label htmlFor="date">Noche del sueño</label>
          <input id="date" name="date" type="date" className="input" required defaultValue={today} max={today} min="1900-01-01" />
        </div>
        <div className="field">
          <label htmlFor="title">Título (opcional)</label>
          <input id="title" name="title" className="input" maxLength={120} placeholder="Si no le pones, usaremos el principio del relato" autoComplete="off" />
        </div>
      </div>
      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ fontSize: 13, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 8 }}>Cómo te sentías (opcional)</legend>
        <div className="toggles">
          {emotions.map((e) => (
            <label key={e} className="toggle chip">
              <input type="checkbox" name="emotions" value={e} />
              {e}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="check">
        <input type="checkbox" name="recurring" />
        Es un sueño que se repite
      </label>
      {charts.length > 0 && (
        <div className="field">
          <label htmlFor="chart_id">Leerlo también con una carta natal (opcional)</label>
          <select id="chart_id" name="chart_id" className="input" defaultValue={defaultChart ?? ""}>
            <option value="">Sin carta</option>
            {charts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}
      {state.error && (
        <p className="notice notice-error" role="alert">
          {state.error}
        </p>
      )}
      <div>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Guardando…" : "Guardar e interpretar"}
        </button>
      </div>
    </form>
  );
}
