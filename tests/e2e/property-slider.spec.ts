import { expect, test } from "@playwright/test";

const saleProperties = [
  {
    id: "sale-1",
    title: "Casa Arrayanes",
    slug: "casa-arrayanes",
    location: "San Martin de los Andes",
    price: "USD 350.000",
    area: "180 m2",
    category: "venta",
    markerColor: "#b0528c",
    coords: [-40.1573, -71.3526],
    latitude: -40.1573,
    longitude: -71.3526,
    summary: "Primera propiedad de venta para probar el slider.",
    descriptionHtml: "",
    rawDescription: "",
    isPublished: true,
    displayOrder: 1,
    images: ["/images/HAS%20ORILLAS%20DE%20CALEUFU/DJI_0054.JPG"]
  },
  {
    id: "sale-2",
    title: "Lote Lago",
    slug: "lote-lago",
    location: "Lago Lolog",
    price: "USD 120.000",
    area: "800 m2",
    category: "venta",
    markerColor: "#b0528c",
    coords: [-40.1273, -71.2926],
    latitude: -40.1273,
    longitude: -71.2926,
    summary: "Segunda propiedad de venta para validar avance.",
    descriptionHtml: "",
    rawDescription: "",
    isPublished: true,
    displayOrder: 2,
    images: ["/images/TERRENO%20MIRALEJOS/DJI_0444.JPG"]
  },
  {
    id: "sale-3",
    title: "Casona Montana",
    slug: "casona-montana",
    location: "Chapelco",
    price: "USD 480.000",
    area: "260 m2",
    category: "venta",
    markerColor: "#b0528c",
    coords: [-40.1773, -71.3626],
    latitude: -40.1773,
    longitude: -71.3626,
    summary: "Tercera propiedad de venta para validar límites.",
    descriptionHtml: "",
    rawDescription: "",
    isPublished: true,
    displayOrder: 3,
    images: ["/images/HUILQUIL%20CASONA%20DE%20MONTA%C3%91A/DJI_0396.JPG"]
  }
];

const properties = [
  ...saleProperties,
  {
    ...saleProperties[0],
    id: "tourist-1",
    title: "Cabana Turistica",
    slug: "cabana-turistica",
    category: "alquiler_turistico",
    displayOrder: 4
  },
  {
    ...saleProperties[0],
    id: "permanent-1",
    title: "Departamento Permanente",
    slug: "departamento-permanente",
    category: "alquiler_permanente",
    displayOrder: 5
  }
];

async function loadHomeWithFixture(page) {
  await page.route("**/api/properties/public", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ properties })
    });
  });

  await page.goto("/#propiedades");
  const saleSlider = page.getByRole("region", { name: "En venta" });
  await expect(saleSlider.locator(".property-slide.active .property-slide-title")).toHaveText(
    "Casa Arrayanes"
  );
  await saleSlider.locator(".property-slider-viewport").scrollIntoViewIfNeeded();

  return saleSlider;
}

test.describe("property slider", () => {
  test("advances and returns from the full-height image edge controls", async ({ page }) => {
    const saleSlider = await loadHomeWithFixture(page);
    const viewport = saleSlider.locator(".property-slider-viewport");
    const track = saleSlider.locator(".property-slider-track");
    const nextButton = saleSlider.locator(".property-slider-nav--next");
    const previousButton = saleSlider.locator(".property-slider-nav--prev");

    await expect(saleSlider.locator(".property-slider-copy")).toHaveCount(0);
    await expect(saleSlider.locator(".property-slider-counter")).toHaveCount(0);
    await expect(nextButton).toHaveText("");
    await expect(previousButton).toHaveText("");
    await expect(saleSlider.locator(".property-slide.active .property-slide-title")).toHaveText(
      "Casa Arrayanes"
    );

    const edgePoint = async (edge: "left" | "right") => {
      const viewportBox = await viewport.boundingBox();
      expect(viewportBox).not.toBeNull();

      return {
        x: edge === "right" ? viewportBox!.x + viewportBox!.width - 12 : viewportBox!.x + 12,
        y: viewportBox!.y + viewportBox!.height / 2
      };
    };

    const rightEdge = await edgePoint("right");
    await page.mouse.move(rightEdge.x, rightEdge.y);
    await expect
      .poll(() => nextButton.evaluate((button) => getComputedStyle(button).backgroundImage))
      .not.toBe("none");

    await page.mouse.click(rightEdge.x, rightEdge.y);
    await expect(saleSlider.locator(".property-slide.active .property-slide-title")).toHaveText(
      "Lote Lago"
    );
    await expect
      .poll(() => track.evaluate((element) => Math.round(element.scrollLeft)))
      .toBeGreaterThan(0);

    const leftEdge = await edgePoint("left");
    await page.mouse.move(leftEdge.x, leftEdge.y);
    await expect
      .poll(() => previousButton.evaluate((button) => getComputedStyle(button).backgroundImage))
      .not.toBe("none");

    await page.mouse.click(leftEdge.x, leftEdge.y);
    await expect(saleSlider.locator(".property-slide.active .property-slide-title")).toHaveText(
      "Casa Arrayanes"
    );
    await expect
      .poll(() => track.evaluate((element) => Math.round(element.scrollLeft)))
      .toBe(0);
  });
});
