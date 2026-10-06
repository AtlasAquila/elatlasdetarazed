import { NextResponse, type NextRequest } from "next/server";
import { MODELS, aiConfigured } from "@/lib/ai/anthropic";
import { SOLAR_RETURN_INSTRUCTIONS, solarReturnSystemPrompt } from "@/lib/ai/prompts";
import { streamPurchasedReading } from "@/lib/ai/stream-reading";
import { CHART_COLUMNS, type ChartRow } from "@/lib/charts";
import { ENGINE_VERSION, computeSolarReturn } from "@/lib/engine";
import { claimPurchase, findUsablePurchase, finishPurchase, getMyPurchase, releasePurchase } from "@/lib/purchases";
import { SOLAR_RETURN_COLUMNS, natalSunLongitude, solarReturnFactsText, type SolarReturnRow } from "@/lib/solar-returns";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
// Lectura de unas 5.000 palabras: entre dos y tres minutos.
export const maxDuration = 300;

const MAX_TOKENS = 16000;
const UUID = /^[0-9a-f-]{36}$/i;
const plain = (text: string) => new Response(text, { headers: { "content-type": "text/plain; charset=utf-8" } });

/**
 * Calcula la revolución solar de una compra pagada y sin usar y escribe su lectura. Los datos
 * (año y lugar) son los que se dieron al comprar. Si el cálculo ya existe pero la lectura no se
 * completó, se reutiliza el cálculo y solo se vuelve a escribir la lectura.
 */
export async function POST(request: NextRequest) {
  const { chartId, purchaseId } = (await request.json().catch(() => ({}))) as { chartId?: string; purchaseId?: string };
  if (!chartId || !UUID.test(chartId)) return NextResponse.json({ error: "Petición no válida." }, { status: 400 });

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "La base de datos no está conectada." }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Tu sesión ha caducado. Vuelve a entrar." }, { status: 401 });

  const { data: row } = await supabase.from("charts").select(CHART_COLUMNS).eq("id", chartId).maybeSingle();
  if (!row) return NextResponse.json({ error: "No encontramos esa carta." }, { status: 404 });
  const natalRow = row as ChartRow;
  if (natalRow.time_unknown) return NextResponse.json({ error: "Esta carta no tiene hora de nacimiento, así que no se puede calcular la revolución solar." }, { status: 400 });

  if (!aiConfigured()) return NextResponse.json({ error: "Las lecturas aún no están activadas." }, { status: 503 });

  const purchase = purchaseId ? await getMyPurchase(purchaseId) : await findUsablePurchase("revolucion", { chart_id: chartId });
  if (!purchase || purchase.product !== "revolucion" || purchase.status !== "paid" || purchase.params.chart_id !== chartId) {
    return NextResponse.json({ error: "Para leer tu revolución solar necesitas comprar la lectura." }, { status: 402 });
  }
  const claimed = await claimPurchase(purchase.id, user.id);
  if (!claimed) return NextResponse.json({ error: "Esta lectura ya se está generando. Espera unos minutos y recarga la página." }, { status: 409 });

  const admin = createServiceClient();
  if (!admin) {
    await releasePurchase(purchase.id);
    return NextResponse.json({ error: "La base de datos no está conectada." }, { status: 503 });
  }

  // Cálculo de esta compra: si ya existe se reutiliza; si ya tiene lectura, se entrega y se cierra la compra.
  const { data: existing } = await admin.from("solar_returns").select(SOLAR_RETURN_COLUMNS).eq("purchase_id", purchase.id).maybeSingle();
  let sr = (existing as SolarReturnRow | null) ?? null;
  if (sr?.reading) {
    await finishPurchase(purchase.id);
    return plain(sr.reading);
  }

  if (!sr) {
    try {
      const year = Number(purchase.params.year);
      const latitude = Number(purchase.params.latitude);
      const longitude = Number(purchase.params.longitude);
      const [, birthMonth, birthDay] = natalRow.birth_date.split("-").map(Number);
      const chart = computeSolarReturn({ natalSunLongitude: natalSunLongitude(natalRow), year, birthMonth, birthDay, latitude, longitude, houseSystem: "placidus" });
      const { data: inserted, error } = await admin
        .from("solar_returns")
        .insert({
          chart_id: chartId,
          user_id: user.id,
          year,
          place_name: String(purchase.params.place_name),
          latitude,
          longitude,
          time_zone: String(purchase.params.time_zone),
          house_system: "placidus",
          engine_version: ENGINE_VERSION,
          return_utc: chart.utc,
          purchase_id: purchase.id,
        })
        .select(SOLAR_RETURN_COLUMNS)
        .single();
      if (error || !inserted) throw new Error("no se pudo guardar");
      sr = inserted as SolarReturnRow;
    } catch {
      await releasePurchase(purchase.id);
      return NextResponse.json({ error: "No se ha podido calcular la revolución solar. Inténtalo de nuevo: tu compra sigue disponible." }, { status: 500 });
    }
  }

  const solarReturn = sr;
  const facts = solarReturnFactsText(natalRow, solarReturn);
  return streamPurchasedReading({
    system: solarReturnSystemPrompt(facts),
    instructions: SOLAR_RETURN_INSTRUCTIONS,
    maxTokens: MAX_TOKENS,
    headers: { "x-lectura-id": solarReturn.id },
    save: async (text) => {
      const { error } = await admin.from("solar_returns").update({ reading: text, reading_model: MODELS.main }).eq("id", solarReturn.id);
      if (error) throw new Error("no se pudo guardar");
      await finishPurchase(purchase.id);
    },
    release: () => releasePurchase(purchase.id),
  });
}
