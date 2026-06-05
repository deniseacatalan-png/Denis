import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";

const cssLayers = [
  "src/styles/design-system.css",
  "src/styles/public-design-system.css",
  "src/styles/crm-design-system.css",
  "src/styles/activity-design-system.css"
];

describe("design system CSS layers", () => {
  it("loads the design system layers after the legacy stylesheet in a stable order", () => {
    const mainSource = readFileSync("src/main.jsx", "utf8");
    const orderedImports = [
      'import "./styles/design-system.css";',
      'import "./styles.css";',
      'import "./styles/public-design-system.css";',
      'import "./styles/crm-design-system.css";',
      'import "./styles/activity-design-system.css";'
    ];

    let lastIndex = -1;
    for (const importLine of orderedImports) {
      const nextIndex = mainSource.indexOf(importLine);
      assert.notEqual(nextIndex, -1, `${importLine} should be present`);
      assert.ok(nextIndex > lastIndex, `${importLine} should load after the previous layer`);
      lastIndex = nextIndex;
    }
  });

  it("keeps public, CRM, and activity overrides in scoped CSS layer files", () => {
    for (const cssLayer of cssLayers) {
      assert.equal(existsSync(cssLayer), true, `${cssLayer} should exist`);
    }

    const foundation = readFileSync("src/styles/design-system.css", "utf8");
    const publicLayer = readFileSync("src/styles/public-design-system.css", "utf8");
    const crmLayer = readFileSync("src/styles/crm-design-system.css", "utf8");
    const activityLayer = readFileSync("src/styles/activity-design-system.css", "utf8");

    assert.match(foundation, /Design System\/colors_and_type\.css/);
    assert.match(publicLayer, /\.page-shell/);
    assert.match(crmLayer, /:where\(\.admin-shell,\s*\.seller-shell\)/);
    assert.match(activityLayer, /:where\(\.admin-shell,\s*\.seller-shell\)\s+\.activity-panel/);
  });

  it("keeps public property sliders full-bleed instead of boxed panels", () => {
    const publicLayer = readFileSync("src/styles/public-design-system.css", "utf8");

    assert.match(publicLayer, /\.page-shell\s+\.properties[\s\S]*width:\s*100vw/);
    assert.match(publicLayer, /\.page-shell\s+\.property-slider-stack[\s\S]*width:\s*100vw/);
    assert.match(publicLayer, /\.page-shell\s+\.property-slider-section[\s\S]*box-shadow:\s*none/);
  });

  it("uses ISO GRAFITO as the public homepage logo", () => {
    const appSource = readFileSync("src/App.jsx", "utf8");

    assert.equal(existsSync("ISO GRAFITO.png"), true, "ISO GRAFITO.png should be available");
    assert.match(appSource, /import logoMark from "\.\.\/ISO GRAFITO\.png";/);
  });

  it("keeps the public map intro hidden and the property preview unpinned by default", () => {
    const appSource = readFileSync("src/App.jsx", "utf8");

    assert.doesNotMatch(appSource, /Geolocalizacion/);
    assert.doesNotMatch(appSource, /Plano de ubicaciones/);
    assert.doesNotMatch(appSource, /permanent=\{property\.id === selectedProperty\.id\}/);
    assert.match(appSource, /const \[pinnedPropertyId, setPinnedPropertyId\]/);
    assert.match(
      appSource,
      /const pinPropertyPreview = \(property\) => \{\s*setPinnedPropertyId\(property\.id\);\s*\};/
    );
  });

  it("keeps map markers clickable above pinned property previews", () => {
    const styles = readFileSync("src/styles.css", "utf8");

    assert.match(styles, /\.map-frame\s+\.leaflet-tooltip-pane[\s\S]*z-index:\s*350/);
    assert.match(styles, /\.map-frame\s+\.leaflet-overlay-pane\s+svg[\s\S]*pointer-events:\s*none/);
    assert.match(styles, /\.map-frame\s+\.leaflet-overlay-pane\s+path\.leaflet-interactive[\s\S]*pointer-events:\s*auto/);
  });

  it("keeps map focus stable when property data refreshes with the same coordinates", () => {
    const appSource = readFileSync("src/App.jsx", "utf8");

    assert.match(appSource, /const \[lat, lng\] = coords;/);
    assert.match(appSource, /map\.flyTo\(\[lat, lng\], 13, \{ duration: 1\.1 \}\);/);
    assert.match(appSource, /\}, \[lat, lng, map\]\);/);
    assert.doesNotMatch(appSource, /\}, \[coords, map\]\);/);
  });
});
