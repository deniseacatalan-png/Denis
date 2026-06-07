export const CATEGORY_META = {
  venta: {
    label: "En venta",
    color: "#b0528c",
    mapColor: "#b0528c"
  },
  alquiler_turistico: {
    label: "Alquiler turistico",
    color: "#8e6a96",
    mapColor: "#8e6a96"
  },
  alquiler_permanente: {
    label: "Alquiler permanente",
    color: "#6e4f82",
    mapColor: "#6e4f82"
  },
  vendido: {
    label: "Vendido",
    color: "#4d3661",
    mapColor: "#4d3661"
  },
  proceso: {
    label: "En proceso / sin valor",
    color: "#c0a0cf",
    mapColor: "#c0a0cf"
  }
};

export const ADMIN_PROPERTY_TYPE_TABS = [
  {
    id: "venta",
    label: "Venta",
    categories: ["venta", "vendido", "proceso"]
  },
  {
    id: "alquiler_turistico",
    label: CATEGORY_META.alquiler_turistico.label,
    categories: ["alquiler_turistico"]
  },
  {
    id: "alquiler_permanente",
    label: CATEGORY_META.alquiler_permanente.label,
    categories: ["alquiler_permanente"]
  }
];

const legacyCategoryMarkerColors = {
  "#a86f7a": "venta",
  "#8a6a4f": "alquiler_turistico",
  "#7b8061": "alquiler_permanente",
  "#2f4f3e": "vendido",
  "#d8bf8f": "proceso"
};

function categoryMarkerColor(category) {
  return CATEGORY_META[category]?.mapColor || CATEGORY_META.venta.mapColor;
}

function normalizeMarkerColor(value, category) {
  const markerColor = String(value || "").trim();
  if (!markerColor) return categoryMarkerColor(category);

  const legacyCategory = legacyCategoryMarkerColors[markerColor.toLowerCase()];
  return legacyCategory === category ? categoryMarkerColor(category) : markerColor;
}

export function slugify(value, maxLength = Number.POSITIVE_INFINITY) {
  const normalized = String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return Number.isFinite(maxLength) ? normalized.slice(0, maxLength) : normalized;
}

function propertySlugValue(property) {
  return slugify(property?.slug || property?.title || property?.id || "");
}

export function propertyPublicPath(property) {
  const slug = propertySlugValue(property);
  return slug ? `/propiedades/${slug}` : "/";
}

