import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/supabase/config";
import { getPublishedPosts } from "@/lib/posts";
import { RESOURCES } from "@/lib/resources";

export const revalidate = 3600;

/** Páginas públicas que Google debe conocer. Las cartas y la cuenta de cada persona quedan fuera. */
const PAGES = [
  "",
  "/introduccion",
  "/fundamentos",
  "/clima-astral",
  "/carta",
  "/numerologia",
  "/sinastria",
  "/recursos",
  ...RESOURCES.map((r) => `/recursos/${r.slug}`),
  "/suenos",
  "/blog",
  "/planes",
  "/aviso-legal",
  "/privacidad",
  "/cookies",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [clima, blog] = await Promise.all([getPublishedPosts(200, "clima"), getPublishedPosts(200, "blog")]);
  const posts = [
    ...clima.filter((p) => p.published_at).map((p) => ({ url: `${siteUrl}/clima-astral/${p.slug}`, lastModified: p.published_at! })),
    ...blog.filter((p) => p.published_at).map((p) => ({ url: `${siteUrl}/blog/${p.slug}`, lastModified: p.published_at! })),
  ];
  return [...PAGES.map((path) => ({ url: `${siteUrl}${path}` })), ...posts];
}
