import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PostEditor } from "@/components/PostEditor";
import type { PostKind } from "@/lib/posts";
import { getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nueva publicación" };

type Props = { searchParams: Promise<{ kind?: string }> };

export default async function NewPostPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/cuenta");
  const { kind: kindParam } = await searchParams;
  const kind: PostKind = kindParam === "blog" ? "blog" : "clima";
  return (
    <section className="hero">
      <div className="container reading">
        <Link href="/admin" className="small">
          ← Panel
        </Link>
        <h1 style={{ marginTop: 24 }}>{kind === "blog" ? "Nueva entrada del blog" : "Nueva publicación"}</h1>
        <PostEditor kind={kind} />
      </div>
    </section>
  );
}
