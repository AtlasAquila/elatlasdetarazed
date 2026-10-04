import { createClient } from "@/lib/supabase/server";
import { BLOG_CATEGORIES, type BlogCategory, type PostKind } from "@/lib/post-shared";

export { BLOG_CATEGORIES, type BlogCategory, type PostKind };

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  week_start: string | null;
  published: boolean;
  published_at: string | null;
  kind: PostKind;
  category: BlogCategory | null;
};

const POST_COLUMNS = "id, slug, title, excerpt, body, week_start, published, published_at, kind, category";

export async function getPublishedPosts(limit = 20, kind: PostKind = "clima"): Promise<Post[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("published", true)
    .eq("kind", kind)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error || !data || data.length === 0) return [];
  return data as Post[];
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.from("posts").select(POST_COLUMNS).eq("slug", slug).maybeSingle();
  return (data as Post | null) ?? null;
}

const dateFormat = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" });

export function formatDate(value: string | null) {
  if (!value) return "";
  const d = new Date(value.length === 10 ? value + "T12:00:00Z" : value);
  return Number.isNaN(d.getTime()) ? "" : dateFormat.format(d);
}

export function postDateLabel(post: Post) {
  if (post.week_start) return `Semana del ${formatDate(post.week_start)}`;
  return formatDate(post.published_at);
}

/** Convierte un título en una dirección web: "Luna llena en Aries" → "luna-llena-en-aries". */
export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
