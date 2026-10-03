import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseConfigured, supabaseUrl } from "./config";

/** Cliente de Supabase para componentes de servidor y acciones. Devuelve null si falta la configuración. */
export async function createClient() {
  if (!supabaseConfigured) return null;
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Llamado desde un componente de servidor: el middleware se encarga de refrescar la sesión.
        }
      },
    },
  });
}

/** Cliente con la clave de servicio. Solo para operaciones de administración en el servidor (borrar cuentas). */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseConfigured || !key) return null;
  return createAdminClient(supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type SessionInfo = {
  userId: string;
  email: string;
  displayName: string | null;
  isAdmin: boolean;
  plan: "gratuito" | "premium";
} | null;

/** Usuario con sesión iniciada y su perfil, o null. */
export async function getSession(): Promise<SessionInfo> {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, is_admin, plan")
    .eq("id", user.id)
    .maybeSingle();
  return {
    userId: user.id,
    email: user.email ?? "",
    displayName: profile?.display_name ?? null,
    isAdmin: Boolean(profile?.is_admin),
    plan: profile?.plan === "premium" ? "premium" : "gratuito",
  };
}
