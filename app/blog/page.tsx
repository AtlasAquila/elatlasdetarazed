import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts, postDateLabel } from "@/lib/posts";
import { getTexts } from "@/lib/texts";

export const metadata: Metadata = {
  title: "Blog",
  description: "Astrología, ciencia, historia, mitología, conocimientos antiguos, revelaciones del alma y aprendizajes humanos: el blog de El atlas de Tarazed.",
};

export const revalidate = 300;

export default async function BlogPage() {
  const [posts, { t }] = await Promise.all([getPublishedPosts(50, "blog"), getTexts()]);
  return (
    <section className="hero">
      <div className="container reading">
        <h1>Blog</h1>
        <p className="lead">{t("blog.lead")}</p>
        <div className="post-list" style={{ marginTop: 40 }}>
          {posts.length === 0 ? (
            <p className="muted">Todavía no hay entradas. Vuelve pronto.</p>
          ) : (
            posts.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="post-item">
                <span className="date">{postDateLabel(p)}</span>
                <h3 style={{ marginTop: 6 }}>{p.title}</h3>
                {p.excerpt && (
                  <p className="muted" style={{ marginBottom: 0 }}>
                    {p.excerpt}
                  </p>
                )}
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
