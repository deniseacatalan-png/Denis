import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  adminNavbarItems,
  clientNavbarItems,
  publicNavbarItems,
  sellerNavbarItems
} from "../src/components/AppNavbarConfig.js";

describe("app navbar configuration", () => {
  it("keeps the public home navbar labels and CTA from the main screen", () => {
    assert.deepEqual(
      publicNavbarItems().map((item) => [item.id, item.label, item.variant || "link"]),
      [
        ["home", "Inicio", "link"],
        ["properties", "Propiedades", "link"],
        ["clients", "Portal clientes", "link"],
        ["service", "Solicitar servicio", "cta"]
      ]
    );
  });

  it("switches public home links when the user is on a property route", () => {
    assert.deepEqual(
      publicNavbarItems({ isPropertyRoute: true }).map((item) => [item.id, item.label, item.action || item.href]),
      [
        ["home", "Inicio", "navigateHome"],
        ["clients", "Portal clientes", "/clientes"],
        ["service", "Solicitar servicio", "openService"]
      ]
    );
  });

  it("changes client links between logged-out and logged-in states", () => {
    assert.deepEqual(
      clientNavbarItems({ isAuthenticated: false, authMode: "signup" }).map((item) => [
        item.id,
        item.label,
        Boolean(item.active),
        item.variant || "link"
      ]),
      [
        ["login", "Ingresar", false, "link"],
        ["signup", "Crear cuenta", true, "cta"]
      ]
    );

    assert.deepEqual(
      clientNavbarItems({ isAuthenticated: true, activeView: "perfil" }).map((item) => [
        item.id,
        item.label,
        Boolean(item.active),
        item.variant || "link"
      ]),
      [
        ["panel", "Panel", false, "link"],
        ["perfil", "Perfil", true, "link"],
        ["signout", "Salir", false, "link"]
      ]
    );
  });

  it("changes internal links for admins and sellers", () => {
    assert.deepEqual(
      adminNavbarItems({ activeSection: "clients" }).map((item) => [
        item.id,
        item.label,
        Boolean(item.active),
        item.variant || "link"
      ]),
      [
        ["dashboard", "Resumen", false, "link"],
        ["properties", "Propiedades", false, "link"],
        ["clients", "Clientes", true, "link"],
        ["sellers", "Vendedores", false, "link"],
        ["signout", "Cerrar sesión", false, "cta"]
      ]
    );

    assert.deepEqual(
      sellerNavbarItems({ isClientDetail: true }).map((item) => [item.id, item.label, Boolean(item.active), item.variant || "link"]),
      [
        ["clients", "Clientes", true, "link"],
        ["publicSite", "Ver web", false, "link"],
        ["signout", "Cerrar sesión", false, "cta"]
      ]
    );
  });
});
