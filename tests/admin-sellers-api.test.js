import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getBearerToken,
  sanitizeSellerRequest,
  usernameToSellerEmail
} from "../api/admin/sellers.js";

describe("admin sellers API helpers", () => {
  it("maps seller usernames to the private seller email domain", () => {
    assert.equal(
      usernameToSellerEmail("  Lucas  "),
      "lucas@vendedor.denise-catalan.local"
    );
    assert.equal(usernameToSellerEmail("lucas@example.com"), "lucas@example.com");
  });

  it("extracts bearer tokens from Authorization headers", () => {
    const request = new Request("https://example.com/api/admin/sellers", {
      headers: {
        Authorization: "Bearer admin-token"
      }
    });

    assert.equal(getBearerToken(request), "admin-token");
  });

  it("sanitizes seller creation requests", () => {
    const request = sanitizeSellerRequest({
      action: "upsert",
      username: "  Lucas  ",
      fullName: "  Lucas Alvarez  ",
      password: "secret-pass",
      isActive: true
    });

    assert.deepEqual(request, {
      action: "upsert",
      username: "lucas",
      email: "lucas@vendedor.denise-catalan.local",
      fullName: "Lucas Alvarez",
      password: "secret-pass",
      isActive: true
    });
  });

  it("requires at least eight password characters when a password is supplied", () => {
    assert.throws(
      () => sanitizeSellerRequest({ username: "lucas", password: "short" }),
      /al menos 8 caracteres/
    );
  });
});
