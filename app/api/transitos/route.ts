import { NextResponse, type NextRequest } from "next/server";
import { eventSummary } from "@/lib/avisos";
import { AiError, MODELS, aiConfigured, streamText } from "@/lib/ai/anthropic";
import { TRANSIT_REPORT_INSTRUCTIONS, transitReportSystemPrompt } from "@/lib/ai/prompts";
import { isAppRequest } from "@/lib/app-mode";
import { CHART_COLUMNS, type ChartRow } from "@/lib/charts";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { eventFactsText, findEvent, getReport } from "@/lib/transitos-reportes";

export const runtime = "nodejs";
export const maxDuration = 60;

const UUID = /^[0-9a-f-]{36}$/i;
const KEY = /^[a-z0-9.]{8,120}$/;
/** Reportes nuevos que puede generar una persona al día (cada uno cuesta una llamada a la IA). */
const DAILY_LIMIT = 6;
const plain = (text: string) => new Response(text, { headers: { "content-type": "text/plain; charset=utf-8" } });

/** Escribe (y guarda) el reporte de un evento sobre una carta. Si ya existe, lo devuelve sin gastar nada. */
export async function POST(request: NextRequest) {
  const { chartId, key } = (await request.json().catch(() => ({}))) as { chartId?: string; key?: string };
  if (!chartId || !UUID.test(chartId) || !key || !KEY.test(key)) return NextResponse.json({ error: "Petición no válida." }, { status: 400 });

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "La base de datos no está conectada." }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Tu sesión ha caducado. Vuelve a entrar." }, { status: 401 });

  const { data: row } = await supabase.from("charts").select(CHART_COLUMNS).eq("id", chartId).maybeSingle();
  if (!row) return NextResponse.json({ error: "No encontramos esa carta." }, { status: 404 });
  const chartRow = row as ChartRow;

  const saved = await getReport(chartId, key);
  if (saved) return plain(saved.content);

  // La IA de los tránsitos es de la app (gratuita para los testers); en la web solo la usan los administradores.
  if (!(await isAppRequest())) {
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
    if (!profile?.is_admin) return NextResponse.json({ error: "Los reportes de tránsito están en la app." }, { status: 403 });
  }
  if (!aiConfigured()) return NextResponse.json({ error: "Los reportes aún no están activados." }, { status: 503 });

  const found = findEvent(chartRow, key);
  if (!found) return NextResponse.json({ error: "Ese tránsito ya no está disponible." }, { status: 404 });

  const admin = createServiceClient();
  if (!admin) return NextResponse.json({ error: "La base de datos no está conectada." }, { status: 503 });
  const since = new Date(Date.now() - 24 * 3_600_000).toISOString();
  const { count } = await admin.from("transit_reports").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since);
  if ((count ?? 0) >= DAILY_LIMIT) return NextResponse.json({ error: "Hoy ya has abierto varios reportes nuevos. Vuelve mañana para el siguiente." }, { status: 429 });

  const { event, data } = found;
  const system = transitReportSystemPrompt(eventFactsText(chartRow, event, data));
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const { text, stopReason } = await streamText({ model: MODELS.main, system, messages: [{ role: "user", content: TRANSIT_REPORT_INSTRUCTIONS }], maxTokens: 2000 }, (chunk) => controller.enqueue(encoder.encode(chunk)));
        if (!text.trim() || stopReason === "max_tokens") throw new Error("incompleto");
        const { error } = await admin.from("transit_reports").insert({
          chart_id: chartId,
          user_id: user.id,
          event_key: key,
          event_at: new Date(event.at).toISOString(),
          title: eventSummary(event),
          content: text.trim(),
          model: MODELS.main,
        });
        // Si dos pestañas lo piden a la vez, gana la primera: no es un fallo.
        if (error && error.code !== "23505") throw new Error("no se pudo guardar");
      } catch (e) {
        const msg = e instanceof AiError && e.status === 429 ? "Hay mucha demanda en este momento. Inténtalo de nuevo en un minuto." : "No se ha podido escribir el reporte. Inténtalo de nuevo.";
        controller.enqueue(encoder.encode(`\n\n[[ERROR]] ${msg}`));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}
