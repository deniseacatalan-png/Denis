import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  buildIaContextBlock,
  buildIaPropertySuggestions,
  buildIaSystemPrompt
} from "../src/server/ia.ts";

describe("IA helpers", () => {
  const properties = [
    {
      id: "1",
      title: "Casa centro",
      slug: "casa-centro",
      location: "Centro",
      price: "USD 210.000",
      area: "140 m²",
      category: "venta",
      summary: "Casa luminosa cerca de todo.",
      rawDescription: "<p>Muy cerca del centro.</p>",
      images: ["https://example.com/casa.jpg"]
    },
    {
      id: "2",
      title: "Departamento turístico",
      slug: "depto-turistico",
      location: "Vega Maipu",
      price: "Consultar",
      area: "60 m²",
      category: "alquiler_turistico",
      summary: "Ideal para escapadas de temporada.",
      rawDescription: "",
      images: []
    }
  ];

  it("ranks the most relevant public property for a targeted query", () => {
    const suggestions = buildIaPropertySuggestions(properties, "busco casa en el centro para comprar");

    assert.equal(suggestions[0].id, "1");
    assert.match(suggestions[0].matchReasons.join(" "), /titulo|zona|descripcion/i);
    assert.equal(suggestions[0].url, "/propiedades/casa-centro");
  });

  it("builds a compact property context block", () => {
    const context = buildIaContextBlock(buildIaPropertySuggestions(properties, "centro", 2));

    assert.match(context, /Titulo: Casa centro/);
    assert.match(context, /URL: \/propiedades\/casa-centro/);
  });

  it("keeps the system prompt focused on existing published properties", () => {
    const prompt = buildIaSystemPrompt();

    assert.match(prompt, /No inventes propiedades/);
    assert.match(prompt, /No prometas disponibilidad futura/);
  });
});

