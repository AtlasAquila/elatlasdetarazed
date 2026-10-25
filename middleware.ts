import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { APP_UA_MARK } from "./lib/app-ua";

const PROTECTED = ["/cuenta", "/admin", "/nueva-contrasena"];

// En la app (gratuita para los testers) no existen las pantallas de pago: planes, recursos, sinastría, clima personal y revolución solar.
const APP_NO_PAYMENTS = /^\/(planes|recursos|sinastria)(\/|$)/;
const APP_NO_PAYMENTS_CHART = /^\/carta\/([^/]+)\/(clima|revolucion)(\/|$)/;

// Proyecto en pausa: cualquier enlace de la web muestra una página en blanco. El código queda intacto;
// para reabrir la web, poner PAUSADA a false.
const PAUSADA = true;

export async function middleware(request: NextRequest) {
  // Los avisos de Stripe no llevan sesión ni contraseña: pasan directos (la ruta verifica cada evento).
  if (request.nextUrl.pathname === "/api/stripe/webhook") return NextResponse.next();

  if (PAUSADA) {
    return new NextResponse("<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"robots\" content=\"noindex\"><title></title></head><body></body></html>", {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex", "Cache-Control": "no-store" },
    });
  }

  // Los administradores sí ven esas pantallas en la app (para probarlas): se decide al conocer al usuario.
  let appPaymentRedirect: URL | null = null;
  if ((request.headers.get("user-agent") ?? "").includes(APP_UA_MARK)) {
    const path = request.nextUrl.pathname;
    const chart = APP_NO_PAYMENTS_CHART.exec(path);
    if (chart || APP_NO_PAYMENTS.test(path)) {
      appPaymentRedirect = request.nextUrl.clone();
      appPaymentRedirect.pathname = chart ? `/carta/${chart[1]}` : "/clima-astral";
      appPaymentRedirect.search = "";
    }
  }

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
      return new NextResponse("Códice Orbital está en construcción.", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Códice Orbital", charset="UTF-8"' },
      });
    }
  }

  // 2. Sesión de Supabase: la refrescamos en cada petición.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return appPaymentRedirect ? NextResponse.redirect(appPaymentRedirect) : NextResponse.next({ request });

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

  if (appPaymentRedirect) {
    const { data: profile } = user ? await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle() : { data: null };
    if (!profile?.is_admin) return NextResponse.redirect(appPaymentRedirect);
  }

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
