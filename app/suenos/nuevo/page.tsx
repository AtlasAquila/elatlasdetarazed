import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DreamForm } from "@/components/DreamForm";
import { listMyCharts } from "@/lib/charts";
import { DREAMS_ENABLED, EMOTIONS, todayMadrid } from "@/lib/dreams";
import { getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Anotar un sueño" };

export default async function NuevoSuenoPage() {
  if (!DREAMS_ENABLED) notFound();
  const session = await getSession();
  if (!session) redirect("/entrar?siguiente=/suenos/nuevo");
  const charts = await listMyCharts();
  const own = charts.find((c) => c.is_self);

  return (
    <section className="hero">
      <div className="container reading">
        <Link href="/suenos" className="small">
          ← Tu diario de sueños
        </Link>
        <p className="kicker" style={{ marginTop: 24 }}>
          Anotar un sueño
        </p>
        <h1>¿Qué has soñado?</h1>
        <p className="lead">Escríbelo cuanto antes: los sueños se desvanecen en minutos. Alshain lo interpretará teniendo en cuenta los sueños que ya has anotado.</p>
        <div className="panel" style={{ marginTop: 24 }}>
          <DreamForm
            today={todayMadrid()}
            emotions={EMOTIONS}
            charts={charts.map((c) => ({ id: c.id, label: c.is_self ? `${c.name} (mi carta)` : c.name }))}
            defaultChart={own?.id ?? null}
          />
        </div>
        <p className="small muted" style={{ marginTop: 20 }}>
          Tus sueños son privados: solo tú puedes verlos y puedes borrarlos cuando quieras, uno a uno o el diario entero.
        </p>
      </div>
    </section>
  );
}
