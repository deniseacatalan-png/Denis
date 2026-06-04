import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  filterPropertiesBySearch,
  propertyMatchesSearch,
  slugify
} from "../src/utils/properties.js";

describe("property helpers", () => {
  it("normalizes text into URL-safe slugs", () => {
    assert.equal(slugify("Cabaña Ñire en San Martín"), "cabana-nire-en-san-martin");
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
});
