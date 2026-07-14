import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "vitest";

import {
  DEFAULT_SITE_URL,
  HOME_TITLE,
  homeJsonLd,
  homeMetadata,
  propertyMetadata
} from "../src/server/seo.ts";

describe("Next SEO metadata", () => {
  it("exposes local real estate SEO metadata from the App Router layout", () => {
    const metadata = homeMetadata();
    const jsonLd = homeJsonLd();
    const layoutSource = readFileSync("src/app/layout.tsx", "utf8");

    assert.equal(metadata.title, HOME_TITLE);
    assert.match(String(metadata.description), /compra y venta de casas, departamentos, lotes y terrenos/i);
    assert.match(String(metadata.description), /alquileres permanentes y tur/i);
    assert.equal(metadata.alternates?.canonical, "/");
    assert.equal(metadata.openGraph?.locale, "es_AR");
    assert.equal(metadata.openGraph?.url, DEFAULT_SITE_URL);
    assert.equal(metadata.verification?.other?.["msvalidate.01"], "6118C32A03A52B21126726471B922963");

    assert.deepEqual(jsonLd["@type"], ["RealEstateAgent", "LocalBusiness"]);
    assert.equal(jsonLd.name, "Denise Catalán Bienes Raíces");
    assert.equal(jsonLd.url, "https://www.denisecatalanbienesraices.com.ar/");
    assert.equal(jsonLd.telephone, "+5492944688613");
    assert.equal(jsonLd.address.addressLocality, "San Martín de los Andes");
    assert.ok(
      jsonLd.areaServed.some((area) => area.name === "San Martín de los Andes"),
      "Expected San Martín de los Andes to be listed as an area served."
    );
    assert.match(layoutSource, /application\/ld\+json/);
  });

  it("robots and sitemap are native Next metadata routes", () => {
    const robotsSource = readFileSync("src/app/robots.ts", "utf8");
    const sitemapSource = readFileSync("src/app/sitemap.ts", "utf8");

    assert.match(robotsSource, /allow:\s*"\/"/);
    assert.match(robotsSource, /disallow:\s*\["\/admin",\s*"\/vendedor",\s*"\/clientes"\]/);
    assert.match(robotsSource, /sitemap:\s*`\$\{DEFAULT_SITE_URL\}\/sitemap\.xml`/);

    assert.match(sitemapSource, /listPublishedProperties/);
    assert.match(sitemapSource, /propertyPublicPath/);
    assert.match(sitemapSource, /lastModified/);
    assert.match(sitemapSource, /property\.updatedAt/);
    assert.doesNotMatch(sitemapSource, /\/admin/);
    assert.doesNotMatch(sitemapSource, /\/vendedor/);
    assert.doesNotMatch(sitemapSource, /\/clientes/);
  });

  it("publishes an IndexNow key and submission script for participating search engines", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
    const indexNowSource = readFileSync("scripts/lib/indexnow.mjs", "utf8");
    const keyMatch = indexNowSource.match(/INDEXNOW_KEY = "([a-f0-9]{64})"/);

    assert.ok(keyMatch, "Expected a 64-character hexadecimal IndexNow key.");
    assert.equal(existsSync(`public/${keyMatch[1]}.txt`), true);
    assert.equal(readFileSync(`public/${keyMatch[1]}.txt`, "utf8").trim(), keyMatch[1]);
    assert.equal(packageJson.scripts["seo:indexnow"], "node scripts/submit-indexnow.mjs");
    assert.match(indexNowSource, /https:\/\/api\.indexnow\.org\/indexnow/);
    assert.match(indexNowSource, /keyLocation/);
  });

  it("public property pages are first-class App Router routes", () => {
    assert.equal(existsSync("src/app/propiedades/[slug]/page.tsx"), true);
    const propertyPage = readFileSync("src/app/propiedades/[slug]/page.tsx", "utf8");

    assert.match(propertyPage, /generateMetadata/);
    assert.match(propertyPage, /getPublishedPropertyBySlug/);
    assert.match(propertyPage, /PublicAppLoader/);
  });

  it("property metadata publishes an absolute social image and Twitter card fields", () => {
    const metadata = propertyMetadata({
      title: "Alquiler permanente Valle Chapelco",
      slug: "alquiler-permanente-valle-chapelco",
      location: "Chapelco, San Martín de los Andes",
      summary: "Casa en alquiler permanente en Valle Chapelco.",
      rawDescription: "",
      images: ["/uploads/properties/valle-chapelco.jpg"]
    });

    assert.equal(metadata.metadataBase?.href, DEFAULT_SITE_URL + "/");
    assert.equal(metadata.alternates?.canonical, "/propiedades/alquiler-permanente-valle-chapelco");
    assert.equal(metadata.openGraph?.type, "article");
    assert.equal(
      metadata.openGraph?.images?.[0]?.url,
      `${DEFAULT_SITE_URL}/api/og/properties/alquiler-permanente-valle-chapelco`
    );
    assert.equal(
      metadata.openGraph?.images?.[0]?.alt,
      "Alquiler permanente Valle Chapelco - Denise Catalán Bienes Raíces"
    );
    assert.equal(metadata.twitter?.card, "summary_large_image");
    assert.equal(
      metadata.twitter?.images?.[0],
      `${DEFAULT_SITE_URL}/api/og/properties/alquiler-permanente-valle-chapelco`
    );
  });

  it("production builds use Next metadata instead of Vite postbuild SEO generation", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

    assert.equal(packageJson.scripts.postbuild, undefined);
    assert.match(packageJson.scripts.build, /next build/);
    assert.equal(existsSync("src/app/sitemap.ts"), true);
    assert.equal(existsSync("src/app/robots.ts"), true);
  });
});
