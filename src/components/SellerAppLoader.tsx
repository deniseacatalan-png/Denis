"use client";

import dynamic from "next/dynamic";

const SellerApp = dynamic(() => import("../seller/SellerApp"), {
  ssr: false,
  loading: () => (
    <main className="admin-shell admin-shell--login seller-shell">
      <section className="admin-login-panel">
        <p>Cargando vendedor...</p>
      </section>
    </main>
  )
});

export function SellerAppLoader() {
  return <SellerApp />;
}
