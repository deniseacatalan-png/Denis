import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CATEGORY_META,
  filterPropertiesBySearch,
  findPropertyByPublicPath,
  getPublicSelectedPropertyId,
  getVisiblePublicProperties,
  normalizeDatabaseProperty,
  propertyMatchesSearch,
  propertyPublicPath,
  slugify
} from "../src/utils/properties.js";

describe("property helpers", () => {
  it("normalizes text into URL-safe slugs", () => {
    assert.equal(slugify("Cabaña Ñire en San Martín"), "cabana-nire-en-san-martin");
  });

  it("builds public property paths from slugs", () => {
    assert.equal(
      propertyPublicPath({ slug: "casa-centro", title: "Casa Centro", id: "prop-1" }),
      "/propiedades/casa-centro/"
    );
    assert.equal(
      propertyPublicPath({ slug: "  Casa Ñire Centro  ", title: "Casa Centro", id: "prop-1" }),
      "/propiedades/casa-nire-centro/"
    );
  });

  it("resolves a property from a public property path", () => {
    const properties = [
      { id: "1", title: "Casa centro", slug: "casa-centro", category: "venta" },
      { id: "2", title: "Lote Chapelco", slug: "lote-chapelco", category: "venta" }
    ];

    assert.equal(findPropertyByPublicPath(properties, "/propiedades/lote-chapelco/")?.id, "2");
    assert.equal(findPropertyByPublicPath(properties, "/propiedades/no-existe/"), null);
  });

  it("matches properties across all fields with normalized partial terms", () => {
    const property = {
      title: "Cabaña Ñire",
      location: "San Martín de los Andes",
      price: "USD 180.000",
      category: "alquiler_permanente",
      isPublished: true,
      descriptionHtml: "<p>Vista al lago y bosque nativo.</p>",
      images: ["https://example.com/lago-sur.jpg"]
    };

    assert.equal(propertyMatchesSearch(property, "cabana san"), true);
    assert.equal(propertyMatchesSearch(property, "permanente lago"), true);
    assert.equal(propertyMatchesSearch(property, "publicada 180"), true);
    assert.equal(propertyMatchesSearch(property, "lago-sur"), true);
    assert.equal(propertyMatchesSearch(property, "centro"), false);
  });

  it("uses fuzzy similarity for short typos while filtering", () => {
    const properties = [
      { id: "1", title: "Casa céntrica", location: "Centro", category: "venta" },
      { id: "2", title: "Lote en Chapelco", location: "Chapelco", category: "venta" },
      { id: "3", title: "Departamento", location: "Vega Maipú", category: "alquiler_turistico" }
    ];

    const filtered = filterPropertiesBySearch(properties, "chapelko");

    assert.deepEqual(filtered.map((property) => property.id), ["2"]);
  });

  it("returns every property when the search query is empty", () => {
    const properties = [{ id: "1" }, { id: "2" }];

    assert.equal(filterPropertiesBySearch(properties, "   "), properties);
  });

  it("chooses the first visible public property by display order", () => {
    const properties = [
      { id: "later", title: "A later property", category: "venta", displayOrder: 5 },
      { id: "hidden", title: "Hidden first", category: "vendido", displayOrder: 0 },
      { id: "first", title: "Public first", category: "alquiler_turistico", displayOrder: 1 },
      { id: "second", title: "Public second", category: "venta", displayOrder: 2 }
    ];

    assert.deepEqual(
      getVisiblePublicProperties(properties).map((property) => property.id),
      ["first", "second", "later"]
    );
    assert.equal(getPublicSelectedPropertyId(properties), "first");
  });

  it("uses the rose-violet design system colors for property categories", () => {
    assert.deepEqual(
      Object.fromEntries(
        Object.entries(CATEGORY_META).map(([category, meta]) => [category, meta.mapColor])
      ),
      {
        venta: "#b0528c",
        alquiler_turistico: "#8e6a96",
        alquiler_permanente: "#6e4f82",
        vendido: "#4d3661",
        proceso: "#c0a0cf"
      }
    );
  });

  it("normalizes legacy persisted marker colors to the current category color", () => {
    const property = normalizeDatabaseProperty({
      id: "prop-1",
      title: "Casa",
      slug: "casa",
      category: "alquiler_turistico",
      marker_color: "#8a6a4f",
      latitude: -40.1,
      longitude: -71.3,
      images: []
    });

    assert.equal(property.markerColor, CATEGORY_META.alquiler_turistico.mapColor);
  });
});
