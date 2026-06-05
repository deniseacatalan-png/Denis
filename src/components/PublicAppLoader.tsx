"use client";

import dynamic from "next/dynamic";

import type { PropertyViewModel } from "@/server/view-models";

const PublicApp = dynamic(() => import("../App").then((mod) => mod.PublicApp), {
  ssr: false,
  loading: () => (
    <main className="page-shell">
      <header className="site-navbar">
        <nav className="site-nav" aria-label="Navegación principal">
          <a className="site-nav-brand" href="/" aria-label="Ir al inicio">
            <img src="/isonegro.jpg" alt="Logo Denise Catalán" />
          </a>
          <div className="site-nav-links">
            <a href="#inicio" className="site-nav-link">
              Inicio
            </a>
            <a href="#propiedades" className="site-nav-link">
              Propiedades
            </a>
            <a href="/clientes" className="site-nav-link">
              Portal clientes
            </a>
            <a
              href="https://wa.me/5492944688613?text=Hola%20Denise%2C%20quiero%20solicitar%20un%20servicio."
              className="site-nav-cta"
            >
              Solicitar servicio
            </a>
          </div>
        </nav>
      </header>
      <section className="hero">
        <p>Cargando propiedades...</p>
      </section>
    </main>
  )
});

export function PublicAppLoader({ initialProperties }: { initialProperties: PropertyViewModel[] }) {
  return <PublicApp initialProperties={initialProperties} />;
}
