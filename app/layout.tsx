import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Cormorant_Garamond, EB_Garamond } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
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
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const isPublic = process.env.NEXT_PUBLIC_SITE_PUBLIC === "true";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "El atlas de Tarazed · Astrología de precisión",
    template: "%s · El atlas de Tarazed",
  },
  description:
    "Cartas natales calculadas con precisión astronómica, el clima astral de cada semana y lecturas que interpretan tu cielo completo.",
  robots: isPublic ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: {
    siteName: "El atlas de Tarazed",
    locale: "es_ES",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${serif.variable}`}>
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
        <SiteHeader />
        <main id="contenido">{children}</main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
