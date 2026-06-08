import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  getSellerClientIdFromPathname,
  getSellerRouteFromPathname,
  SELLER_PROPERTIES_PATH,
  SELLER_NEW_PROPERTY_PATH,
  sellerClientPath,
  sellerPropertyEditPath,
  sellerPropertyPath
} from "../src/seller/routing.js";

describe("seller routing helpers", () => {
  it("extracts the selected client id from seller client detail URLs", () => {
    assert.equal(getSellerClientIdFromPathname("/vendedor/cliente/client-123"), "client-123");
    assert.equal(getSellerClientIdFromPathname("/vendedor/cliente/client%20space/"), "client space");
  });

  it("ignores seller URLs that are not client detail screens", () => {
    assert.equal(getSellerClientIdFromPathname("/vendedor"), "");
    assert.equal(getSellerClientIdFromPathname("/vendedor/cliente"), "");
    assert.equal(getSellerClientIdFromPathname("/admin/cliente/client-123"), "");
  });

  it("builds encoded seller client detail URLs", () => {
    assert.equal(sellerClientPath("client 123"), "/vendedor/cliente/client%20123");
  });

  it("recognizes seller property routes", () => {
    assert.equal(SELLER_PROPERTIES_PATH, "/vendedor/propiedades");
    assert.equal(SELLER_NEW_PROPERTY_PATH, "/vendedor/propiedades/nueva");
    assert.equal(sellerPropertyPath("property 123"), "/vendedor/propiedades/property%20123");
    assert.equal(sellerPropertyEditPath("property 123"), "/vendedor/propiedades/property%20123/editar");
    assert.deepEqual(getSellerRouteFromPathname("/vendedor/propiedades"), {
      section: "properties",
      clientId: "",
      propertyId: "",
      propertyMode: "list"
    });
    assert.deepEqual(getSellerRouteFromPathname("/vendedor/propiedades/nueva"), {
      section: "properties",
      clientId: "",
      propertyId: "",
      propertyMode: "new"
    });
    assert.deepEqual(getSellerRouteFromPathname("/vendedor/propiedades/property-123"), {
      section: "properties",
      clientId: "",
      propertyId: "property-123",
      propertyMode: "view"
    });
    assert.deepEqual(getSellerRouteFromPathname("/vendedor/propiedades/property-123/editar"), {
      section: "properties",
      clientId: "",
      propertyId: "property-123",
      propertyMode: "edit"
    });
    assert.deepEqual(getSellerRouteFromPathname("/vendedor/cliente/client-123"), {
      section: "clients",
      clientId: "client-123",
      propertyId: "",
      propertyMode: "list"
    });
  });
});
