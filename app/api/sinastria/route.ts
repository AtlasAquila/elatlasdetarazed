import { NextResponse, type NextRequest } from "next/server";
import { MODELS, aiConfigured } from "@/lib/ai/anthropic";
import { SYNASTRY_INSTRUCTIONS, synastrySystemPrompt } from "@/lib/ai/prompts";
import { streamPurchasedReading } from "@/lib/ai/stream-reading";
import { CHART_COLUMNS, type ChartRow } from "@/lib/charts";
import { claimPurchase, finishPurchase, getMyPurchase, releasePurchase } from "@/lib/purchases";
import { ENGINE_VERSION } from "@/lib/engine";
import { RELATIONSHIP_LABELS, SYNASTRY_COLUMNS, computeSynastryData, synastryFactsText, type RelationshipType, type SynastryRow } from "@/lib/synastry";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
// Lectura de unas 5.000 palabras: entre dos y tres minutos.
export const maxDuration = 300;

const MAX_TOKENS = 16000;
const UUID = /^[0-9a-f-]{36}$/i;
const plain = (text: string) => new Response(text, { headers: { "content-type": "text/plain; charset=utf-8" } });

/**
 * Calcula la sinastría de una compra pagada y sin usar y escribe su lectura. Las dos cartas y el
 * tipo de vínculo son los que se dieron al comprar. Si el cálculo ya existe pero la lectura no se
 * completó, se reutiliza el cálculo y solo se vuelve a escribir la lectura.
 */
export async function POST(request: NextRequest) {
  const { purchaseId } = (await request.json().catch(() => ({}))) as { purchaseId?: string };
  if (!purchaseId || !UUID.test(purchaseId)) return NextResponse.json({ error: "Petición no válida." }, { status: 400 });

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "La base de datos no está conectada." }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Tu sesión ha caducado. Vuelve a entrar." }, { status: 401 });

  if (!aiConfigured()) return NextResponse.json({ error: "Las lecturas aún no están activadas." }, { status: 503 });

  const purchase = await getMyPurchase(purchaseId);
  if (!purchase || purchase.product !== "sinastria" || purchase.status !== "paid") {
    return NextResponse.json({ error: "Para leer tu sinastría necesitas comprar la lectura." }, { status: 402 });
  }
  const chartAId = String(purchase.params.chart_a_id);
  const chartBId = String(purchase.params.chart_b_id);
  const relationship = String(purchase.params.relationship_type) as RelationshipType;
  if (!UUID.test(chartAId) || !UUID.test(chartBId) || !(relationship in RELATIONSHIP_LABELS)) return NextResponse.json({ error: "Los datos de la compra no son válidos." }, { status: 400 });

  const { data: rows } = await supabase.from("charts").select(CHART_COLUMNS).in("id", [chartAId, chartBId]);
  const rowA = (rows as ChartRow[] | null)?.find((r) => r.id === chartAId);
  const rowB = (rows as ChartRow[] | null)?.find((r) => r.id === chartBId);
  if (!rowA || !rowB) return NextResponse.json({ error: "No encontramos alguna de las dos cartas. Si la borraste, escríbenos para resolver tu compra." }, { status: 404 });
  if (rowA.time_unknown || rowB.time_unknown) return NextResponse.json({ error: "Las dos cartas necesitan hora de nacimiento para calcular las casas superpuestas." }, { status: 400 });

  const claimed = await claimPurchase(purchase.id, user.id);
  if (!claimed) return NextResponse.json({ error: "Esta lectura ya se está generando. Espera unos minutos y recarga la página." }, { status: 409 });

  const admin = createServiceClient();
  if (!admin) {
    await releasePurchase(purchase.id);
    return NextResponse.json({ error: "La base de datos no está conectada." }, { status: 503 });
  }

  // Cálculo de esta compra: si ya existe se reutiliza; si ya tiene lectura, se entrega y se cierra la compra.
  const { data: existing } = await admin.from("synastries").select(SYNASTRY_COLUMNS).eq("purchase_id", purchase.id).maybeSingle();
  let synastry = (existing as SynastryRow | null) ?? null;
  if (synastry?.reading) {
    await finishPurchase(purchase.id);
    return plain(synastry.reading);
  }
  if (!synastry) {
    const { data: inserted, error } = await admin
      .from("synastries")
      .insert({ user_id: user.id, chart_a_id: chartAId, chart_b_id: chartBId, relationship_type: relationship, engine_version: ENGINE_VERSION, purchase_id: purchase.id })
      .select(SYNASTRY_COLUMNS)
      .single();
    if (error || !inserted) {
      await releasePurchase(purchase.id);
      return NextResponse.json({ error: "No se ha podido calcular la sinastría. Inténtalo de nuevo: tu compra sigue disponible." }, { status: 500 });
    }
    synastry = inserted as SynastryRow;
  }

  const saved = synastry;
  const facts = synastryFactsText(rowA, rowB, computeSynastryData(rowA, rowB), relationship);
  return streamPurchasedReading({
    system: synastrySystemPrompt(facts),
    instructions: SYNASTRY_INSTRUCTIONS,
    maxTokens: MAX_TOKENS,
    headers: { "x-lectura-id": saved.id },
    save: async (text) => {
      const { error } = await admin.from("synastries").update({ reading: text, reading_model: MODELS.main }).eq("id", saved.id);
      if (error) throw new Error("no se pudo guardar");
      await finishPurchase(purchase.id);
    },
    release: () => releasePurchase(purchase.id),
  });
}
