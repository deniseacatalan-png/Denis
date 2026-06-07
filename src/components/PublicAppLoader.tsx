"use client";

import dynamic from "next/dynamic";

import type { PropertyViewModel } from "@/server/view-models";
import AppNavbar from "./AppNavbar";
import { publicNavbarItems } from "./AppNavbarConfig";

const loadingNavbarItems = publicNavbarItems().map((item) =>
  item.action === "openService"
    ? {
        ...item,
        action: undefined,
        href: "https://wa.me/5492944688613?text=Hola%20Denise%2C%20quiero%20solicitar%20un%20servicio."
      }
    : item
);

const PublicApp = dynamic(() => import("../App").then((mod) => mod.PublicApp), {
  ssr: false,
  loading: () => (
    <main className="page-shell">
      <AppNavbar
        logoUrl="/isonegro.jpg"
        brandHref="/"
        items={loadingNavbarItems}
        onBrandClick={undefined}
        onItemSelect={undefined}
      />
      <section className="hero">
        <p>Cargando propiedades...</p>
      </section>
    </main>
  )
});

export function PublicAppLoader({ initialProperties }: { initialProperties: PropertyViewModel[] }) {
  return <PublicApp initialProperties={initialProperties} />;
}
