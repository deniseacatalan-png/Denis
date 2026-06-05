import assert from "node:assert/strict";
import { describe, it } from "vitest";

import { usernameToSellerEmail } from "../src/utils/supabase/sellers.js";

describe("seller supabase helpers", () => {
  it("maps short seller usernames to the private seller email domain", () => {
    assert.equal(
      usernameToSellerEmail("  Sofia  "),
      "sofia@vendedor.denise-catalan.local"
    );
    assert.equal(usernameToSellerEmail("ventas@example.com"), "ventas@example.com");
  });
});
