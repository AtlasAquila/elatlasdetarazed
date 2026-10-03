import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BLOG_CATEGORIES, postDateLabel, type Post } from "@/lib/posts";
import { createClient, getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Panel de publicación" };

function PostList({ posts }: { posts: Post[] }) {
  if (!posts.length) return <p className="muted">Todavía no hay publicaciones.</p>;
  return (
    <div className="post-list">
      {posts.map((p) => (
        <Link key={p.id} href={`/admin/${p.id}`} className="post-item">
          <span className="date">
            {p.published ? "Publicado" : "Borrador"}
            {postDateLabel(p) ? ` · ${postDateLabel(p)}` : ""}
            {p.category ? ` · ${BLOG_CATEGORIES[p.category]}` : ""}
          </span>
          <h3 style={{ marginTop: 6, marginBottom: 0 }}>{p.title}</h3>
        </Link>
      ))}
    </div>
  );
}

export default async function AdminPage() {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/cuenta");
  const supabase = await createClient();
  if (!supabase) redirect("/");

  const [{ data: posts }, { count: waitlistCount }] = await Promise.all([
    supabase
      .from("posts")
      .select("id, slug, title, excerpt, body, week_start, published, published_at, kind, category")
      .order("created_at", { ascending: false }),
    supabase.from("waitlist").select("id", { count: "exact", head: true }),
  ]);

  const all = (posts as Post[] | null) ?? [];
  const clima = all.filter((p) => p.kind !== "blog");
  const blog = all.filter((p) => p.kind === "blog");

  return (
    <section className="hero">
      <div className="container reading">
        <p className="kicker">Panel de publicación</p>
        <h1>Publicaciones</h1>
        <div className="actions" style={{ margin: "24px 0 40px" }}>
          <Link href="/admin/usuarios" className="btn btn-ghost">
            Usuarios y preguntas
          </Link>
          <Link href="/admin/textos" className="btn btn-ghost">
            Textos de la web
          </Link>
          <span className="muted" style={{ alignSelf: "center" }}>
            Lista de espera: {waitlistCount ?? 0} {waitlistCount === 1 ? "persona" : "personas"}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 40 }}>
          <h2 style={{ margin: 0 }}>Clima astral</h2>
          <Link href="/admin/nueva?kind=clima" className="btn btn-primary btn-small">
            Nueva publicación
          </Link>
        </div>
        <div style={{ marginTop: 20 }}>
          <PostList posts={clima} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 56 }}>
          <h2 style={{ margin: 0 }}>Blog</h2>
          <Link href="/admin/nueva?kind=blog" className="btn btn-primary btn-small">
            Nueva entrada
          </Link>
        </div>
        <div style={{ marginTop: 20 }}>
          <PostList posts={blog} />
        </div>
      </div>
    </section>
  );
}
