import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "vitest";

describe("public service request modal", () => {
  it("opens WhatsApp from each service card and uses an icon-only close button", () => {
    const appSource = readFileSync("src/App.jsx", "utf8");
    const styles = readFileSync("src/styles.css", "utf8");

    for (const serviceValue of ["vender", "alquilar", "invertir", "otros"]) {
      assert.match(appSource, new RegExp(`value: "${serviceValue}"`));
    }

    assert.match(appSource, /SERVICE_OPTIONS\.map/);
    assert.match(appSource, /className="service-option-card"/);
    assert.match(appSource, /function ServiceOptionVisual/);
    assert.match(appSource, /<ServiceOptionVisual icon=\{option\.icon\} \/>/);
    assert.match(appSource, /href=\{createServiceWhatsAppLink\(option\.value\)\}/);
    assert.match(appSource, /aria-label=\{`Solicitar servicio de \$\{option\.label\} por WhatsApp`\}/);
    assert.match(appSource, /className="service-modal-close"/);
    assert.match(appSource, /aria-label="Cerrar"/);
    assert.match(appSource, />\s*×\s*<\/button>/);
    assert.doesNotMatch(appSource, /<select[\s\S]*id="service-need"/);
    assert.doesNotMatch(appSource, /role="radiogroup"/);
    assert.doesNotMatch(appSource, /role="radio"/);
    assert.doesNotMatch(appSource, /aria-checked=/);
    assert.doesNotMatch(appSource, /onClick=\{\(\) => setServiceNeed\(option\.value\)\}/);
    assert.doesNotMatch(appSource, /Ir a WhatsApp/);

    for (const iconValue of ["sale", "rent", "investment", "custom"]) {
      assert.match(appSource, new RegExp(`icon: "${iconValue}"`));
    }

    assert.match(styles, /\.service-option-grid/);
    assert.match(styles, /\.service-option-card/);
    assert.match(styles, /\.service-option-visual/);
    assert.match(styles, /\.service-option-visual svg/);
    assert.match(styles, /\.service-modal-close/);
    assert.match(styles, /left: 1rem;/);
  });
});
