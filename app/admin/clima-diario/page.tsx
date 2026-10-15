import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClimaDiarioEditor } from "@/components/ClimaDiarioEditor";
import { climaDayLabel, todayInMadrid, type ClimaDia } from "@/lib/clima-diario";
import { createClient, getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Clima diario" };

export default async function ClimaDiarioAdminPage() {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/cuenta");
  const supabase = await createClient();
  if (!supabase) redirect("/");
  const { data } = await supabase.from("clima_diario").select("day, icon, headline, tags, body, closing").order("day", { ascending: false }).limit(21);
  const readings = (data as ClimaDia[] | null) ?? [];
  const today = todayInMadrid();

  return (
    <section className="hero">
      <div className="container reading">
        <Link href="/admin" className="small">
          ← Panel
        </Link>
        <p className="kicker" style={{ marginTop: 24 }}>
          Panel de publicación
        </p>
        <h1>Clima diario</h1>
        <p className="lead">Las lecturas se escriben solas cada día y se ven en la web y en la app a partir de su día. Aquí puedes corregir una o retirarla.</p>

        {readings.length === 0 && <p className="muted">Todavía no hay lecturas.</p>}
        {readings.map((r) => (
          <details key={r.day} className="rueda-desplegable" open={r.day === today}>
            <summary>
              {r.day > today ? "Programada · " : ""}
              {climaDayLabel(r.day)}
            </summary>
            <div className="rueda-desplegable-cuerpo">
              <ClimaDiarioEditor reading={r} />
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
