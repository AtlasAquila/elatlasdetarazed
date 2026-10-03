export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** false mientras no se hayan añadido las claves de Supabase. La web sigue funcionando con contenido de ejemplo. */
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
