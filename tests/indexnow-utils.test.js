import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  INDEXNOW_ENDPOINT,
  INDEXNOW_KEY,
  INDEXNOW_KEY_LOCATION,
  SITE_HOST,
  buildIndexNowPayload,
  extractSitemapUrls
} from "../scripts/lib/indexnow.mjs";

describe("IndexNow submission helpers", () => {
  it("builds the ownership-verified IndexNow payload for public URLs", () => {
    const payload = buildIndexNowPayload([
      "https://www.denisecatalanbienesraices.com.ar/",
      "https://www.denisecatalanbienesraices.com.ar/propiedades/casa-vega-san-martin",
      "https://other.example.com/nope",
      "/relative"
    ]);

    assert.equal(INDEXNOW_ENDPOINT, "https://api.indexnow.org/indexnow");
    assert.equal(payload.host, SITE_HOST);
    assert.equal(payload.key, INDEXNOW_KEY);
    assert.equal(payload.keyLocation, INDEXNOW_KEY_LOCATION);
    assert.deepEqual(payload.urlList, [
      "https://www.denisecatalanbienesraices.com.ar/",
      "https://www.denisecatalanbienesraices.com.ar/propiedades/casa-vega-san-martin"
    ]);
  });

  it("extracts loc entries from a sitemap XML document", () => {
    const urls = extractSitemapUrls(`<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://www.denisecatalanbienesraices.com.ar/</loc></url>
        <url><loc>https://www.denisecatalanbienesraices.com.ar/map</loc></url>
      </urlset>`);

    assert.deepEqual(urls, [
      "https://www.denisecatalanbienesraices.com.ar/",
      "https://www.denisecatalanbienesraices.com.ar/map"
    ]);
  });
});
