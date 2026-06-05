import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

function readProjectFile(relativePath) {
  return readFile(path.join(projectRoot, relativePath), "utf8");
}

function extractJsonLd(html) {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(match, "Expected homepage to include JSON-LD structured data.");
  return JSON.parse(match[1]);
}

test("homepage exposes local real estate SEO metadata", async () => {
  const html = await readProjectFile("index.html");
  const jsonLd = extractJsonLd(html);

  assert.match(
    html,
    /<title>Denise Catal[aá]n Bienes Ra[ií]ces \| Inmobiliaria en San Mart[ií]n de los Andes<\/title>/
  );
  assert.match(html, /compra y venta de casas, departamentos, lotes y terrenos/i);
  assert.match(html, /alquileres permanentes y tur[ií]sticos/i);
  assert.match(
    html,
    /<link rel="canonical" href="https:\/\/www\.denisecatalanbienesraices\.com\.ar\/" \/>/
  );
  assert.match(
    html,
    /<meta name="msvalidate\.01" content="6118C32A03A52B21126726471B922963" \/>/
  );
  assert.match(
    html,
    /<meta property="og:url" content="https:\/\/www\.denisecatalanbienesraices\.com\.ar\/" \/>/
  );
  assert.match(html, /<meta property="og:locale" content="es_AR" \/>/);

  assert.deepEqual(jsonLd["@type"], ["RealEstateAgent", "LocalBusiness"]);
  assert.equal(jsonLd.name, "Denise Catalán Bienes Raíces");
  assert.equal(jsonLd.url, "https://www.denisecatalanbienesraices.com.ar/");
  assert.equal(jsonLd.telephone, "+5492944688613");
  assert.equal(jsonLd.address.addressLocality, "San Martín de los Andes");
  assert.ok(
    jsonLd.areaServed.some((area) => area.name === "San Martín de los Andes"),
    "Expected San Martín de los Andes to be listed as an area served."
  );
});

test("robots and sitemap expose the public site to search engines", async () => {
  const robots = await readProjectFile("public/robots.txt");
  const sitemap = await readProjectFile("public/sitemap.xml");

  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Allow: \//);
  assert.match(robots, /Disallow: \/admin/);
  assert.match(robots, /Disallow: \/vendedor/);
  assert.match(robots, /Sitemap: https:\/\/www\.denisecatalanbienesraices\.com\.ar\/sitemap\.xml/);

  assert.match(sitemap, /<loc>https:\/\/www\.denisecatalanbienesraices\.com\.ar\/<\/loc>/);
  assert.doesNotMatch(sitemap, /\/admin/);
  assert.doesNotMatch(sitemap, /\/vendedor/);
});
