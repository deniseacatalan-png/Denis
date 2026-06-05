"use client";

import dynamic from "next/dynamic";

import type { PropertyViewModel } from "@/server/view-models";

const PublicApp = dynamic(() => import("../App").then((mod) => mod.PublicApp), {
  ssr: false,
  loading: () => (
    <main className="page-shell">
      <section className="hero">
        <p>Cargando propiedades...</p>
      </section>
    </main>
  )
});

export function PublicAppLoader({ initialProperties }: { initialProperties: PropertyViewModel[] }) {
  return <PublicApp initialProperties={initialProperties} />;
}
