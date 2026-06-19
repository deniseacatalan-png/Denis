import type { MetadataRoute } from "next";

import { listPublishedProperties } from "@/server/properties";
import { absoluteUrl, DEFAULT_SITE_URL } from "@/server/seo";
import { propertyPublicPath } from "@/utils/properties";

const STATIC_LAST_MODIFIED = new Date("2026-06-07T00:00:00.000Z");

function propertyLastModified(value: string) {
  const date = value ? new Date(value) : STATIC_LAST_MODIFIED;
  return Number.isNaN(date.getTime()) ? STATIC_LAST_MODIFIED : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await listPublishedProperties().catch(() => []);

  return [
    {
      url: `${DEFAULT_SITE_URL}/`,
      lastModified: STATIC_LAST_MODIFIED,
      priority: 1
    },
    {
      url: absoluteUrl("/IA"),
      lastModified: STATIC_LAST_MODIFIED,
      priority: 0.85
    },
    {
      url: absoluteUrl("/map"),
      lastModified: STATIC_LAST_MODIFIED,
      priority: 0.7
    },
    ...properties.map((property) => ({
      url: absoluteUrl(propertyPublicPath(property)),
      lastModified: propertyLastModified(property.updatedAt),
      priority: 0.8
    }))
  ];
}
