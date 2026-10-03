"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BLOG_CATEGORIES, slugify, type BlogCategory, type PostKind } from "@/lib/posts";
import { createClient, getSession } from "@/lib/supabase/server";

export type PostFormState = { error?: string; message?: string };

async function requireAdmin() {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/entrar?siguiente=/admin");
  const supabase = await createClient();
  if (!supabase) redirect("/");
  return { session, supabase };
}

export async function savePost(_prev: PostFormState, formData: FormData): Promise<PostFormState> {
  const { session, supabase } = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const kind = (String(formData.get("kind") ?? "clima") as PostKind) === "blog" ? "blog" : "clima";
  const weekStart = kind === "clima" ? String(formData.get("week_start") ?? "").trim() || null : null;
  const categoryInput = String(formData.get("category") ?? "").trim();
  const category: BlogCategory | null = kind === "blog" && categoryInput in BLOG_CATEGORIES ? (categoryInput as BlogCategory) : null;
  const slugInput = String(formData.get("slug") ?? "").trim();
  const intent = String(formData.get("intent") ?? "draft");
  const publish = intent === "publish";

  if (!title) return { error: "El título es obligatorio." };
  if (!body) return { error: "El texto está vacío." };
  if (kind === "blog" && !category) return { error: "Elige una temática." };

  const slug = slugify(slugInput || title);
  if (!slug) return { error: "La dirección web no es válida." };

  const values = {
    title,
    excerpt,
    body,
    slug,
    kind,
    category,
    week_start: weekStart,
    published: publish,
    updated_at: new Date().toISOString(),
  };

  let savedId = id;
  if (id) {
    const { data: current } = await supabase.from("posts").select("published_at").eq("id", id).maybeSingle();
    const { error } = await supabase
      .from("posts")
      .update({ ...values, published_at: publish ? current?.published_at ?? new Date().toISOString() : current?.published_at ?? null })
      .eq("id", id);
    if (error) return { error: error.code === "23505" ? "Ya hay otra publicación con esa dirección web." : "No se ha podido guardar." };
  } else {
    const { data, error } = await supabase
      .from("posts")
      .insert({ ...values, author_id: session.userId, published_at: publish ? new Date().toISOString() : null })
      .select("id")
      .single();
    if (error || !data) return { error: error?.code === "23505" ? "Ya hay otra publicación con esa dirección web." : "No se ha podido guardar." };
    savedId = data.id;
  }

  const section = kind === "blog" ? "/blog" : "/clima-astral";
  revalidatePath(section);
  revalidatePath(`${section}/${slug}`);
  revalidatePath("/");
  if (!id) redirect(`/admin/${savedId}?guardado=1`);
  return { message: publish ? "Publicado." : "Borrador guardado." };
}

export async function deletePost(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await supabase.from("posts").delete().eq("id", id);
  revalidatePath("/clima-astral");
  revalidatePath("/blog");
  revalidatePath("/");
  redirect("/admin");
}
