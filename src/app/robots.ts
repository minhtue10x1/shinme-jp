import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://shinme-jp.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/portal", "/portal/*", "/api/*"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
