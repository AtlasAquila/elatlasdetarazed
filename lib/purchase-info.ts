/**
 * Constantes de las compras que también usan los componentes de cliente. Sin dependencias de
 * servidor: lo que necesite la base de datos o Stripe va en lib/purchases.ts.
 */

export type Product = "clima" | "revolucion" | "sinastria";
export const PRODUCT_LIST: Product[] = ["clima", "revolucion", "sinastria"];

export const PRODUCTS: Record<Product, { name: string; description: string }> = {
  clima: { name: "Clima astral personalizado", description: "Lectura extensa de tu cielo de los próximos 30 días sobre tu carta natal." },
  revolucion: { name: "Revolución solar", description: "Lectura extensa de la carta de tu próximo año." },
  sinastria: { name: "Sinastría", description: "Lectura extensa de cómo dialogan dos cartas." },
};

export const PRICE_CENTS = 500;
export const PRICE_LABEL = "5 €";

export const CONSENT_TEXT =
  "Acepto que la lectura se prepara y se entrega en el momento de la compra y que, una vez entregada, pierdo el derecho de desistimiento.";
