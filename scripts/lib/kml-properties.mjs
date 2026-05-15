import fs from "node:fs";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";

export const CATEGORY_META = {
  venta: {
    label: "En venta",
    mapColor: "#a65774"
  },
  alquiler_turistico: {
    label: "Alquiler turistico",
    mapColor: "#e45858"
  },
  vendido: {
    label: "Vendido",
    mapColor: "#161616"
  },
  proceso: {
    label: "En proceso / sin valor",
    mapColor: "#c9a227"
  }
};

const IMAGE_EXTENSION_PATTERN = /\.(avif|jpe?g|png|webp)$/i;

const AREA_OVERRIDES = {
  "HAS ORILLAS DE CALEUFU": "13.000 m²",
  "LOTES KALEUCHE ALTO": "700 m²",
  "LOTE CJN BELLO": "800 m²",
  "LOTE ALIHUEN ALTO": "1.700 m²",
  "LOTE KALEUCHE MEDIO": "1.135 m²",
  "LOTE VEGA MAIPU": "1.178 m²",
  "LOTE ZONA CENTRO": "229,52 m²",
  "LOTE 102, ESTANCIA MIRALEJOS CLUB DE CAMPO": "6.849 m²",
  "LOTE 42, ESTANCIA MIRALEJOS CLUB DE CAMPO": "2.507 m²"
};

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function nodeText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return value.__cdata || value.__text || "";
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

function htmlToText(html) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateText(text, maxLength = 210) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}...`;
}

function extractPrice(text) {
  const normalizeCurrency = (value) =>
    value
      .replace(/U\$S/gi, "USD")
      .replace(/U\$D/gi, "USD")
      .replace(/u\$s/gi, "USD")
      .replace(/u\$d/gi, "USD")
      .replace(/\s+/g, " ")
      .trim();

  const pricePatterns = [
    /(?:U\$D|USD|U\$S)\s*[0-9][0-9.,]*(?:\s*(?:mil|millones?))?/i,
    /valor[:\s]*((?:U\$D|USD|U\$S)\s*[0-9][0-9.,]*(?:\s*(?:mil|millones?))?)/i
  ];

  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match) return normalizeCurrency(match[1] || match[0]);
  }

  const fallback = text.match(/\b(?:U\$D|USD|U\$S)\b[\s:]*[0-9][0-9.,]*(?:\s*(?:mil|millones?))?/i);
  return fallback ? normalizeCurrency(fallback[0]) : "Consultar";
}

function extractArea(text) {
  const patterns = [
    /\b[0-9][0-9.,]*\s?(?:m²|m2)(?:\s*cubiertos?)?/i,
    /\b[0-9][0-9.,]*\s?ha\b/i,
    /\b[0-9][0-9.,]*\s?hect[aá]reas?\b/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0].replace(/\s+/g, " ").trim();
  }

  return "Superficie a confirmar";
}

function resolveArea(title, text) {
  return AREA_OVERRIDES[title] || extractArea(text);
}

function extractLocation(text, title) {
  const locationMatch = text.match(
    /Ubicaci[oó]n:\s*(.*?)(?=\s*(?:Superficie|Servicios|Caracter[ií]sticas|Valor|Frente|Distribuci[oó]n|Acceso|Amenities|Usos|FOS|FOT|Opcion|Opción|Capacidad|Terreno|Lote|Casa|Departamento|$))/i
  );
  if (locationMatch) return locationMatch[1].replace(/\s+/g, " ").trim();

  if (/miralejos/i.test(title)) return "Estancia Miralejos, San Martin de los Andes";
  if (/kaleuche/i.test(title)) return "Kaleuche, San Martin de los Andes";
  if (/vega/i.test(title)) return "Vega Maipu, San Martin de los Andes";

  return "San Martin de los Andes, Neuquen";
}

function buildCategory(text, styleColor) {
  if (styleColor === "ab47bc" || styleColor === "ff78c4") return "venta";
  if (styleColor === "ffee58") return "proceso";
  if (styleColor === "000000") return "vendido";
  if (styleColor === "ef5350") return "alquiler_turistico";
  if (/tur[ií]stic|temporada|pax/i.test(text)) return "alquiler_turistico";
  if (/no se vende/i.test(text) || /ya se vend/i.test(text)) return "vendido";
  if (/antes del .*ingresa a la venta/i.test(text) || /valor cerrado/i.test(text)) return "proceso";
  return "venta";
}

function normalizeKmlColor(styleColor, fallback = "#a65774") {
  const color = (styleColor || "").replace(/[^a-f0-9]/gi, "").toLowerCase();
  if (!color) return fallback;
  if (color.length === 6) return `#${color}`;
  if (color.length === 8) return `#${color.slice(6, 8)}${color.slice(4, 6)}${color.slice(2, 4)}`;
  return fallback;
}