export function findPropertyByPublicPath(properties, pathname = "") {
  const path = String(pathname || "").split(/[?#]/)[0];
  const match = path.match(/^\/propiedades\/([^/]+)\/?$/);
  if (!match) return null;

  const routeSlug = slugify(decodeURIComponent(match[1]));
  if (!routeSlug) return null;

  return properties.find((property) => propertySlugValue(property) === routeSlug) || null;
}

export function propertyShareData(property, origin = "") {
  const title = property?.title || "Propiedad Denise Catalán";
  const location = property?.location || "San Martín de los Andes";
  const publicPath = propertyPublicPath(property);
  const baseUrl = String(origin || "").trim();
  const url = baseUrl ? new URL(publicPath, `${baseUrl.replace(/\/+$/, "")}/`).href : publicPath;

  return {
    title,
    text: `Compartir propiedad: ${title} en ${location}.`,
    url
  };
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collectSearchValues(value, values = [], seen = new Set()) {
  if (value === null || value === undefined) return values;

  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") {
    values.push(String(value));
    return values;
  }

  if (typeof value === "boolean") {
    values.push(value ? "true si" : "false no");
    return values;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectSearchValues(item, values, seen));
    return values;
  }

  if (typeof value === "object") {
    if (seen.has(value)) return values;
    seen.add(value);
    Object.values(value).forEach((item) => collectSearchValues(item, values, seen));
  }

  return values;
}

function levenshteinDistance(firstValue, secondValue) {
  if (firstValue === secondValue) return 0;
  if (!firstValue.length) return secondValue.length;
  if (!secondValue.length) return firstValue.length;

  const previous = Array.from({ length: secondValue.length + 1 }, (_, index) => index);
  const current = new Array(secondValue.length + 1);

  for (let firstIndex = 0; firstIndex < firstValue.length; firstIndex += 1) {
    current[0] = firstIndex + 1;

    for (let secondIndex = 0; secondIndex < secondValue.length; secondIndex += 1) {
      const substitutionCost = firstValue[firstIndex] === secondValue[secondIndex] ? 0 : 1;

      current[secondIndex + 1] = Math.min(
        current[secondIndex] + 1,
        previous[secondIndex + 1] + 1,
        previous[secondIndex] + substitutionCost
      );
    }

    previous.splice(0, previous.length, ...current);
  }

  return previous[secondValue.length];
}

function maxDistanceForToken(token) {
  if (token.length <= 2) return 0;
  if (token.length <= 4) return 1;
  if (token.length <= 8) return 2;
  return 3;
}

function buildPropertySearchText(property) {
  const categoryLabel = CATEGORY_META[property?.category]?.label || "";
  const publishedLabel = property?.isPublished ? "publicada visible activa" : "oculta no publicada inactiva";
  return normalizeSearchText([
    ...collectSearchValues(property),
    categoryLabel,
    publishedLabel
  ].join(" "));
}

function wordMatchesToken(word, token) {
  if (word.includes(token) || token.includes(word)) return true;

  if (Math.abs(word.length - token.length) > maxDistanceForToken(token)) return false;

  return levenshteinDistance(word, token) <= maxDistanceForToken(token);
}

export function propertyMatchesSearch(property, query) {
  const tokens = normalizeSearchText(query).split(" ").filter(Boolean);
  if (!tokens.length) return true;

  const searchText = buildPropertySearchText(property);
  if (!searchText) return false;

  const words = searchText.split(" ").filter(Boolean);

  return tokens.every((token) => searchText.includes(token) || words.some((word) => wordMatchesToken(word, token)));
}

export function filterPropertiesBySearch(properties, query) {
  const tokens = normalizeSearchText(query).split(" ").filter(Boolean);
  if (!tokens.length) return properties;

  return properties.filter((property) => propertyMatchesSearch(property, query));
}

function adminPropertyTypeTab(typeId) {
  return ADMIN_PROPERTY_TYPE_TABS.find((tab) => tab.id === typeId) || ADMIN_PROPERTY_TYPE_TABS[0];
}

export function filterAdminPropertiesByType(properties, typeId) {
  const tab = adminPropertyTypeTab(typeId);
  const categories = new Set(tab.categories);

  return properties.filter((property) => categories.has(property.category));
}

export function getAdminPropertyTypeTabs(properties) {
  return ADMIN_PROPERTY_TYPE_TABS.map((tab) => ({
    id: tab.id,
    label: tab.label,
    count: filterAdminPropertiesByType(properties, tab.id).length
  }));
}

const publicPropertyCategories = new Set(Object.keys(CATEGORY_META));

function displayOrderValue(property) {
  const order = Number(property?.displayOrder);
  return Number.isFinite(order) ? order : 0;
}

function titleValue(property) {
  return String(property?.title || "");
}

export function getVisiblePublicProperties(properties) {
  return [...properties]
    .filter((property) => publicPropertyCategories.has(property.category))
    .sort((first, second) => {
      const orderDifference = displayOrderValue(first) - displayOrderValue(second);
      if (orderDifference !== 0) return orderDifference;

      return titleValue(first).localeCompare(titleValue(second), "es", { sensitivity: "base" });
    });
}

export function getPublicSelectedPropertyId(properties, currentId = "") {
  const visibleProperties = getVisiblePublicProperties(properties);
  if (!visibleProperties.length) return "";

  return visibleProperties.some((property) => property.id === currentId)
    ? currentId
    : visibleProperties[0].id;
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
    markerColor: normalizeMarkerColor(row.marker_color, row.category),
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
    marker_color: normalizeMarkerColor(values.markerColor, values.category),
    summary: values.summary.trim(),
    description_html: values.descriptionHtml.trim(),
    raw_description: values.rawDescription.trim(),
    is_published: Boolean(values.isPublished),
    display_order: Number(values.displayOrder) || 0
  };
}
