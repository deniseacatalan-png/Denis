import assert from "node:assert/strict";
import { describe, it } from "vitest";

import { getSellerClientIdFromPathname, sellerClientPath } from "../src/seller/routing.js";

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
});
