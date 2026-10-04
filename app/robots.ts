import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/supabase/config";

const isPublic = process.env.NEXT_PUBLIC_SITE_PUBLIC === "true";

export default function robots(): MetadataRoute.Robots {
  if (!isPublic) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/cuenta", "/auth"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
