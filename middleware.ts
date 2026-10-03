import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/cuenta", "/admin", "/nueva-contrasena"];

export async function middleware(request: NextRequest) {
  // Los avisos de Stripe no llevan sesión ni contraseña: pasan directos (la ruta verifica cada evento).
  if (request.nextUrl.pathname === "/api/stripe/webhook") return NextResponse.next();

  // 1. Web privada durante el desarrollo (contraseña opcional).
  const sitePassword = process.env.SITE_PASSWORD;
  if (sitePassword) {
    const header = request.headers.get("authorization") ?? "";
    const [scheme, encoded] = header.split(" ");
    let ok = false;
    if (scheme === "Basic" && encoded) {
      const decoded = atob(encoded);
      const password = decoded.slice(decoded.indexOf(":") + 1);
      ok = password === sitePassword;
    }
    if (!ok) {
      return new NextResponse("El atlas de Tarazed está en construcción.", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="El atlas de Tarazed", charset="UTF-8"' },
      });
    }
  }

  // 2. Sesión de Supabase: la refrescamos en cada petición.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  if (!user && PROTECTED.some((p) => path === p || path.startsWith(p + "/"))) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/entrar";
    redirect.searchParams.set("siguiente", path);
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