function styleColorMapFor(document) {
  const styleColorMap = {};

  for (const style of asArray(document["gx:CascadingStyle"])) {
    const styleId = style["kml:id"] || style.id || "";
    if (!styleId) continue;

    const href = nodeText(style.Style?.IconStyle?.Icon?.href);
    const hrefColor = href.match(/color=([a-z0-9]+)/i)?.[1]?.toLowerCase() || "";
    const iconColor = nodeText(style.Style?.IconStyle?.color).trim().toLowerCase();
    const color = hrefColor || iconColor;
    if (!color) continue;

    styleColorMap[styleId.replace(/_normal$/i, "")] = color;
    styleColorMap[styleId] = color;
  }

  for (const styleMap of asArray(document.StyleMap)) {
    const styleMapId = styleMap.id || styleMap["kml:id"] || "";
    if (!styleMapId) continue;

    const normalPair = asArray(styleMap.Pair).find((pair) => nodeText(pair.key).trim() === "normal");
    const normalStyleUrl = nodeText(normalPair?.styleUrl).trim().replace(/^#/, "");
    if (normalStyleUrl && styleColorMap[normalStyleUrl]) {
      styleColorMap[styleMapId] = styleColorMap[normalStyleUrl];
    }
  }

  return styleColorMap;
}

function publicUrlForImage(publicDir, filePath) {
  const relativePath = path.relative(publicDir, filePath);
  return `/${relativePath.split(path.sep).map(encodeURIComponent).join("/")}`;
}

function readImageFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return readImageFiles(entryPath);
    if (!IMAGE_EXTENSION_PATTERN.test(entry.name)) return [];
    return [entryPath];
  });
}

function buildImageLibrary(publicDir) {
  const imagesDir = path.join(publicDir, "images");
  const imageFiles = readImageFiles(imagesDir);

  return imageFiles.reduce((acc, imagePath) => {
    const folderSlug = slugify(path.basename(path.dirname(imagePath)));
    if (!folderSlug) return acc;
    if (!acc[folderSlug]) acc[folderSlug] = [];
    acc[folderSlug].push(publicUrlForImage(publicDir, imagePath));
    return acc;
  }, {});
}

function resolvePropertyImages(property, imageLibrary) {
  const normalizedTitle = slugify(property.title || "");
  const normalizedLocation = slugify(property.location || "");
  const titleTokens = normalizedTitle.split("-").filter((token) => token.length > 1);
  const locationTokens = normalizedLocation.split("-").filter((token) => token.length > 2);

  let bestScore = 0;
  let bestImages = [];

  if (imageLibrary[normalizedTitle]) return imageLibrary[normalizedTitle];

  for (const [folderSlug, images] of Object.entries(imageLibrary)) {
    const folderTokens = folderSlug.split("-").filter((token) => token.length > 1);
    const titleHits = folderTokens.filter((token) => titleTokens.includes(token)).length;
    const locationHits = folderTokens.filter((token) => locationTokens.includes(token)).length;
    const score = titleHits * 3 + locationHits;
    const hasStrongTitleMatch = titleHits >= 2 || normalizedTitle.includes(folderSlug);

    if (hasStrongTitleMatch && score > bestScore) {
      bestScore = score;
      bestImages = images;
    }
  }

  return bestImages;
}

export function parseKmlProperties({ kmlPath, publicDir }) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    cdataPropName: "__cdata",
    textNodeName: "__text"
  });
  const xml = fs.readFileSync(kmlPath, "utf8");
  const document = parser.parse(xml).kml.Document;
  const styleColorMap = styleColorMapFor(document);
  const imageLibrary = buildImageLibrary(publicDir);

  return asArray(document.Placemark)
    .map((placemark, index) => {
      const title = nodeText(placemark.name).trim() || `Propiedad ${index + 1}`;
      const descriptionHtml = nodeText(placemark.description).trim();
      const coordinatesText = nodeText(placemark.Point?.coordinates).trim();
      const styleUrl = nodeText(placemark.styleUrl).trim();
      const styleColor = styleColorMap[styleUrl.replace(/^#/, "")] || "";
      const [lngText, latText] = coordinatesText.split(",");
      const latitude = Number.parseFloat(latText);
      const longitude = Number.parseFloat(lngText);
      const rawDescription = htmlToText(descriptionHtml);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

      const inferredCategory = buildCategory(rawDescription, styleColor);
      const isHuilquilTouristic = /huilquil\s+casona?\s+de\s+montaña/i.test(title);
      const category = isHuilquilTouristic
        ? "alquiler_turistico"
        : inferredCategory === "alquiler_turistico"
          ? "venta"
          : inferredCategory;
      const property = {
        kmlId: placemark.id || `${slugify(title)}-${index + 1}`,
        title,
        slug: slugify(title),
        location: extractLocation(rawDescription, title),
        price: category === "proceso" ? "Sin valor" : extractPrice(rawDescription),
        area: resolveArea(title, rawDescription),
        category,
        latitude,
        longitude,
        styleColor,
        markerColor: normalizeKmlColor(styleColor, CATEGORY_META[category]?.mapColor || "#a65774"),
        summary: truncateText(rawDescription),
        descriptionHtml,
        rawDescription,
        isPublished: category === "venta" || category === "alquiler_turistico",
        displayOrder: index
      };

      return {
        ...property,
        images: resolvePropertyImages(property, imageLibrary)
      };
    })
    .filter(Boolean);
}
