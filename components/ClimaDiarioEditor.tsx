"use client";

import { useActionState } from "react";
import { deleteClimaDiario, saveClimaDiario, type ClimaDiarioFormState } from "@/app/actions/clima-diario";
import type { ClimaDia } from "@/lib/clima-diario";

/** Editor de una lectura diaria en el panel: corregir el texto o retirarla. */
export function ClimaDiarioEditor({ reading }: { reading: ClimaDia }) {
  const [state, action, pending] = useActionState<ClimaDiarioFormState, FormData>(saveClimaDiario, {});
  return (
    <>
      <form action={action} className="panel" style={{ marginTop: 16 }}>
        <input type="hidden" name="day" value={reading.day} />
        <div className="field">
          <label htmlFor={`h-${reading.day}`}>Titular</label>
          <input id={`h-${reading.day}`} name="headline" className="input" defaultValue={reading.headline} maxLength={200} required />
        </div>
        <div className="field">
          <label htmlFor={`t-${reading.day}`}>Cielo del día (una línea por cada ✦)</label>
          <textarea id={`t-${reading.day}`} name="tags" className="input" rows={3} defaultValue={reading.tags.join("\n")} />
        </div>
        <div className="field">
          <label htmlFor={`b-${reading.day}`}>Texto</label>
          <textarea id={`b-${reading.day}`} name="body" className="input" rows={12} defaultValue={reading.body} required />
        </div>
        <div className="field">
          <label htmlFor={`c-${reading.day}`}>Cierre</label>
          <input id={`c-${reading.day}`} name="closing" className="input" defaultValue={reading.closing} maxLength={300} />
        </div>
        <div className="actions">
          <button type="submit" className="btn btn-primary btn-small" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </button>
        </div>
        {(state.error || state.message) && (
          <p className={state.error ? "notice notice-error" : "small muted"} role="status" style={{ marginTop: 12, marginBottom: 0 }}>
            {state.error ?? state.message}
          </p>
        )}
      </form>
      <form action={deleteClimaDiario} style={{ marginTop: 8 }}>
        <input type="hidden" name="day" value={reading.day} />
        <button type="submit" className="btn btn-ghost btn-small">
          Retirar esta lectura
        </button>
      </form>
    </>
  );
}
