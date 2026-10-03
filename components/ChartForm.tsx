"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { createChart, type ChartFormState } from "@/app/actions/charts";

type PlaceOption = { label: string; latitude: number; longitude: number; timeZone: string };

function PlacePicker() {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<PlaceOption[]>([]);
  const [selected, setSelected] = useState<PlaceOption | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const listId = useId();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selected && query === selected.label) return;
    setSelected(null);
    if (timer.current) clearTimeout(timer.current);
    if (query.trim().length < 2) {
      setOptions([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/lugares?q=${encodeURIComponent(query)}`);
        const data = (await res.json()) as PlaceOption[];
        setOptions(data);
        setOpen(true);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 220);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const choose = (p: PlaceOption) => {
    setSelected(p);
    setQuery(p.label);
    setOpen(false);
  };

  return (
    <div className="field" style={{ position: "relative" }}>
      <label htmlFor="place">Lugar de nacimiento</label>
      <input
        id="place"
        className="input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => options.length && !selected && setOpen(true)}
        placeholder="Escribe tu ciudad o pueblo"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        required
      />
      {selected ? (
        <span className="small muted">
          {selected.latitude.toFixed(2)}°, {selected.longitude.toFixed(2)}° · zona horaria {selected.timeZone}
        </span>
      ) : (
        <span className="small muted">{loading ? "Buscando…" : "Elige tu lugar en la lista. Si tu pueblo no aparece, elige el más cercano."}</span>
      )}
      {open && options.length > 0 && !selected && (
        <ul className="place-results" id={listId} role="listbox">
          {options.map((p) => (
            <li key={`${p.label}-${p.latitude}`} role="option" aria-selected={false}>
              <button type="button" onClick={() => choose(p)}>
                {p.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && !loading && options.length === 0 && query.trim().length >= 2 && !selected && <span className="small muted">No encontramos ese lugar. Prueba con otra ortografía o con la ciudad más cercana.</span>}
      <input type="hidden" name="place_name" value={selected?.label ?? ""} />
      <input type="hidden" name="latitude" value={selected?.latitude ?? ""} />
      <input type="hidden" name="longitude" value={selected?.longitude ?? ""} />
      <input type="hidden" name="time_zone" value={selected?.timeZone ?? ""} />
    </div>
  );
}

export function ChartForm({ suggestSelf }: { suggestSelf: boolean }) {
  const [state, action, pending] = useActionState<ChartFormState, FormData>(createChart, {});
  const [unknown, setUnknown] = useState(false);

  return (
    <form action={action} className="form">
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
