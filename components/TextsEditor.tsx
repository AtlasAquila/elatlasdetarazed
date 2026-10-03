"use client";

import { useActionState } from "react";
import { saveTexts, type TextsFormState } from "@/app/actions/texts";
import type { TextGroup } from "@/lib/texts";

export function TextsEditor({ group, saved }: { group: TextGroup; saved: Record<string, string> }) {
  const [state, action, pending] = useActionState<TextsFormState, FormData>(saveTexts, {});

  return (
    <form action={action} className="form">
      <input type="hidden" name="group" value={group.id} />
      {group.fields.map((f) => {
        const value = saved[f.key] ?? f.default;
        const edited = f.key in saved;
        const rows = f.kind === "line" ? 1 : Math.min(10, Math.max(3, value.split("\n").length + 1, Math.ceil(value.length / 70)));
        return (
          <div className="field" key={f.key}>
            <label htmlFor={f.key}>
              {f.label}
              {edited && <span style={{ color: "var(--oro)", marginLeft: 8, letterSpacing: 0, textTransform: "none" }}>· editado</span>}
            </label>
            {f.kind === "line" ? (
              <input id={f.key} name={f.key} className="input" defaultValue={value} />
            ) : (
              <textarea id={f.key} name={f.key} className="textarea" style={{ minHeight: 0 }} rows={rows} defaultValue={value} />
            )}
            {f.kind === "list" && <span className="small muted">Un elemento por línea.</span>}
          </div>
        );
      })}
      <p className="small muted" style={{ margin: 0 }}>
        Si dejas un campo vacío, vuelve a su texto original.
      </p>
      {state.error && (
        <p className="notice notice-error" role="alert">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="notice notice-ok" role="status">
          {state.message}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={pending} style={{ alignSelf: "flex-start" }}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
