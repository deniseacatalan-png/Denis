import type { Metadata } from "next";

import { PublicAppLoader } from "@/components/PublicAppLoader";
import { getPublishedPropertyBySlug, listPublishedProperties } from "@/server/properties";
import { propertyJsonLd, propertyMetadata } from "@/server/seo";

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPublishedPropertyBySlug(slug).catch(() => null);
  return propertyMetadata(property);
}

export default async function PropertyPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [properties, property] = await Promise.all([
    listPublishedProperties().catch(() => []),
    getPublishedPropertyBySlug(slug).catch(() => null)
  ]);

  return (
    <>
      <PublicAppLoader initialProperties={properties} />
      {property ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(propertyJsonLd(property)).replace(/</g, "\\u003c")
          }}
        />
      ) : null}
    </>
  );
}
