import type { MetadataRoute } from "next";

import { DEFAULT_SITE_URL } from "@/server/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/vendedor"]
    },
    sitemap: `${DEFAULT_SITE_URL}/sitemap.xml`
  };
}
