import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deletePost } from "@/app/actions/posts";
import { PostEditor } from "@/components/PostEditor";
import type { Post } from "@/lib/posts";
import { createClient, getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Editar publicación" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ guardado?: string }> };

export default async function EditPostPage({ params, searchParams }: Props) {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/cuenta");
  const supabase = await createClient();
  if (!supabase) redirect("/");

  const { id } = await params;
  const { guardado } = await searchParams;
  const { data } = await supabase
    .from("posts")
    .select("id, slug, title, excerpt, body, week_start, published, published_at, kind, category")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const post = data as Post;
  const section = post.kind === "blog" ? "/blog" : "/clima-astral";

  return (
    <section className="hero">
      <div className="container reading">
        <Link href="/admin" className="small">
          ← Panel
        </Link>
        <h1 style={{ marginTop: 24 }}>{post.kind === "blog" ? "Editar entrada del blog" : "Editar publicación"}</h1>
        {post.published && (
          <p className="small">
            <Link href={`${section}/${post.slug}`}>Ver en la web →</Link>
          </p>
        )}
        <PostEditor post={post} saved={guardado === "1"} />
        <form action={deletePost} style={{ marginTop: 48 }}>
          <input type="hidden" name="id" value={post.id} />
          <button type="submit" className="btn btn-ghost btn-small" style={{ borderColor: "var(--error)", color: "var(--error)" }}>
            Borrar publicación
          </button>
        </form>
      </div>
    </section>
  );
}
