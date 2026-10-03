import { NextResponse, type NextRequest } from "next/server";
import { AiError, MODELS, aiConfigured, streamText } from "@/lib/ai/anthropic";
import { READING_INSTRUCTIONS, readingSystemPrompt } from "@/lib/ai/prompts";
import { CHART_COLUMNS, birthSummary, chartFromRow, type ChartRow } from "@/lib/charts";
import { ENGINE_VERSION } from "@/lib/engine";
import { chartFactsText } from "@/lib/engine/analysis";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
// La lectura extensa (unas 3.000–3.600 palabras) tarda entre uno y tres minutos en escribirse.
export const maxDuration = 300;

/** Única lectura de la carta, disponible para todas las cuentas. */
const KIND = "extensa";
const MAX_TOKENS = 12000;

export async function POST(request: NextRequest) {
  const { chartId } = (await request.json().catch(() => ({}))) as { chartId?: string };
  if (!chartId) return NextResponse.json({ error: "Petición no válida." }, { status: 400 });

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "La base de datos no está conectada." }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Tu sesión ha caducado. Vuelve a entrar." }, { status: 401 });

  const { data: row } = await supabase.from("charts").select(CHART_COLUMNS).eq("id", chartId).maybeSingle();
  if (!row) return NextResponse.json({ error: "No encontramos esa carta." }, { status: 404 });
  const chartRow = row as ChartRow;

  const { data: existing } = await supabase.from("readings").select("content").eq("chart_id", chartId).eq("kind", KIND).maybeSingle();
  if (existing) return new Response(existing.content, { headers: { "content-type": "text/plain; charset=utf-8" } });

  if (!aiConfigured()) return NextResponse.json({ error: "Las lecturas aún no están activadas." }, { status: 503 });

  const chart = chartFromRow(chartRow);
  const facts = chartFactsText(chart, chartRow.name, birthSummary(chartRow));
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const { text, stopReason } = await streamText(
          {
            model: MODELS.main,
            system: readingSystemPrompt(facts),
            messages: [{ role: "user", content: READING_INSTRUCTIONS }],
            maxTokens: MAX_TOKENS,
          },
          (chunk) => controller.enqueue(encoder.encode(chunk)),
        );
        if (text.trim() && stopReason !== "max_tokens") {
          await supabase.from("readings").insert({
            chart_id: chartId,
            user_id: user.id,
            kind: KIND,
            content: text.trim(),
            house_system: chart.houses?.systemUsed ?? chartRow.house_system,
            engine_version: ENGINE_VERSION,
            model: MODELS.main,
          });
        }
      } catch (e) {
        const msg = e instanceof AiError && e.status === 429 ? "Hay mucha demanda en este momento. Inténtalo de nuevo en un minuto." : "No se ha podido completar la lectura. Inténtalo de nuevo.";
        controller.enqueue(encoder.encode(`\n\n[[ERROR]] ${msg}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}
