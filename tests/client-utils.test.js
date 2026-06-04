import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CLIENT_OPERATIONS,
  CLIENT_STATUSES,
  clientToDatabasePayload,
  normalizeClient
} from "../src/utils/supabase/clients.js";

describe("client supabase helpers", () => {
  it("exposes the supported client operation and status values", () => {
    assert.deepEqual(CLIENT_OPERATIONS, ["comprar", "alquilar", "temporada"]);
    assert.deepEqual(CLIENT_STATUSES, ["nuevo", "contactado", "visitando", "cerrado", "pausado"]);
  });

  it("normalizes client rows from Supabase into UI fields", () => {
    const client = normalizeClient({
      id: "client-1",
      created_by: "seller-1",
      updated_by: "admin-1",
      full_name: "Juan Perez",
      phone: "2944000000",
      email: "juan@example.com",
      is_owner: true,
      operation: "comprar",
      zone: "Centro",
      budget: "USD 180.000",
      rooms: "3 ambientes",
      status: "contactado",
      notes: "Busca casa luminosa",
      created_at: "2026-06-04T12:00:00Z",
      updated_at: "2026-06-04T13:00:00Z"
    });

    assert.deepEqual(client, {
      id: "client-1",
      createdBy: "seller-1",
      updatedBy: "admin-1",
      fullName: "Juan Perez",
      phone: "2944000000",
      email: "juan@example.com",
      isOwner: true,
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
    const payload = clientToDatabasePayload(
      {
        fullName: "  Maria Lopez  ",
        phone: "  +54 2944 111111  ",
        email: "  MARIA@EXAMPLE.COM  ",
        isOwner: true,
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
      is_owner: true,
      operation: "alquilar",
      zone: "Vega",
      budget: "$900.000",
      rooms: "2 dorm.",
      status: "nuevo",
      notes: "Prefiere alquiler permanente",
      updated_by: "seller-1"
    });
  });

  it("preserves temporada as a supported client operation", () => {
    const payload = clientToDatabasePayload(
      {
        fullName: "Cliente temporada",
        operation: "temporada"
      },
      "seller-1"
    );

    assert.equal(payload.operation, "temporada");
  });

  it("requires a client name before saving", () => {
    assert.throws(
      () => clientToDatabasePayload({ fullName: " " }, "seller-1"),
      /El nombre del cliente es obligatorio/
    );
  });
});
