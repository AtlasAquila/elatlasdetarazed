import { NextResponse, type NextRequest } from "next/server";
import { AiError, MODELS, aiConfigured, streamText } from "@/lib/ai/anthropic";
import { NUMEROLOGY_CHART_INSTRUCTIONS, NUMEROLOGY_COMPAT_INSTRUCTIONS, NUMEROLOGY_READING_INSTRUCTIONS, numerologySystemPrompt } from "@/lib/ai/prompts";
import { CHART_COLUMNS, birthSummary, chartFromRow, type ChartRow } from "@/lib/charts";
import { chartFactsText } from "@/lib/engine/analysis";
import { computeNumerology, numerologyFactsText } from "@/lib/numerology";
import { PERSON_COLUMNS, type PersonRow } from "@/lib/people";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
// Lecturas de 1.500–2.400 palabras: entre uno y dos minutos.
export const maxDuration = 300;

const MAX_TOKENS = 9000;
const UUID = /^[0-9a-f-]{36}$/i;

type Body = { kind?: string; personId?: string; otherId?: string; chartId?: string };

const facts = (p: PersonRow) =>
  numerologyFactsText({ fullName: p.full_name, currentName: p.current_name, birthDate: p.birth_date, label: p.is_self ? "es el propio usuario" : p.label }, computeNumerology(p.full_name, p.birth_date, p.current_name));

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Body;
  const kind = body.kind;
  if ((kind !== "lectura" && kind !== "compatibilidad" && kind !== "carta") || !body.personId || !UUID.test(body.personId)) {
    return NextResponse.json({ error: "Petición no válida." }, { status: 400 });
  }
  if (kind === "compatibilidad" && (!body.otherId || !UUID.test(body.otherId) || body.otherId === body.personId)) return NextResponse.json({ error: "Elige con quién comparar." }, { status: 400 });
  if (kind === "carta" && (!body.chartId || !UUID.test(body.chartId))) return NextResponse.json({ error: "Elige una carta natal." }, { status: 400 });

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "La base de datos no está conectada." }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Tu sesión ha caducado. Vuelve a entrar." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("plan, is_admin").eq("id", user.id).maybeSingle();
  if (profile?.plan !== "premium" && !profile?.is_admin) {
    return NextResponse.json({ error: "Las lecturas numerológicas forman parte de Premium." }, { status: 402 });
  }

  const ids = kind === "compatibilidad" ? [body.personId, body.otherId!].sort() : [body.personId];
  const { data: rows } = await supabase.from("numerology_people").select(PERSON_COLUMNS).in("id", ids);
  const people = (rows as PersonRow[] | null) ?? [];
  if (people.length !== ids.length) return NextResponse.json({ error: "No encontramos a esa persona." }, { status: 404 });
  const byId = new Map(people.map((p) => [p.id, p]));

  // Clave de la lectura guardada. La compatibilidad se guarda con el par ordenado, sea cual sea la ficha desde la que se pide.
  const key = {
    kind,
    person_id: ids[0],
    other_person_id: kind === "compatibilidad" ? ids[1] : null,
    chart_id: kind === "carta" ? body.chartId! : null,
  };
  let existingQuery = supabase.from("numerology_readings").select("content").eq("kind", kind).eq("person_id", key.person_id);
  existingQuery = key.other_person_id ? existingQuery.eq("other_person_id", key.other_person_id) : existingQuery.is("other_person_id", null);
  existingQuery = key.chart_id ? existingQuery.eq("chart_id", key.chart_id) : existingQuery.is("chart_id", null);
  const { data: existing } = await existingQuery.maybeSingle();
  if (existing) return new Response(existing.content, { headers: { "content-type": "text/plain; charset=utf-8" } });

  if (!aiConfigured()) return NextResponse.json({ error: "Las lecturas aún no están activadas." }, { status: 503 });

  let data: string;
  let instructions: string;
  if (kind === "lectura") {
    data = facts(byId.get(ids[0])!);
    instructions = NUMEROLOGY_READING_INSTRUCTIONS;
  } else if (kind === "compatibilidad") {
    data = `PRIMERA PERSONA\n${facts(byId.get(ids[0])!)}\n\nSEGUNDA PERSONA\n${facts(byId.get(ids[1])!)}`;
    instructions = NUMEROLOGY_COMPAT_INSTRUCTIONS;
  } else {
    const { data: chartRow } = await supabase.from("charts").select(CHART_COLUMNS).eq("id", body.chartId!).maybeSingle();
    if (!chartRow) return NextResponse.json({ error: "No encontramos esa carta." }, { status: 404 });
    const row = chartRow as ChartRow;
    data = `NÚMEROS\n${facts(byId.get(ids[0])!)}\n\n${chartFactsText(chartFromRow(row), row.name, birthSummary(row))}`;
    instructions = NUMEROLOGY_CHART_INSTRUCTIONS;
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const { text, stopReason } = await streamText(
          { model: MODELS.main, system: numerologySystemPrompt(data), messages: [{ role: "user", content: instructions }], maxTokens: MAX_TOKENS },
          (chunk) => controller.enqueue(encoder.encode(chunk)),
        );
        if (text.trim() && stopReason !== "max_tokens") {
          await supabase.from("numerology_readings").insert({ ...key, user_id: user.id, content: text.trim(), model: MODELS.main });
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
