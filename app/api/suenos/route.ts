import { NextResponse, type NextRequest } from "next/server";
import { AiError, MODELS, aiConfigured, streamText } from "@/lib/ai/anthropic";
import { DREAM_INSTRUCTIONS, dreamSystemPrompt } from "@/lib/ai/prompts";
import { extractDream } from "@/lib/dreams-ai";
import { CHART_COLUMNS, birthSummary, chartFromRow, type ChartRow } from "@/lib/charts";
import { DREAMS_ENABLED, DREAM_COLUMNS, DREAM_LIMITS, dreamMemoryText, type DreamRow } from "@/lib/dreams";
import { chartFactsText } from "@/lib/engine/analysis";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 180;

const UUID = /^[0-9a-f-]{36}$/i;

export async function POST(request: NextRequest) {
  if (!DREAMS_ENABLED) return NextResponse.json({ error: "El diario de sueños no está disponible." }, { status: 404 });
  const { dreamId } = (await request.json().catch(() => ({}))) as { dreamId?: string };
  if (!dreamId || !UUID.test(dreamId)) return NextResponse.json({ error: "Petición no válida." }, { status: 400 });

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "La base de datos no está conectada." }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Tu sesión ha caducado. Vuelve a entrar." }, { status: 401 });

  const { data: row } = await supabase.from("dreams").select(DREAM_COLUMNS).eq("id", dreamId).maybeSingle();
  if (!row) return NextResponse.json({ error: "No encontramos ese sueño." }, { status: 404 });
  const dream = row as DreamRow;
  if (dream.interpretation) return new Response(dream.interpretation, { headers: { "content-type": "text/plain; charset=utf-8" } });

  // Límite mensual de interpretaciones (mes natural en España).
  const monthStart = new Date(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit" }).format(new Date()) + "-01T00:00:00+01:00");
  const { count } = await supabase.from("dreams").select("id", { count: "exact", head: true }).gte("interpreted_at", monthStart.toISOString());
  if ((count ?? 0) >= DREAM_LIMITS.interpretationsPerMonth) {
    return NextResponse.json({ error: `Has llegado a las ${DREAM_LIMITS.interpretationsPerMonth} interpretaciones de este mes. Se renuevan el día 1.` }, { status: 402 });
  }

  if (!aiConfigured()) return NextResponse.json({ error: "Las interpretaciones aún no están activadas." }, { status: 503 });

  // Memoria: los sueños anteriores ya interpretados (resumen, símbolos y emociones).
  const { data: prev } = await supabase
    .from("dreams")
    .select(DREAM_COLUMNS)
    .neq("id", dream.id)
    .not("summary", "is", null)
    .lte("dream_date", dream.dream_date)
    .order("dream_date", { ascending: false })
    .limit(DREAM_LIMITS.memoryDreams);
  const previous = ((prev as DreamRow[] | null) ?? []).reverse();

  let chartText = "";
  if (dream.chart_id) {
    const { data: c } = await supabase.from("charts").select(CHART_COLUMNS).eq("id", dream.chart_id).maybeSingle();
    if (c) {
      const cr = c as ChartRow;
      chartText = chartFactsText(chartFromRow(cr), cr.name, birthSummary(cr));
    }
  }

  const context = [
    `SUEÑO DE HOY (${dream.dream_date})${dream.recurring ? " · la persona dice que es un sueño recurrente" : ""}`,
    dream.title ? `Título que le ha dado: ${dream.title}` : "",
    dream.emotions.length ? `Emociones que ha marcado: ${dream.emotions.join(", ")}` : "Emociones: no ha marcado ninguna",
    `Relato:\n${dream.content}`,
    "",
    previous.length ? `SUEÑOS ANTERIORES DE SU DIARIO (del más antiguo al más reciente)\n${dreamMemoryText(previous)}` : "SUEÑOS ANTERIORES: ninguno todavía.",
    "",
    chartText ? `CARTA NATAL DE QUIEN SUEÑA\n${chartText}` : "CARTA NATAL: no se ha indicado.",
  ]
    .join("\n");

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const { text, stopReason } = await streamText(
          { model: MODELS.main, system: dreamSystemPrompt(context), messages: [{ role: "user", content: DREAM_INSTRUCTIONS }], maxTokens: 3500 },
          (chunk) => controller.enqueue(encoder.encode(chunk)),
        );
        if (text.trim() && stopReason !== "max_tokens") {
          const extracted = await extractDream(`${dream.title ? dream.title + "\n" : ""}${dream.content}`);
          await supabase
            .from("dreams")
            .update({ interpretation: text.trim(), interpreted_at: new Date().toISOString(), summary: extracted.summary, symbols: extracted.symbols })
            .eq("id", dream.id);
        }
      } catch (e) {
        const msg = e instanceof AiError && e.status === 429 ? "Hay mucha demanda en este momento. Inténtalo de nuevo en un minuto." : "No se ha podido completar la interpretación. Inténtalo de nuevo.";
        controller.enqueue(encoder.encode(`\n\n[[ERROR]] ${msg}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}
