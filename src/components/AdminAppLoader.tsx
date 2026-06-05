"use client";

import dynamic from "next/dynamic";

const AdminApp = dynamic(() => import("../admin/AdminApp"), {
  ssr: false,
  loading: () => (
    <main className="admin-shell admin-shell--login">
      <section className="admin-login-panel">
        <p>Cargando administrador...</p>
      </section>
    </main>
  )
});

export function AdminAppLoader() {
  return <AdminApp />;
}
