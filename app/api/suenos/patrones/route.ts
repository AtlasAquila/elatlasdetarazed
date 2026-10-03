import { NextResponse } from "next/server";
import { AiError, MODELS, aiConfigured, streamText } from "@/lib/ai/anthropic";
import { DREAM_PATTERNS_INSTRUCTIONS, dreamSystemPrompt } from "@/lib/ai/prompts";
import { CHART_COLUMNS, birthSummary, chartFromRow, type ChartRow } from "@/lib/charts";
import { DREAMS_ENABLED, DREAM_COLUMNS, DREAM_LIMITS, dreamMemoryText, symbolCounts, type DreamRow } from "@/lib/dreams";
import { chartFactsText } from "@/lib/engine/analysis";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST() {
  if (!DREAMS_ENABLED) return NextResponse.json({ error: "El diario de sueños no está disponible." }, { status: 404 });
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "La base de datos no está conectada." }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Tu sesión ha caducado. Vuelve a entrar." }, { status: 401 });

  const { data: rows } = await supabase.from("dreams").select(DREAM_COLUMNS).not("summary", "is", null).order("dream_date", { ascending: true }).order("created_at", { ascending: true }).limit(150);
  const dreams = (rows as DreamRow[] | null) ?? [];
  if (dreams.length < DREAM_LIMITS.minForPatterns) {
    return NextResponse.json({ error: `Necesitas al menos ${DREAM_LIMITS.minForPatterns} sueños interpretados para ver patrones.` }, { status: 400 });
  }
  const lastDreamAt = dreams.reduce((m, d) => (d.interpreted_at && d.interpreted_at > m ? d.interpreted_at : m), dreams[0].interpreted_at ?? dreams[0].created_at);

  const { data: existing } = await supabase.from("dream_patterns").select("content, dream_count, last_dream_at").eq("user_id", user.id).maybeSingle();
  if (existing && existing.dream_count === dreams.length && new Date(existing.last_dream_at).getTime() === new Date(lastDreamAt).getTime()) {
    return new Response(existing.content, { headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  if (!aiConfigured()) return NextResponse.json({ error: "Los análisis aún no están activados." }, { status: 503 });

  // Carta: la más usada en los sueños o, si no, la propia.
  const chartUse = new Map<string, number>();
  for (const d of dreams) if (d.chart_id) chartUse.set(d.chart_id, (chartUse.get(d.chart_id) ?? 0) + 1);
  const topChart = [...chartUse.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  let chartText = "";
  const chartQuery = topChart ? supabase.from("charts").select(CHART_COLUMNS).eq("id", topChart) : supabase.from("charts").select(CHART_COLUMNS).eq("is_self", true);
  const { data: c } = await chartQuery.limit(1).maybeSingle();
  if (c) {
    const cr = c as ChartRow;
    chartText = chartFactsText(chartFromRow(cr), cr.name, birthSummary(cr));
  }

  const counts = symbolCounts(dreams)
    .filter(([, n]) => n > 1)
    .slice(0, 25)
    .map(([s, n]) => `${s} (${n})`)
    .join(", ");
  const context = [
    `DIARIO DE SUEÑOS: ${dreams.length} sueños, del ${dreams[0].dream_date} al ${dreams[dreams.length - 1].dream_date}`,
    `Símbolos repetidos (número de sueños): ${counts || "ninguno se repite todavía"}`,
    "",
    dreamMemoryText(dreams),
    "",
    chartText ? `CARTA NATAL DE QUIEN SUEÑA\n${chartText}` : "CARTA NATAL: no se ha indicado.",
  ].join("\n");

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const { text, stopReason } = await streamText(
          { model: MODELS.main, system: dreamSystemPrompt(context), messages: [{ role: "user", content: DREAM_PATTERNS_INSTRUCTIONS }], maxTokens: 4000 },
          (chunk) => controller.enqueue(encoder.encode(chunk)),
        );
        if (text.trim() && stopReason !== "max_tokens") {
          await supabase.from("dream_patterns").upsert({ user_id: user.id, content: text.trim(), dream_count: dreams.length, last_dream_at: lastDreamAt, model: MODELS.main, created_at: new Date().toISOString() });
        }
      } catch (e) {
        const msg = e instanceof AiError && e.status === 429 ? "Hay mucha demanda en este momento. Inténtalo de nuevo en un minuto." : "No se ha podido completar el análisis. Inténtalo de nuevo.";
        controller.enqueue(encoder.encode(`\n\n[[ERROR]] ${msg}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}
