import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  buildPropertyStaticHtml,
  buildSitemapXml,
  createPropertySeoMeta,
  parsePriceText
} from "../scripts/lib/static-seo.mjs";

const homeHtml = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="canonical" href="https://www.denisecatalanbienesraices.com.ar/" />
    <meta name="description" content="Denise Catalán Bienes Raíces: inmobiliaria en San Martín de los Andes." />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Denise Catalán Bienes Raíces" />
    <meta property="og:title" content="Denise Catalán Bienes Raíces | Inmobiliaria en San Martín de los Andes" />
    <meta property="og:description" content="Compra, venta y alquiler de propiedades en San Martín de los Andes." />
    <meta property="og:url" content="https://www.denisecatalanbienesraices.com.ar/" />
    <meta property="og:image" content="https://www.denisecatalanbienesraices.com.ar/ISO%20DC.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Denise Catalán Bienes Raíces | San Martín de los Andes" />
    <meta name="twitter:description" content="Bienes raíces en San Martín de los Andes." />
    <script type="application/ld+json">{"@context":"https://schema.org","@type":["RealEstateAgent","LocalBusiness"]}</script>
    <title>Denise Catalán Bienes Raíces | Inmobiliaria en San Martín de los Andes</title>
    <script type="module" crossorigin src="/assets/index.js"></script>
  </head>
  <body>
    <div id="root"><main aria-label="Denise Catalán Bienes Raíces"><h1>Denise Catalán Bienes Raíces en San Martín de los Andes</h1></main></div>
  </body>
</html>`;

const property = {
  id: "property-1",
  title: "HAS ORILLAS DE CALEUFU",
  slug: "has-orillas-de-caleufu",
  location: "San Martín de los Andes, Neuquén",
  price: "USD 420.000",
  area: "13.000 m²",
  category: "venta",
  latitude: -40.49949316293723,
  longitude: -71.17500304305337,
  coords: [-40.49949316293723, -71.17500304305337],
  summary:
    "Fracción comercial sobre el río Caleufú con costa propia y potencial turístico premium.",
  rawDescription:
    "Fracción comercial sobre el río Caleufú con 13.000 m², costa propia y potencial turístico premium.",
  isPublished: true,
  displayOrder: 1,
  updatedAt: "2026-06-04T12:00:00.000Z",
  images: [
    "https://cdn.example.com/properties/has-orillas-de-caleufu/cover.jpg"
  ]
};

describe("static property SEO generation", () => {
  it("builds property metadata without weakening the local home positioning", () => {
    const meta = createPropertySeoMeta(property, {
      siteUrl: "https://www.denisecatalanbienesraices.com.ar"
    });

    assert.equal(
      meta.canonicalUrl,
      "https://www.denisecatalanbienesraices.com.ar/propiedades/has-orillas-de-caleufu"
    );
    assert.match(meta.title, /HAS ORILLAS DE CALEUFU/);
    assert.match(meta.title, /San Martín de los Andes/);
    assert.match(meta.description, /Fracción comercial sobre el río Caleufú/);
    assert.match(meta.description, /San Martín de los Andes/);
    assert.equal(
      meta.imageUrl,
      "https://www.denisecatalanbienesraices.com.ar/api/og/properties/has-orillas-de-caleufu"
    );
    assert.equal(meta.homeTitle, "Denise Catalán Bienes Raíces | Inmobiliaria en San Martín de los Andes");
  });

  it("creates static HTML with property-specific canonical, social cards, JSON-LD and fallback content", () => {
    const html = buildPropertyStaticHtml(homeHtml, property, {
      siteUrl: "https://www.denisecatalanbienesraices.com.ar"
    });

    assert.match(html, /<title>HAS ORILLAS DE CALEUFU \| En venta en San Martín de los Andes<\/title>/);
    assert.match(
      html,
      /<link rel="canonical" href="https:\/\/www\.denisecatalanbienesraices\.com\.ar\/propiedades\/has-orillas-de-caleufu" \/>/
    );
    assert.match(html, /<meta property="og:type" content="article" \/>/);
    assert.match(
      html,
      /<meta property="og:image" content="https:\/\/www\.denisecatalanbienesraices\.com\.ar\/api\/og\/properties\/has-orillas-de-caleufu" \/>/
    );
    assert.match(
      html,
      /<meta name="twitter:image" content="https:\/\/www\.denisecatalanbienesraices\.com\.ar\/api\/og\/properties\/has-orillas-de-caleufu" \/>/
    );
    assert.match(html, /"@type":\s*"Place"/);
    assert.match(html, /"@type":\s*"Offer"/);
    assert.match(html, /"price":\s*420000/);
    assert.match(html, /<h1>HAS ORILLAS DE CALEUFU<\/h1>/);
    assert.match(html, /13\.000 m²/);
    assert.doesNotMatch(html, /<link rel="canonical" href="https:\/\/www\.denisecatalanbienesraices\.com\.ar\/" \/>/);
  });

  it("builds a sitemap with the home first and one URL per published property", () => {
    const sitemap = buildSitemapXml(
      [
        property,
        {
          ...property,
          id: "hidden",
          slug: "oculta",
          isPublished: false
        }
      ],
      {
        siteUrl: "https://www.denisecatalanbienesraices.com.ar",
        generatedAt: new Date("2026-06-05T15:00:00.000Z")
      }
    );

    assert.match(sitemap, /<loc>https:\/\/www\.denisecatalanbienesraices\.com\.ar\/<\/loc>/);
    assert.match(
      sitemap,
      /<loc>https:\/\/www\.denisecatalanbienesraices\.com\.ar\/propiedades\/has-orillas-de-caleufu<\/loc>/
    );
    assert.match(sitemap, /<lastmod>2026-06-04<\/lastmod>/);
    assert.doesNotMatch(sitemap, /oculta/);
    assert.doesNotMatch(sitemap, /\/admin/);
    assert.doesNotMatch(sitemap, /\/vendedor/);
    assert.doesNotMatch(sitemap, /\/clientes/);
  });

  it("parses Argentine-formatted real estate prices for structured data", () => {
    assert.deepEqual(parsePriceText("USD 420.000"), {
      currency: "USD",
      value: 420000
    });
    assert.deepEqual(parsePriceText("U$S 145.000"), {
      currency: "USD",
      value: 145000
    });
    assert.deepEqual(parsePriceText("U$D 1.800.000"), {
      currency: "USD",
      value: 1800000
    });
    assert.deepEqual(parsePriceText("$ 480.000 / mes"), {
      currency: "ARS",
      value: 480000
    });
    assert.deepEqual(parsePriceText("€ 120.000"), {
      currency: "EUR",
      value: 120000
    });
    assert.deepEqual(parsePriceText("$U 35.000"), {
      currency: "UYU",
      value: 35000
    });
    assert.equal(parsePriceText("Consultar"), null);
  });
});
