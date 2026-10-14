import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Cormorant_Garamond, EB_Garamond } from "next/font/google";
import { AppAccountOnly, AppTabs } from "@/components/AppTabs";
import { AppMore } from "@/components/AppMore";
import { AppPush } from "@/components/AppPush";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { isAppRequest } from "@/lib/app-mode";
import { getSession } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/supabase/config";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display",
  display: "swap",
});

const serif = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const isPublic = process.env.NEXT_PUBLIC_SITE_PUBLIC === "true";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Códice Orbital · Astrología de precisión",
    template: "%s · Códice Orbital",
  },
  description:
    "Cartas natales calculadas con precisión astronómica, el clima astral de cada semana y lecturas que interpretan tu cielo completo.",
  robots: isPublic ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: {
    siteName: "Códice Orbital",
    locale: "es_ES",
    type: "website",
  },
};

// En la app de Android la web ocupa toda la pantalla, también bajo la barra de estado y los gestos.
export async function generateViewport(): Promise<Viewport> {
  return (await isAppRequest()) ? { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#00060f" } : { width: "device-width", initialScale: 1 };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const app = await isAppRequest();
  const loggedIn = app ? Boolean(await getSession()) : false;
  return (
    <html lang="es" className={`${display.variable} ${serif.variable}`} data-app={app ? "" : undefined}>
      <head>
        {/* Glifos astrológicos (planetas, signos, Quirón, Lilith, nodos). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Symbols+2&display=swap" rel="stylesheet" />
      </head>
      <body>
        <a href="#contenido" className="visually-hidden">
          Saltar al contenido
        </a>
        {!app && <SiteHeader />}
        <main id="contenido">{children}</main>
        {app ? (
          <>
            <AppAccountOnly>
              <AppMore />
              <SiteFooter />
            </AppAccountOnly>
            <AppTabs />
            <AppPush loggedIn={loggedIn} />
          </>
        ) : (
          <SiteFooter />
        )}
        <Analytics />
      </body>
    </html>
  );
}
