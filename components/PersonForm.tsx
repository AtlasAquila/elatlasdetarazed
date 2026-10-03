"use client";

import { useActionState } from "react";
import { createPerson, updatePerson, type PersonFormState } from "@/app/actions/numerology";

type Props = {
  person?: { id: string; full_name: string; current_name: string | null; birth_date: string; label: string | null; is_self: boolean };
  suggestSelf?: boolean;
};

export function PersonForm({ person, suggestSelf }: Props) {
  const [state, action, pending] = useActionState<PersonFormState, FormData>(person ? updatePerson : createPerson, {});
  return (
    <form action={action} className="form">
      {person && <input type="hidden" name="id" value={person.id} />}
      <div className="field">
        <label htmlFor="full_name">Nombre completo de nacimiento</label>
        <input id="full_name" name="full_name" className="input" required maxLength={120} defaultValue={person?.full_name} placeholder="Nombre y apellidos, tal como constan en el registro" autoComplete="off" />
        <span className="small muted">Con los dos apellidos si los tiene. Los acentos, la ñ y la ç no cambian el cálculo.</span>
      </div>
      <div className="field">
        <label htmlFor="current_name">Nombre de uso (opcional)</label>
        <input id="current_name" name="current_name" className="input" maxLength={120} defaultValue={person?.current_name ?? ""} placeholder="Si le conocen por otro nombre: apodo, nombre artístico…" autoComplete="off" />
      </div>
      <div className="grid-2" style={{ gap: 20 }}>
        <div className="field">
          <label htmlFor="date">Fecha de nacimiento</label>
          <input id="date" name="date" type="date" className="input" required min="1800-01-01" max="2200-12-31" defaultValue={person?.birth_date} />
        </div>
        <div className="field">
          <label htmlFor="label">Relación (opcional)</label>
          <input id="label" name="label" className="input" maxLength={40} defaultValue={person?.label ?? ""} placeholder="Pareja, madre, socio…" autoComplete="off" />
        </div>
      </div>
      <label className="check">
        <input type="checkbox" name="is_self" defaultChecked={person ? person.is_self : suggestSelf} />
        Soy yo
      </label>
      {state.error && (
        <p className="notice notice-error" role="alert">
          {state.error}
        </p>
      )}
      <div>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Calculando…" : person ? "Guardar cambios" : "Calcular y guardar"}
        </button>
      </div>
    </form>
  );
}
