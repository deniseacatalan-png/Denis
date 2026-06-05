import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("public service request modal", () => {
  it("uses four selectable cards instead of a select control", () => {
    const appSource = readFileSync("src/App.jsx", "utf8");
    const styles = readFileSync("src/styles.css", "utf8");

    for (const serviceValue of ["vender", "alquilar", "invertir", "otros"]) {
      assert.match(appSource, new RegExp(`value: "${serviceValue}"`));
    }

    assert.match(appSource, /SERVICE_OPTIONS\.map/);
    assert.match(appSource, /role="radiogroup"/);
    assert.match(appSource, /className=\{`service-option-card/);
    assert.match(appSource, /function ServiceOptionVisual/);
    assert.match(appSource, /<ServiceOptionVisual icon=\{option\.icon\} \/>/);
    assert.match(appSource, /aria-checked=\{serviceNeed === option\.value\}/);
    assert.doesNotMatch(appSource, /<select[\s\S]*id="service-need"/);

    for (const iconValue of ["sale", "rent", "investment", "custom"]) {
      assert.match(appSource, new RegExp(`icon: "${iconValue}"`));
    }

    assert.match(styles, /\.service-option-grid/);
    assert.match(styles, /\.service-option-card/);
    assert.match(styles, /\.service-option-visual/);
    assert.match(styles, /\.service-option-visual svg/);
    assert.match(styles, /\.service-option-card\.is-selected/);
  });
});
