import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";
import { RichText } from "@/components/RichText";
import { getMyChart } from "@/lib/charts";
import { climatePeriodLabel, getClimate } from "@/lib/clima/personal";
import { getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Clima astral personalizado" };

type Props = { params: Promise<{ id: string; climaId: string }> };

export default async function PastClimatePage({ params }: Props) {
  const session = await getSession();
  const { id, climaId } = await params;
  if (!session) redirect(`/entrar?siguiente=/carta/${id}/clima/${climaId}`);

  const [row, climate] = await Promise.all([getMyChart(id), getClimate(climaId)]);
  if (!row || !climate || climate.chart_id !== id) notFound();

  return (
    <section className="hero">
      <div className="container reading">
        <Link href={`/carta/${id}/clima`} className="small">
          ← Clima astral de {row.name}
        </Link>
        <p className="kicker" style={{ marginTop: 24 }}>
          Clima astral personalizado · del {climatePeriodLabel(climate)}
        </p>
        <div className="print-row">
          <PrintButton />
        </div>
        <RichText text={climate.content} />
        <p className="small muted" style={{ marginTop: 24 }}>
          Lectura orientativa, generada con inteligencia artificial a partir de los cálculos de tu carta.
        </p>
      </div>
    </section>
  );
}
