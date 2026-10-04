import type { Metadata } from "next";
import Link from "next/link";
import { CicloLunar } from "@/components/CicloLunar";
import { LiveSkyWheel } from "@/components/LiveSkyWheel";
import { CICLO_ACTUAL } from "@/lib/clima/ciclo-actual";
import { getPublishedPosts, postDateLabel } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Clima astral",
  description: "El clima astral de cada semana, por Alshain: los movimientos del cielo y lo que pueden significar para ti.",
};

export const revalidate = 300;

export default async function ClimaAstralPage() {
  const posts = await getPublishedPosts(50);
  return (
    <section className="hero">
      <div className="container reading">
        <h1 style={{ color: "var(--oro)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Clima astral</h1>

        <details className="rueda-desplegable">
          <summary>La rueda del cielo, en directo</summary>
          <div className="rueda-desplegable-cuerpo">
            <LiveSkyWheel />
          </div>
        </details>

        <details className="rueda-desplegable ciclo-desplegable">
          <summary>Ciclo lunar</summary>
          <div className="rueda-desplegable-cuerpo">
            <CicloLunar ciclo={CICLO_ACTUAL} />
          </div>
        </details>

        <details className="rueda-desplegable semana-desplegable">
          <summary>Clima de la semana</summary>
          <div className="rueda-desplegable-cuerpo">
            <div className="post-list">
              {posts.map((p) => (
                <Link key={p.id} href={`/clima-astral/${p.slug}`} className="post-item">
                  <span className="date">{postDateLabel(p)}</span>
                  <h3 style={{ marginTop: 6 }}>{p.title}</h3>
                  {p.excerpt && <p className="muted" style={{ marginBottom: 0 }}>{p.excerpt}</p>}
                </Link>
              ))}
            </div>
          </div>
        </details>
      </div>
    </section>
  );
}
