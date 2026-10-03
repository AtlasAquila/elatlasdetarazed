/**
 * Constantes de publicaciones que no dependen del servidor (sin Supabase ni next/headers),
 * para poder importarlas también desde componentes de cliente como PostEditor.
 */

export type PostKind = "clima" | "blog";

export const BLOG_CATEGORIES = {
  astrologia: "Astrología",
  ciencia: "Ciencia",
  historia: "Historia",
  mitologia: "Mitología",
  "ciencias-antiguas": "Ciencias antiguas",
  "revelaciones-del-alma": "Revelaciones del alma",
  "experiencia-humana": "Experiencia humana",
} as const;

export type BlogCategory = keyof typeof BLOG_CATEGORIES;
