"use client";

import dynamic from "next/dynamic";

const ClientPortalApp = dynamic(() => import("../client/ClientPortalApp"), {
  ssr: false,
  loading: () => (
    <main className="client-portal-shell client-portal-loading">
      <p>Cargando portal...</p>
    </main>
  )
});

export function ClientPortalAppLoader() {
  return <ClientPortalApp />;
}
