"use client";

import Link from "next/link";
import { startPurchase } from "@/app/actions/purchases";
import { CONSENT_TEXT, PRICE_LABEL } from "@/lib/purchase-info";

type ChartOption = { id: string; label: string };

/** Elige las dos cartas y el vínculo y lleva a comprar la sinastría (5 €, una lectura). Los administradores no pagan. */
export function SynastryForm({ charts, free = false }: { charts: ChartOption[]; free?: boolean }) {
  return (
    <form action={startPurchase} className="form">
      <input type="hidden" name="product" value="sinastria" />
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
      <label className="check">
        <input type="checkbox" name="consent" required />
        <span>
          {CONSENT_TEXT} Más en el <Link href="/aviso-legal">aviso legal</Link>.
        </span>
      </label>
      <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
        {free ? "Generar sinastría" : `Comprar sinastría · ${PRICE_LABEL}`}
      </button>
      {free && <p className="small muted">Como administrador no pagas: la lectura se genera sin cobro.</p>}
    </form>
  );
}
