import { PublicAppLoader } from "@/components/PublicAppLoader";
import { listPublishedProperties } from "@/server/properties";

export default async function HomePage() {
  const properties = await listPublishedProperties().catch(() => []);

  return <PublicAppLoader initialProperties={properties} />;
}
