import assert from "node:assert/strict";
import { describe, it } from "vitest";

import { createRuleSession, generateRuleReply, normalizeIaText } from "../src/utils/ia-rules.ts";

describe("IA rules fallback", () => {
  const properties = [
    {
      id: "sale-1",
      title: "Casa centro",
      slug: "casa-centro",
      location: "Centro",
      price: "USD 210.000",
      area: "140 m2",
      category: "venta",
      summary: "Casa luminosa con patio y cochera.",
      rawDescription: "<p>Muy cerca de todo.</p>",
      images: ["https://example.com/casa.jpg"]
    },
    {
      id: "rent-1",
      title: "Depto temporario",
      slug: "depto-temporario",
      location: "Vega Maipu",
      price: "Consultar",
      area: "65 m2",
      category: "alquiler_turistico",
      summary: "Ideal para temporada con vista al lago.",
      rawDescription: "",
      images: []
    },
    {
      id: "rent-2",
      title: "Casa permanente",
      slug: "casa-permanente",
      location: "Barrio El Oasis",
      price: "ARS 800.000",
      area: "110 m2",
      category: "alquiler_permanente",
      summary: "Casa familiar con jardín y cochera.",
      rawDescription: "",
      images: []
    }
  ];

  it("normalizes user text for keyword detection", () => {
    assert.equal(normalizeIaText("Quiero TEMPORADA, en el Centro!"), "quiero temporada en el centro");
  });

  it("detects intent and returns real property suggestions", () => {
    const reply = generateRuleReply({
      query: "Busco alquilar por temporada en centro con cochera",
      properties,
      session: createRuleSession()
    });

    assert.equal(reply.session.intent, "alquiler_turistico");
    assert.equal(reply.stage, 1);
    assert.equal(reply.suggestions[0].id, "rent-1");
    assert.match(reply.reply, /temporario|temporada|zona/i);
  });

  it("changes the reply style on the second and third message", () => {
    const first = generateRuleReply({
      query: "Busco una casa para comprar en centro",
      properties,
      session: createRuleSession()
    });
    const second = generateRuleReply({
      query: "sí, presupuesto 200000",
      properties,
      session: first.session
    });
    const third = generateRuleReply({
      query: "tambien con cochera y patio",
      properties,
      session: second.session
    });

    assert.equal(first.stage, 1);
    assert.equal(second.stage, 2);
    assert.equal(third.stage, 3);
    assert.notEqual(first.reply, second.reply);
    assert.notEqual(second.reply, third.reply);
    assert.equal(first.session.intent, "comprar");
    assert.equal(second.session.intent, "comprar");
    assert.equal(third.session.intent, "comprar");
  });

  it("resets the conversation when the topic changes", () => {
    const first = generateRuleReply({
      query: "Busco alquiler permanente",
      properties,
      session: createRuleSession()
    });
    const changed = generateRuleReply({
      query: "Ahora quiero vender mi casa",
      properties,
      session: first.session
    });

    assert.equal(changed.session.intent, "vender");
    assert.equal(changed.stage, 1);
    assert.notEqual(first.reply, changed.reply);
  });
});

