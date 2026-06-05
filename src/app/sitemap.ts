import type { MetadataRoute } from "next";

import { listPublishedProperties } from "@/server/properties";
import { absoluteUrl, DEFAULT_SITE_URL } from "@/server/seo";
import { propertyPublicPath } from "@/utils/properties";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await listPublishedProperties().catch(() => []);

  return [
    {
      url: `${DEFAULT_SITE_URL}/`,
      priority: 1
    },
    ...properties.map((property) => ({
      url: absoluteUrl(propertyPublicPath(property)),
      priority: 0.8
    }))
  ];
}
