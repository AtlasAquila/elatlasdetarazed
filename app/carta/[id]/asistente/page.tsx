import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AssistantChat } from "@/components/AssistantChat";
import { isAppRequest } from "@/lib/app-mode";
import { WEB_FREE_QUESTIONS, effectiveQuestionStatus, type QuestionStatus } from "@/lib/assistant-limit";
import { aiConfigured } from "@/lib/ai/anthropic";
import { birthSummary, getMyChart } from "@/lib/charts";
import { createClient, getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Asistente astrológico" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ pregunta?: string }> };

export default async function AsistentePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { pregunta } = await searchParams;
  const session = await getSession();
  if (!session) redirect(`/entrar?siguiente=${encodeURIComponent(`/carta/${id}/asistente${pregunta === "venus" || pregunta === "pluton" ? `?pregunta=${pregunta}` : ""}`)}`);
  const row = await getMyChart(id);
  if (!row) notFound();

  const supabase = await createClient();
  let messages: { role: "user" | "assistant"; content: string }[] = [];
  let remaining = 0;
  let isPremium = false;
  let freeLimit: number = WEB_FREE_QUESTIONS;
  const inApp = await isAppRequest();
  if (supabase) {
    const { data: conv } = await supabase.from("conversations").select("id").eq("chart_id", id).maybeSingle();
    if (conv) {
      const { data } = await supabase.from("messages").select("role, content").eq("conversation_id", conv.id).order("created_at", { ascending: true });
      messages = (data ?? []) as typeof messages;
    }
    const { data: raw } = await supabase.rpc("question_status").maybeSingle<QuestionStatus>();
    const status = raw ? effectiveQuestionStatus(raw, inApp) : null;
    remaining = status?.remaining ?? 0;
    isPremium = status?.plan === "premium";
    freeLimit = status && status.plan !== "premium" ? status.question_limit : WEB_FREE_QUESTIONS;
  }

  return (
    <section className="hero" style={{ paddingTop: 48 }}>
      <div className="container reading">
        <Link href={`/carta/${id}`} className="small">
          ← Carta de {row.name}
        </Link>
        <p className="kicker" style={{ marginTop: 24 }}>
          Asistente astrológico
        </p>
        <h1>Pregunta a Alshain</h1>
        <p className="muted">{birthSummary(row)}</p>
        <AssistantChat chartId={id} chartName={row.name} initial={messages} remaining={remaining} isPremium={isPremium} freeLimit={freeLimit} inApp={inApp} enabled={aiConfigured()} suggestVenus={pregunta === "venus"} suggestPluton={pregunta === "pluton"} />
      </div>
    </section>
  );
}
