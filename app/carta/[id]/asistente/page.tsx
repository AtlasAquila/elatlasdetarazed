import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AssistantChat } from "@/components/AssistantChat";
import { aiConfigured } from "@/lib/ai/anthropic";
import { birthSummary, getMyChart } from "@/lib/charts";
import { createClient, getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Asistente astrológico" };

type Props = { params: Promise<{ id: string }> };

export default async function AsistentePage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/entrar?siguiente=/carta/${id}/asistente`);
  const row = await getMyChart(id);
  if (!row) notFound();

  const supabase = await createClient();
  let messages: { role: "user" | "assistant"; content: string }[] = [];
  let remaining = 0;
  let isPremium = false;
  if (supabase) {
    const { data: conv } = await supabase.from("conversations").select("id").eq("chart_id", id).maybeSingle();
    if (conv) {
      const { data } = await supabase.from("messages").select("role, content").eq("conversation_id", conv.id).order("created_at", { ascending: true });
      messages = (data ?? []) as typeof messages;
    }
    const { data: status } = await supabase.rpc("question_status").maybeSingle<{ plan: string; remaining: number }>();
    remaining = status?.remaining ?? 0;
    isPremium = status?.plan === "premium";
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
        <AssistantChat chartId={id} chartName={row.name} initial={messages} remaining={remaining} isPremium={isPremium} enabled={aiConfigured()} />
      </div>
    </section>
  );
}
