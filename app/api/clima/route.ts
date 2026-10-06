import { NextResponse, type NextRequest } from "next/server";
import { AiError, MODELS, aiConfigured, streamText } from "@/lib/ai/anthropic";
import { CLIMATE_INSTRUCTIONS, climateSystemPrompt } from "@/lib/ai/prompts";
import { CHART_COLUMNS, birthSummary, chartFromRow, type ChartRow } from "@/lib/charts";
import { activeClimate } from "@/lib/clima/personal";
import { climateFactsText } from "@/lib/clima/facts";
import { computeClimate } from "@/lib/clima/transitos";
import { ENGINE_VERSION } from "@/lib/engine";
import { claimPurchase, findUsablePurchase, finishPurchase, releasePurchase } from "@/lib/purchases";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
// Lectura de unas 5.000 palabras: entre dos y tres minutos.
export const maxDuration = 300;

const MAX_TOKENS = 16000;
const UUID = /^[0-9a-f-]{36}$/i;
const plain = (text: string) => new Response(text, { headers: { "content-type": "text/plain; charset=utf-8" } });

/**
 * Genera el clima astral personal de una carta con una compra pagada y sin usar. El periodo
 * empieza ahora. Si la carta ya tiene un clima vigente, lo devuelve sin gastar nada.
 */
export async function POST(request: NextRequest) {
  const { chartId } = (await request.json().catch(() => ({}))) as { chartId?: string };
  if (!chartId || !UUID.test(chartId)) return NextResponse.json({ error: "Petición no válida." }, { status: 400 });

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "La base de datos no está conectada." }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Tu sesión ha caducado. Vuelve a entrar." }, { status: 401 });

  const { data: row } = await supabase.from("charts").select(CHART_COLUMNS).eq("id", chartId).maybeSingle();
  if (!row) return NextResponse.json({ error: "No encontramos esa carta." }, { status: 404 });
  const chartRow = row as ChartRow;

  const active = await activeClimate(chartId);
  if (active) return plain(active.content);

  if (!aiConfigured()) return NextResponse.json({ error: "Las lecturas aún no están activadas." }, { status: 503 });

  const purchase = await findUsablePurchase("clima", { chart_id: chartId });
  if (!purchase) return NextResponse.json({ error: "Para leer tu clima astral personal necesitas comprar la lectura." }, { status: 402 });
  const claimed = await claimPurchase(purchase.id, user.id);
  if (!claimed) return NextResponse.json({ error: "Esta lectura ya se está generando. Espera unos minutos y recarga la página." }, { status: 409 });

  const admin = createServiceClient();
  if (!admin) {
    await releasePurchase(purchase.id);
    return NextResponse.json({ error: "La base de datos no está conectada." }, { status: 503 });
  }

  // Reintento tras un corte: si la lectura de esta compra ya se guardó, se entrega y se cierra la compra.
  const { data: saved } = await admin.from("monthly_climates").select("content").eq("purchase_id", purchase.id).maybeSingle();
  if (saved) {
    await finishPurchase(purchase.id);
    return plain(saved.content as string);
  }

  const chart = chartFromRow(chartRow);
  const data = computeClimate(chart, new Date());
  const facts = climateFactsText(chart, chartRow.name, birthSummary(chartRow), data);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let stored = false;
      try {
        const { text, stopReason } = await streamText(
          {
            model: MODELS.main,
            system: climateSystemPrompt(facts),
            messages: [{ role: "user", content: CLIMATE_INSTRUCTIONS }],
            maxTokens: MAX_TOKENS,
          },
          (chunk) => controller.enqueue(encoder.encode(chunk)),
        );
        if (!text.trim() || stopReason === "max_tokens") throw new Error("incompleta");
        const { error } = await admin.from("monthly_climates").insert({
          chart_id: chartId,
          user_id: user.id,
          purchase_id: purchase.id,
          starts_at: new Date(data.startMs).toISOString(),
          ends_at: new Date(data.endMs).toISOString(),
          requested_ends_at: new Date(data.requestedEndMs).toISOString(),
          content: text.trim(),
          engine_version: ENGINE_VERSION,
          model: MODELS.main,
        });
        if (error) throw new Error("no se pudo guardar");
        stored = true;
        await finishPurchase(purchase.id);
      } catch (e) {
        // La lectura no se ha guardado: la compra no se gasta y se puede reintentar sin pagar otra vez.
        if (!stored) await releasePurchase(purchase.id).catch(() => {});
        const msg =
          e instanceof AiError && e.status === 429
            ? "Hay mucha demanda en este momento. Inténtalo de nuevo en un minuto; no se te ha cobrado otra vez."
            : "No se ha podido completar la lectura. Inténtalo de nuevo: tu compra sigue disponible y no se cobrará otra vez.";
        controller.enqueue(encoder.encode(`\n\n[[ERROR]] ${msg}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}
