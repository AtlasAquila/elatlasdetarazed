import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "@/components/RichText";
import { BLOG_CATEGORIES, getPostBySlug, postDateLabel } from "@/lib/posts";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || post.kind !== "blog") return { title: "Blog" };
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || !post.published || post.kind !== "blog") notFound();

  return (
    <article className="hero">
      <div className="container reading">
        <Link href="/blog" className="small">
          ← Blog
        </Link>
        <p className="kicker" style={{ marginTop: 32 }}>
          {(post.category ? BLOG_CATEGORIES[post.category] : null) ?? "Blog"}
          {postDateLabel(post) ? ` · ${postDateLabel(post)}` : ""}
        </p>
        <h1>{post.title}</h1>
        {post.excerpt && <p className="lead">{post.excerpt}</p>}
        <div style={{ borderTop: "1px solid var(--line)", marginTop: 32, paddingTop: 32 }}>
          <RichText text={post.body} />
        </div>
      </div>
    </article>
  );
}
