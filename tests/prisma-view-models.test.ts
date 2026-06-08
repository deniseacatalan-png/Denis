import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  activityDocumentToViewModel,
  activityNoteToViewModel,
  clientToViewModel,
  propertyToViewModel,
  sellerProfileToViewModel
} from "../src/server/view-models.ts";

describe("Prisma view model mappers", () => {
  it("maps a Prisma property row into the existing public/admin property shape", () => {
    const property = propertyToViewModel({
      id: "property-1",
      kmlId: "kml-1",
      title: "Casa de prueba",
      slug: "casa-de-prueba",
      location: "San Martin de los Andes",
      price: "",
      area: "",
      category: "venta",
      latitude: -40.1,
      longitude: -71.3,
      markerColor: "#a86f7a",
      summary: "Resumen",
      descriptionHtml: "<p>Ficha</p>",
      rawDescription: "Ficha",
      isPublished: true,
      displayOrder: 4,
      createdAt: new Date("2026-06-01T10:00:00.000Z"),
      updatedAt: new Date("2026-06-02T10:00:00.000Z"),
      propertyImages: [
        { id: "image-2", url: "/second.jpg", alt: "Casa", sortOrder: 2 },
        { id: "image-1", url: "/first.jpg", alt: "Casa", sortOrder: 1 }
      ]
    });

    assert.deepEqual(property, {
      id: "property-1",
      databaseId: "property-1",
      kmlId: "kml-1",
      title: "Casa de prueba",
      slug: "casa-de-prueba",
      location: "San Martin de los Andes",
      price: "Consultar",
      area: "Superficie a confirmar",
      category: "venta",
      markerColor: "#b0528c",
      coords: [-40.1, -71.3],
      latitude: -40.1,
      longitude: -71.3,
      descriptionHtml: "<p>Ficha</p>",
      summary: "Resumen",
      rawDescription: "Ficha",
      isPublished: true,
      displayOrder: 4,
      createdAt: "2026-06-01T10:00:00.000Z",
      updatedAt: "2026-06-02T10:00:00.000Z",
      images: ["/first.jpg", "/second.jpg"]
    });
  });

  it("maps internal CRM rows into camelCase UI objects", () => {
    assert.deepEqual(
      clientToViewModel({
        id: "client-1",
        createdBy: "seller-1",
        updatedBy: "admin-1",
        fullName: "Maria Perez",
        phone: "2944",
        email: "maria@example.com",
        isOwner: true,
        operation: "locador",
        zone: "Lacar",
        budget: "USD 1000",
        rooms: "3",
        status: "visitando",
        notes: "Quiere vista",
        createdAt: new Date("2026-06-01T10:00:00.000Z"),
        updatedAt: new Date("2026-06-02T10:00:00.000Z"),
        propertyAssignments: [
          {
            id: "assignment-1",
            clientId: "client-1",
            propertyId: "property-1",
            relationship: "propietario",
            notes: "Duena actual",
            createdBy: "seller-1",
            updatedBy: "admin-1",
            createdAt: new Date("2026-06-01T11:00:00.000Z"),
            updatedAt: new Date("2026-06-02T11:00:00.000Z"),
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
        ]
      }),
      {
        id: "client-1",
        createdBy: "seller-1",
        updatedBy: "admin-1",
        fullName: "Maria Perez",
        phone: "2944",
        email: "maria@example.com",
        isOwner: true,
        operation: "locador",
        zone: "Lacar",
        budget: "USD 1000",
        rooms: "3",
        status: "visitando",
        notes: "Quiere vista",
        createdAt: "2026-06-01T10:00:00.000Z",
        updatedAt: "2026-06-02T10:00:00.000Z",
        propertyAssignments: [
          {
            id: "assignment-1",
            clientId: "client-1",
            propertyId: "property-1",
            relationship: "propietario",
            notes: "Duena actual",
            createdBy: "seller-1",
            updatedBy: "admin-1",
            createdAt: "2026-06-01T11:00:00.000Z",
            updatedAt: "2026-06-02T11:00:00.000Z",
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
        ]
      }
    );

    assert.deepEqual(
      sellerProfileToViewModel({
        id: "seller-1",
        username: "maria",
        email: "maria@vendedor.denise-catalan.local",
        fullName: "Maria Perez",
        isActive: true,
        createdBy: "admin-1",
        createdAt: new Date("2026-06-01T10:00:00.000Z"),
        updatedAt: new Date("2026-06-02T10:00:00.000Z")
      }),
      {
        id: "seller-1",
        username: "maria",
        email: "maria@vendedor.denise-catalan.local",
        fullName: "Maria Perez",
        isActive: true,
        createdBy: "admin-1",
        createdAt: "2026-06-01T10:00:00.000Z",
        updatedAt: "2026-06-02T10:00:00.000Z"
      }
    );
  });

  it("maps activity notes and documents without leaking database naming", () => {
    assert.deepEqual(
      activityNoteToViewModel({
        id: "note-1",
        propertyId: "property-1",
        clientId: null,
        body: "Llamar",
        createdBy: "admin-1",
        authorRole: "admin",
        authorName: "Admin",
        createdAt: new Date("2026-06-01T10:00:00.000Z")
      }),
      {
        id: "note-1",
        entityId: "property-1",
        body: "Llamar",
        createdBy: "admin-1",
        authorRole: "admin",
        authorName: "Admin",
        createdAt: "2026-06-01T10:00:00.000Z"
      }
    );

    assert.deepEqual(
      activityDocumentToViewModel({
        id: "document-1",
        propertyId: null,
        clientId: "client-1",
        fileName: "ficha.pdf",
        fileUrl: "https://blob.example/ficha.pdf",
        fileType: "application/pdf",
        fileSize: 2048,
        createdBy: "seller-1",
        authorRole: "seller",
        authorName: "Vendedor",
        createdAt: new Date("2026-06-01T10:00:00.000Z")
      }),
      {
        id: "document-1",
        entityId: "client-1",
        fileName: "ficha.pdf",
        fileUrl: "https://blob.example/ficha.pdf",
        fileType: "application/pdf",
        fileSize: 2048,
        isImage: false,
        createdBy: "seller-1",
        authorRole: "seller",
        authorName: "Vendedor",
        createdAt: "2026-06-01T10:00:00.000Z"
      }
    );
  });
});
