"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { startPurchase } from "@/app/actions/purchases";
import { CONSENT_TEXT, PRICE_LABEL } from "@/lib/purchase-info";

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

/** Pide el año y el lugar y lleva a comprar la revolución solar (5 €, una lectura). Los administradores no pagan. */
export function SolarReturnForm({ chartId, defaultYear, free = false }: { chartId: string; defaultYear: number; free?: boolean }) {
  return (
    <form action={startPurchase} className="form">
      <input type="hidden" name="product" value="revolucion" />
      <input type="hidden" name="chart_id" value={chartId} />
      <div className="field">
        <label htmlFor="sr-year">Año del cumpleaños</label>
        <input id="sr-year" name="year" type="number" className="input" required min={1900} max={2200} defaultValue={defaultYear} />
      </div>
      <PlacePicker />
      <label className="check">
        <input type="checkbox" name="consent" required />
        <span>
          {CONSENT_TEXT} Más en el <Link href="/aviso-legal">aviso legal</Link>.
        </span>
      </label>
      <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
        {free ? "Generar revolución solar" : `Comprar revolución solar · ${PRICE_LABEL}`}
      </button>
      {free && <p className="small muted">Como administrador no pagas: la lectura se genera sin cobro.</p>}
    </form>
  );
}
