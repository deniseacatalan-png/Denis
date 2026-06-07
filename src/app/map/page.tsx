import type { Metadata } from "next";

import { PublicAppLoader } from "@/components/PublicAppLoader";
import { listPublishedProperties } from "@/server/properties";

export const metadata: Metadata = {
  title: "Mapa de propiedades | Denise Catalán Bienes Raíces",
  description:
    "Mapa interactivo de propiedades publicadas por Denise Catalán Bienes Raíces en San Martín de los Andes y la Patagonia.",
  alternates: {
    canonical: "/map"
  }
};

export default async function FullscreenMapPage() {
  const properties = await listPublishedProperties().catch(() => []);

  return <PublicAppLoader initialProperties={properties} />;
}
