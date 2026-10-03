import { NextResponse, type NextRequest } from "next/server";
import { AiError, MODELS, aiConfigured, complete, streamText, type AiMessage } from "@/lib/ai/anthropic";
import { SUMMARY_PROMPT, assistantSystemPrompt } from "@/lib/ai/prompts";
import { CHART_COLUMNS, birthSummary, chartFromRow, type ChartRow } from "@/lib/charts";
import { chartFactsText } from "@/lib/engine/analysis";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/** A partir de cuántos mensajes sin resumir se condensa la parte antigua de la conversación. */
const SUMMARIZE_AFTER = 30;
const KEEP_RECENT = 12;

export async function POST(request: NextRequest) {
  const { chartId, message } = (await request.json().catch(() => ({}))) as { chartId?: string; message?: string };
  const question = String(message ?? "").trim().slice(0, 2000);
  if (!chartId || !question) return NextResponse.json({ error: "Escribe tu pregunta." }, { status: 400 });

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "La base de datos no está conectada." }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Tu sesión ha caducado. Vuelve a entrar." }, { status: 401 });

  const { data: status } = await supabase.rpc("question_status").maybeSingle<{ plan: string; remaining: number; question_limit: number }>();
  if (!status || status.remaining <= 0) {
    const error =
      status?.plan === "premium"
        ? `Has usado tus ${status.question_limit} mensajes de este mes. Se renuevan el día 1.`
        : "Has usado tus 3 preguntas gratuitas. Con Premium puedes seguir conversando con el asistente.";
    return NextResponse.json({ error, limit: true }, { status: 402 });
  }

  if (!aiConfigured()) return NextResponse.json({ error: "El asistente aún no está activado." }, { status: 503 });

  const { data: row } = await supabase.from("charts").select(CHART_COLUMNS).eq("id", chartId).maybeSingle();
  if (!row) return NextResponse.json({ error: "No encontramos esa carta." }, { status: 404 });
  const chartRow = row as ChartRow;

  // Conversación de esta carta (se crea la primera vez).
  let { data: conv } = await supabase.from("conversations").select("id, summary, summarized_until").eq("chart_id", chartId).maybeSingle();
  if (!conv) {
    const { data: created, error } = await supabase.from("conversations").insert({ chart_id: chartId, user_id: user.id }).select("id, summary, summarized_until").single();
    if (error || !created) return NextResponse.json({ error: "No se ha podido iniciar la conversación." }, { status: 500 });
    conv = created;
  }

  let historyQuery = supabase.from("messages").select("role, content, created_at").eq("conversation_id", conv.id).order("created_at", { ascending: true });
  if (conv.summarized_until) historyQuery = historyQuery.gt("created_at", conv.summarized_until);
  const { data: history } = await historyQuery;

  const { data: readings } = await supabase.from("readings").select("kind, content").eq("chart_id", chartId);
  const reading = readings?.find((r) => r.kind === "extensa")?.content ?? readings?.find((r) => r.kind === "completa")?.content ?? readings?.find((r) => r.kind === "resumen")?.content ?? null;

  const chart = chartFromRow(chartRow);
  const facts = chartFactsText(chart, chartRow.name, birthSummary(chartRow));
  const system = assistantSystemPrompt(facts, reading, conv.summary);
  const messages: AiMessage[] = [...(history ?? []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })), { role: "user", content: question }];

  const encoder = new TextEncoder();
  const conversationId = conv.id;
  const previousSummary = conv.summary;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const { text } = await streamText({ model: MODELS.main, system, messages, maxTokens: 900, cache: true }, (chunk) => controller.enqueue(encoder.encode(chunk)));
        const answer = text.trim();
        if (answer) {
          const now = Date.now();
          await supabase.from("messages").insert([
            { conversation_id: conversationId, user_id: user.id, role: "user", content: question, created_at: new Date(now).toISOString() },
            { conversation_id: conversationId, user_id: user.id, role: "assistant", content: answer.slice(0, 12000), created_at: new Date(now + 1).toISOString() },
          ]);
          await supabase.rpc("consume_question");
          await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);

          // Memoria a largo plazo: si la conversación crece, se resume la parte antigua.
          const all = [...messages, { role: "assistant" as const, content: answer }];
          if (all.length > SUMMARIZE_AFTER && history) {
            const toSummarize = history.slice(0, history.length - KEEP_RECENT);
            if (toSummarize.length) {
              const transcript = toSummarize.map((m) => `${m.role === "user" ? "Persona" : "Alshain"}: ${m.content}`).join("\n\n");
              const summary = await complete({
                model: MODELS.light,
                system: SUMMARY_PROMPT,
                messages: [{ role: "user", content: `${previousSummary ? `Resumen previo:\n${previousSummary}\n\n` : ""}Conversación:\n${transcript}` }],
                maxTokens: 500,
              });
              await supabase
                .from("conversations")
                .update({ summary: summary.trim(), summarized_until: toSummarize[toSummarize.length - 1].created_at })
                .eq("id", conversationId);
            }
          }
        }
      } catch (e) {
        const msg = e instanceof AiError && e.status === 429 ? "Hay mucha demanda en este momento. Inténtalo de nuevo en un minuto." : "No se ha podido responder. Inténtalo de nuevo; esta pregunta no se ha descontado.";
        controller.enqueue(encoder.encode(`\n\n[[ERROR]] ${msg}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}
