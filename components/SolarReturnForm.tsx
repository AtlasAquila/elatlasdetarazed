"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { createSolarReturn, type SolarReturnFormState } from "@/app/actions/solar-returns";

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
      <label htmlFor="sr-place">¿Dónde estarás ese cumpleaños?</label>
      <input
        id="sr-place"
        className="input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => options.length && !selected && setOpen(true)}
        placeholder="Escribe una ciudad o pueblo"
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
        <span className="small muted">{loading ? "Buscando…" : "La revolución solar depende del lugar exacto. Elige el más cercano si tu pueblo no aparece."}</span>
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

export function SolarReturnForm({ chartId, defaultYear, defaultHouseSystem }: { chartId: string; defaultYear: number; defaultHouseSystem: string }) {
  const [state, action, pending] = useActionState<SolarReturnFormState, FormData>(createSolarReturn, {});

  return (
    <form action={action} className="form">
      <input type="hidden" name="chart_id" value={chartId} />
      <div className="field">
        <label htmlFor="sr-year">Año del cumpleaños</label>
        <input id="sr-year" name="year" type="number" className="input" required min={1900} max={2200} defaultValue={defaultYear} />
      </div>
      <PlacePicker />
      <div className="field">
        <label htmlFor="sr-house-system">Sistema de casas</label>
        <select id="sr-house-system" name="house_system" className="input" defaultValue={defaultHouseSystem}>
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
        {pending ? "Calculando…" : "Calcular revolución solar"}
      </button>
    </form>
  );
}
