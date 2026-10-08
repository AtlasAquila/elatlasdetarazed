import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { birthSummary, chartFromRow, FREE_CHART_LIMIT, listMyCharts, PREMIUM_CHART_LIMIT } from "@/lib/charts";
import { BODY_LABELS, SIGN_NAMES, g } from "@/lib/engine/labels";
import { createClient, getSession } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Tu carta natal",
  description: "Calcula tu carta natal con precisión astronómica: planetas, casas, aspectos, Quirón, Lilith y estrellas fijas.",
};

export default async function CartaPage() {
  const session = await getSession();

  if (!session) {
    return (
      <section className="hero">
        <div className="container">
          <div>
            <p className="kicker">Tus cartas</p>
            <h1>Tu carta natal</h1>
            <p className="lead">Calcula aquí tu carta natal y obtén una lectura completa de todas las influencias del cielo en tu nacimiento.</p>
            <div className="actions" style={{ marginTop: 32 }}>
              <Link href="/registro" className="btn btn-primary">
                Crea tu cuenta gratis
              </Link>
              <Link href="/entrar?siguiente=/carta" className="btn btn-ghost">
                Ya tengo cuenta
              </Link>
            </div>
          </div>
          <div className="hero-art">
            <Image src="/rueda-zodiacal.png" width={400} height={400} alt="" aria-hidden="true" priority style={{ height: "auto" }} />
          </div>
        </div>
      </section>
    );
  }

  const charts = await listMyCharts();
  const supabase = await createClient();
  const { data: profile } = supabase ? await supabase.from("profiles").select("plan").eq("id", session.userId).maybeSingle() : { data: null };
  const limit = profile?.plan === "premium" ? PREMIUM_CHART_LIMIT : FREE_CHART_LIMIT;
  const canCreate = charts.length < limit;

  return (
    <section className="hero">
      <div className="container">
        <p className="kicker">Tus cartas</p>
        <h1>Tu carta natal</h1>
        <p className="lead">Calcula aquí tu carta natal y obtén una lectura completa de todas las influencias del cielo en tu nacimiento.</p>
        <div className="actions" style={{ margin: "24px 0 40px", alignItems: "center" }}>
          {canCreate ? (
            <Link href="/carta/nueva" className="btn btn-primary">
              Nueva carta
            </Link>
          ) : (
            <span className="notice">Has llegado al máximo de cartas de tu plan. Borra alguna para crear otra.</span>
          )}
          <span className="muted small">
            {charts.length} de {limit} cartas guardadas.
          </span>
        </div>
        {charts.length === 0 ? (
          <div className="panel">
            <h3>Empieza por la tuya</h3>
            <p className="muted" style={{ marginBottom: 0 }}>
              Necesitas la fecha, la hora y el lugar de nacimiento. La hora exacta importa: el Ascendente cambia de grado cada cuatro minutos.
            </p>
          </div>
        ) : (
          <div className="grid-3">
            {charts.map((row) => {
              const chart = chartFromRow(row);
              const sun = chart.bodies.find((b) => b.id === "sun")!;
              const moon = chart.bodies.find((b) => b.id === "moon")!;
              return (
                <Link key={row.id} href={`/carta/${row.id}`} className="card card-link">
                  {row.is_self && <span className="tag">Mi carta</span>}
                  <h3>{row.name}</h3>
                  <p className="muted small">{birthSummary(row)}</p>
                  <p className="small" style={{ marginBottom: 0 }}>
                    <span className="glyph-font" style={{ color: "var(--oro)" }}>{g(BODY_LABELS.sun.glyph)}</span> {SIGN_NAMES[sun.sign]} ·{" "}
                    <span className="glyph-font" style={{ color: "var(--oro)" }}>{g(BODY_LABELS.moon.glyph)}</span> {SIGN_NAMES[moon.sign]}
                    {chart.angles && <> · AC {SIGN_NAMES[Math.floor(chart.angles.asc / 30)]}</>}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
