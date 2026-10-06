import Link from "next/link";
import { startPurchase } from "@/app/actions/purchases";
import { CONSENT_TEXT, PRICE_LABEL, PRODUCTS, type Product } from "@/lib/purchases";

type Props = {
  product: Product;
  /** Datos de lo que se compra (carta, año, lugar…), como campos ocultos. */
  fields: Record<string, string | number>;
  /** Administradores: no pagan, se les entrega la lectura al momento. */
  free?: boolean;
  /** Texto del botón; por defecto «Comprar · 5 €». */
  label?: string;
};

/** Botón de compra de una lectura con la casilla de consentimiento (desistimiento). Sirve para los tres recursos. */
export function PurchaseForm({ product, fields, free = false, label }: Props) {
  return (
    <form action={startPurchase} className="form">
      <input type="hidden" name="product" value={product} />
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={String(value)} />
      ))}
      <label className="check">
        <input type="checkbox" name="consent" required />
        <span>
          {CONSENT_TEXT} Más en el <Link href="/aviso-legal">aviso legal</Link>.
        </span>
      </label>
      <div className="actions">
        <button type="submit" className="btn btn-primary">
          {label ?? (free ? `Generar ${PRODUCTS[product].name.toLowerCase()}` : `Comprar · ${PRICE_LABEL}`)}
        </button>
      </div>
      {free && <p className="small muted">Como administrador no pagas: la lectura se genera sin cobro.</p>}
    </form>
  );
}
