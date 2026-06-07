import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * robots.txt. Crawlers get the marketing pages; the API and the authenticated
 * in-session flow are disallowed (they can't be crawled anyway, and keeping
 * them out avoids thin/duplicate session URLs leaking into the index).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/session",
        "/waiting-room",
        "/the-call",
        "/self-reflection",
        "/vote",
        "/settings",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
