import type { Metadata } from "next";

import IAChatApp from "@/components/IAChatApp";
import { listPublishedProperties } from "@/server/properties";
import { iaMetadata } from "@/server/seo";

export async function generateMetadata(): Promise<Metadata> {
  return iaMetadata();
}

export default async function IAPage() {
  const initialProperties = await listPublishedProperties().catch(() => []);

  return <IAChatApp initialProperties={initialProperties} />;
}

