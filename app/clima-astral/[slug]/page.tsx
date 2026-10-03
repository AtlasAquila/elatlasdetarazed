import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "@/components/RichText";
import { getPostBySlug, postDateLabel } from "@/lib/posts";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Clima astral" };
  return { title: post.title, description: post.excerpt };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || !post.published) notFound();

  return (
    <article className="hero">
      <div className="container reading">
        <Link href="/clima-astral" className="small">
          ← Clima astral
        </Link>
        <p className="kicker" style={{ marginTop: 32 }}>
          {postDateLabel(post) || "Clima astral"}
        </p>
        <h1>{post.title}</h1>
        {post.excerpt && <p className="lead">{post.excerpt}</p>}
        <div style={{ borderTop: "1px solid var(--line)", marginTop: 32, paddingTop: 32 }}>
          <RichText text={post.body} />
        </div>
        <p className="muted small" style={{ marginTop: 40 }}>
          Por Alshain · Contenido orientativo.
        </p>
      </div>
    </article>
  );
}
