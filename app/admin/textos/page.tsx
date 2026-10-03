import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TextsEditor } from "@/components/TextsEditor";
import { getSession } from "@/lib/supabase/server";
import { TEXT_GROUPS, getSavedTexts } from "@/lib/texts";

export const metadata: Metadata = { title: "Textos de la web" };

type Props = { searchParams: Promise<{ seccion?: string }> };

const PAGE_LINKS: Record<string, string> = {
  general: "/",
  portada: "/",
  introduccion: "/introduccion",
  fundamentos: "/fundamentos",
  clima: "/clima-astral",
  recursos: "/recursos",
  blog: "/blog",
  carta: "/carta",
  planes: "/planes",
};

export default async function TextosPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/cuenta");

  const { seccion } = await searchParams;
  const group = TEXT_GROUPS.find((g) => g.id === seccion) ?? TEXT_GROUPS[1];
  const saved = await getSavedTexts();

  return (
    <section className="hero">
      <div className="container reading">
        <Link href="/admin" className="small">
          ← Panel
        </Link>
        <p className="kicker" style={{ marginTop: 24 }}>
          Panel de publicación
        </p>
        <h1>Textos de la web</h1>
        <nav aria-label="Secciones" style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "24px 0 32px" }}>
          {TEXT_GROUPS.map((g) => (
            <Link
              key={g.id}
              href={`/admin/textos?seccion=${g.id}`}
              className={`btn btn-small ${g.id === group.id ? "btn-primary" : "btn-ghost"}`}
              aria-current={g.id === group.id ? "page" : undefined}
            >
              {g.title}
            </Link>
          ))}
        </nav>
        <div className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "baseline", marginBottom: 24 }}>
            <h2 style={{ margin: 0 }}>{group.title}</h2>
            <Link href={PAGE_LINKS[group.id] ?? "/"} className="small" target="_blank">
              Ver la página →
            </Link>
          </div>
          <TextsEditor key={group.id} group={group} saved={saved} />
        </div>
      </div>
    </section>
  );
}
