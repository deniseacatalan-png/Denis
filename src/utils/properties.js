export const CATEGORY_META = {
  venta: {
    label: "En venta",
    color: "#a86f7a",
    mapColor: "#a86f7a"
  },
  alquiler_turistico: {
    label: "Alquiler turistico",
    color: "#8a6a4f",
    mapColor: "#8a6a4f"
  },
  alquiler_permanente: {
    label: "Alquiler permanente",
    color: "#7b8061",
    mapColor: "#7b8061"
  },
  vendido: {
    label: "Vendido",
    color: "#2f4f3e",
    mapColor: "#2f4f3e"
  },
  proceso: {
    label: "En proceso / sin valor",
    color: "#d8bf8f",
    mapColor: "#d8bf8f"
  }
};

export function slugify(value, maxLength = Number.POSITIVE_INFINITY) {
  const normalized = String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return Number.isFinite(maxLength) ? normalized.slice(0, maxLength) : normalized;
}

export function normalizeDatabaseProperty(row) {
  const images = [...(row.property_images || [])]
    .sort((first, second) => (first.sort_order || 0) - (second.sort_order || 0))
    .map((image) => image.url);

  return {
    id: row.id,
    databaseId: row.id,
    kmlId: row.kml_id || "",
    title: row.title,
    slug: row.slug,
    location: row.location,
    price: row.price || "Consultar",
    area: row.area || "Superficie a confirmar",
    category: row.category,
    markerColor: row.marker_color || CATEGORY_META[row.category]?.mapColor || "#a65774",
    coords: [Number(row.latitude), Number(row.longitude)],
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    descriptionHtml: row.description_html || "",
    summary: row.summary || "",
    rawDescription: row.raw_description || "",
    isPublished: row.is_published,
    displayOrder: row.display_order || 0,
    images
  };
}

export function propertyToDatabasePayload(values) {
  const title = values.title.trim();
  const lat = Number(values.latitude);
  const lng = Number(values.longitude);

  return {
    title,
    slug: values.slug?.trim() || slugify(title),
    location: values.location.trim(),
    price: values.price.trim() || "Consultar",
    area: values.area.trim() || "Superficie a confirmar",
    category: values.category,
    latitude: Number.isFinite(lat) ? lat : null,
    longitude: Number.isFinite(lng) ? lng : null,
    marker_color: values.markerColor.trim() || CATEGORY_META[values.category]?.mapColor || "#a65774",
    summary: values.summary.trim(),
    description_html: values.descriptionHtml.trim(),
    raw_description: values.rawDescription.trim(),
    is_published: Boolean(values.isPublished),
    display_order: Number(values.displayOrder) || 0
  };
}
