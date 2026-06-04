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
});
