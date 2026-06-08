import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  CLIENT_OPERATIONS,
  CLIENT_PROPERTY_RELATIONSHIPS,
  CLIENT_STATUSES,
  clientPropertyAssignmentToPayload,
  clientToDatabasePayload,
  normalizeClient,
  normalizeClientPropertyAssignment
} from "../src/utils/supabase/clients.js";

describe("client supabase helpers", () => {
  it("exposes the supported client operation and status values", () => {
    assert.deepEqual(CLIENT_OPERATIONS, ["comprar", "alquilar", "temporada"]);
    assert.deepEqual(CLIENT_STATUSES, ["nuevo", "contactado", "visitando", "cerrado", "pausado"]);
    assert.deepEqual(CLIENT_PROPERTY_RELATIONSHIPS, ["propietario", "comprador", "interesado", "inquilino"]);
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
      client_property_assignments: [
        {
          id: "assignment-1",
          client_id: "client-1",
          property_id: "property-1",
          relationship: "interesado",
          notes: "Le gusto la cocina",
          property: {
            id: "property-1",
            title: "Casa Centro",
            slug: "casa-centro",
            location: "Centro",
            price: "USD 200.000",
            category: "venta",
            is_published: true
          }
        }
      ],
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
      propertyAssignments: [
        {
          id: "assignment-1",
          clientId: "client-1",
          propertyId: "property-1",
          relationship: "interesado",
          notes: "Le gusto la cocina",
          createdBy: "",
          updatedBy: "",
          createdAt: "",
          updatedAt: "",
          property: {
            id: "property-1",
            title: "Casa Centro",
            slug: "casa-centro",
            location: "Centro",
            price: "USD 200.000",
            category: "venta",
            isPublished: true
          }
        }
      ],
      createdAt: "2026-06-04T12:00:00Z",
      updatedAt: "2026-06-04T13:00:00Z"
    });
  });

  it("normalizes and validates property assignments", () => {
    assert.deepEqual(
      normalizeClientPropertyAssignment({
        id: "assignment-1",
        client_id: "client-1",
        property_id: "property-1",
        relationship: "inquilino",
        notes: "Contrato vigente",
        created_by: "seller-1",
        updated_by: "admin-1",
        created_at: "2026-06-04T12:00:00Z",
        updated_at: "2026-06-04T13:00:00Z"
      }),
      {
        id: "assignment-1",
        clientId: "client-1",
        propertyId: "property-1",
        relationship: "inquilino",
        notes: "Contrato vigente",
        createdBy: "seller-1",
        updatedBy: "admin-1",
        createdAt: "2026-06-04T12:00:00Z",
        updatedAt: "2026-06-04T13:00:00Z",
        property: null
      }
    );

    assert.deepEqual(
      clientPropertyAssignmentToPayload({
        clientId: " client-1 ",
        propertyId: " property-1 ",
        relationship: "comprador",
        notes: "  Oferta enviada  "
      }),
      {
        id: "",
        clientId: "client-1",
        propertyId: "property-1",
        relationship: "comprador",
        notes: "Oferta enviada"
      }
    );

    assert.equal(
      clientPropertyAssignmentToPayload({
        clientId: "client-1",
        propertyId: "property-1",
        relationship: "otro"
      }).relationship,
      "interesado"
    );

    assert.throws(
      () => clientPropertyAssignmentToPayload({ clientId: "client-1", propertyId: "" }),
      /Selecciona una propiedad/
    );
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
