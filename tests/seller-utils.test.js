import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  normalizeSellerContact,
  sellerContactToDatabasePayload,
  usernameToSellerEmail
} from "../src/utils/supabase/sellers.js";

describe("seller supabase helpers", () => {
  it("maps short seller usernames to the private seller email domain", () => {
    assert.equal(
      usernameToSellerEmail("  Sofia  "),
      "sofia@vendedor.denise-catalan.local"
    );
    assert.equal(usernameToSellerEmail("ventas@example.com"), "ventas@example.com");
  });

  it("normalizes seller contact rows from Supabase into UI fields", () => {
    const contact = normalizeSellerContact({
      id: "contact-1",
      created_by: "seller-1",
      updated_by: "admin-1",
      full_name: "Juan Perez",
      phone: "2944000000",
      email: "juan@example.com",
      operation: "comprar",
      zone: "Centro",
      budget: "USD 180.000",
      rooms: "3 ambientes",
      status: "contactado",
      notes: "Busca casa luminosa",
      created_at: "2026-06-04T12:00:00Z",
      updated_at: "2026-06-04T13:00:00Z"
    });

    assert.deepEqual(contact, {
      id: "contact-1",
      createdBy: "seller-1",
      updatedBy: "admin-1",
      fullName: "Juan Perez",
      phone: "2944000000",
      email: "juan@example.com",
      operation: "comprar",
      zone: "Centro",
      budget: "USD 180.000",
      rooms: "3 ambientes",
      status: "contactado",
      notes: "Busca casa luminosa",
      createdAt: "2026-06-04T12:00:00Z",
      updatedAt: "2026-06-04T13:00:00Z"
    });
  });

  it("builds trimmed database payloads with safe defaults", () => {
    const payload = sellerContactToDatabasePayload(
      {
        fullName: "  Maria Lopez  ",
        phone: "  +54 2944 111111  ",
        email: "  MARIA@EXAMPLE.COM  ",
        operation: "invalid",
        zone: "  Vega  ",
        budget: "  $900.000  ",
        rooms: "  2 dorm.  ",
        status: "unknown",
        notes: "  Prefiere alquiler permanente  "
      },
      "seller-1"
    );

    assert.deepEqual(payload, {
      full_name: "Maria Lopez",
      phone: "+54 2944 111111",
      email: "maria@example.com",
      operation: "alquilar",
      zone: "Vega",
      budget: "$900.000",
      rooms: "2 dorm.",
      status: "nuevo",
      notes: "Prefiere alquiler permanente",
      updated_by: "seller-1"
    });
  });

  it("requires a contact name before saving", () => {
    assert.throws(
      () => sellerContactToDatabasePayload({ fullName: " " }, "seller-1"),
      /El nombre del contacto es obligatorio/
    );
  });
});
