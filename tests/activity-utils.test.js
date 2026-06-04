import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  activityAuthorFromProfile,
  documentToDatabasePayload,
  noteToDatabasePayload,
  normalizeActivityDocument,
  normalizeActivityNote
} from "../src/utils/supabase/activity.js";

describe("activity supabase helpers", () => {
  it("normalizes note rows from Supabase into UI fields", () => {
    const note = normalizeActivityNote({
      id: "note-1",
      property_id: "property-1",
      body: "Seguimiento comercial",
      created_by: "admin-1",
      author_role: "admin",
      author_name: "Denise",
      created_at: "2026-06-04T12:00:00Z"
    });

    assert.deepEqual(note, {
      id: "note-1",
      entityId: "property-1",
      body: "Seguimiento comercial",
      createdBy: "admin-1",
      authorRole: "admin",
      authorName: "Denise",
      createdAt: "2026-06-04T12:00:00Z"
    });
  });

  it("normalizes document rows and detects image attachments", () => {
    const document = normalizeActivityDocument({
      id: "document-1",
      client_id: "client-1",
      file_name: " plano.pdf ",
      file_url: "https://example.com/plano.pdf",
      file_type: "application/pdf",
      file_size: 2500,
      created_by: "seller-1",
      author_role: "seller",
      author_name: "Sofia",
      created_at: "2026-06-04T13:00:00Z"
    });

    assert.deepEqual(document, {
      id: "document-1",
      entityId: "client-1",
      fileName: " plano.pdf ",
      fileUrl: "https://example.com/plano.pdf",
      fileType: "application/pdf",
      fileSize: 2500,
      isImage: false,
      createdBy: "seller-1",
      authorRole: "seller",
      authorName: "Sofia",
      createdAt: "2026-06-04T13:00:00Z"
    });

    assert.equal(
      normalizeActivityDocument({
        id: "document-2",
        property_id: "property-1",
        file_name: "foto.webp",
        file_url: "https://example.com/foto.webp",
        file_type: "image/webp"
      }).isImage,
      true
    );
  });

  it("builds trimmed note payloads with author metadata", () => {
    const payload = noteToDatabasePayload("property", "property-1", "  Llamar el lunes  ", {
      userId: "admin-1",
      role: "admin",
      name: "Denise"
    });

    assert.deepEqual(payload, {
      property_id: "property-1",
      body: "Llamar el lunes",
      created_by: "admin-1",
      author_role: "admin",
      author_name: "Denise"
    });
  });

  it("requires non-empty note bodies", () => {
    assert.throws(
      () => noteToDatabasePayload("client", "client-1", " ", {
        userId: "seller-1",
        role: "seller",
        name: "Sofia"
      }),
      /La nota no puede estar vacia/
    );
  });

  it("builds document payloads and requires name plus URL", () => {
    const payload = documentToDatabasePayload(
      "client",
      "client-1",
      {
        fileName: " reserva.docx ",
        fileUrl: " https://example.com/reserva.docx ",
        fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileSize: 4096
      },
      {
        userId: "seller-1",
        role: "seller",
        name: "Sofia"
      }
    );

    assert.deepEqual(payload, {
      client_id: "client-1",
      file_name: "reserva.docx",
      file_url: "https://example.com/reserva.docx",
      file_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      file_size: 4096,
      created_by: "seller-1",
      author_role: "seller",
      author_name: "Sofia"
    });

    assert.throws(
      () =>
        documentToDatabasePayload(
          "property",
          "property-1",
          { fileName: "plano.pdf", fileUrl: "" },
          { userId: "admin-1", role: "admin", name: "Denise" }
        ),
      /El documento necesita nombre y URL/
    );
  });

  it("derives compact author metadata from the active internal profile", () => {
    assert.deepEqual(
      activityAuthorFromProfile("user-1", {
        role: "seller",
        profile: {
          fullName: "  Sofia Ramos  ",
          username: "sofia",
          email: "sofia@example.com"
        }
      }),
      {
        userId: "user-1",
        role: "seller",
        name: "Sofia Ramos"
      }
    );

    assert.deepEqual(activityAuthorFromProfile("admin-1", null), {
      userId: "admin-1",
      role: "admin",
      name: "Administrador"
    });
  });
});
