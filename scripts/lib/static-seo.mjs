import fs from "node:fs/promises";
import path from "node:path";

import { CATEGORY_META, propertyPublicPath } from "../../src/utils/properties.js";

export const DEFAULT_SITE_URL = "https://www.denisecatalanbienesraices.com.ar";
export const HOME_TITLE =
  "Denise Catalán Bienes Raíces | Inmobiliaria en San Martín de los Andes";
export const HOME_DESCRIPTION =
  "Denise Catalán Bienes Raíces: inmobiliaria en San Martín de los Andes para compra y venta de casas, departamentos, lotes y terrenos, alquileres permanentes y turísticos.";
export const HOME_IMAGE_PATH = "/ISO%20DC.png";
export const ORGANIZATION_ID = `${DEFAULT_SITE_URL}/#real-estate-agent`;
export const WEBSITE_ID = `${DEFAULT_SITE_URL}/#website`;

const DEFAULT_GENERATED_AT = new Date("2026-06-05T00:00:00.000Z");

function normalizeSiteUrl(siteUrl = DEFAULT_SITE_URL) {
  return String(siteUrl || DEFAULT_SITE_URL).replace(/\/+$/, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeJsonForScript(value) {
  return JSON.stringify(value, null, 2).replace(/</g, "\\u003c");
}

function decodeCommonEntities(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

export function textFromHtml(value) {
  return decodeCommonEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateText(value, maxLength) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;

  const shortened = text.slice(0, maxLength - 1).replace(/\s+\S*$/, "").trim();
  return `${shortened || text.slice(0, maxLength - 1).trim()}…`;
}

function absoluteUrl(siteUrl, value) {
  const url = String(value || "").trim();
  if (!url) return `${normalizeSiteUrl(siteUrl)}${HOME_IMAGE_PATH}`;
  if (/^https?:\/\//i.test(url)) return url;
  return new URL(url.startsWith("/") ? url : `/${url}`, `${normalizeSiteUrl(siteUrl)}/`).href;
}

function propertyCategoryLabel(property) {
  return CATEGORY_META[property?.category]?.label || "Propiedad";
}

function propertyDescriptionSource(property) {
  return (
    property?.summary ||
    property?.rawDescription ||
    textFromHtml(property?.descriptionHtml) ||
    `${property?.title || "Propiedad"} en ${property?.location || "San Martín de los Andes"}`
  );
}

function propertyLocationText(property) {
  return property?.location || "San Martín de los Andes, Neuquén";
}

function propertyLastmod(property, generatedAt = DEFAULT_GENERATED_AT) {
  const value = property?.updatedAt || property?.updated_at || property?.createdAt || property?.created_at;
  const date = value ? new Date(value) : generatedAt;
  const usableDate = Number.isNaN(date.getTime()) ? generatedAt : date;
  return usableDate.toISOString().slice(0, 10);
}

export function parsePriceText(value) {
  const text = String(value || "");
  const numberMatch = text.match(/\d[\d.,]*/);
  if (!numberMatch) return null;

  const currency = /(?:USD|U\$D|US\$|D[ÓO]LAR)/i.test(text)
    ? "USD"
    : /(?:ARS|AR\$|\$)/i.test(text)
      ? "ARS"
      : "";
  if (!currency) return null;

  let normalized = numberMatch[0];
  const commaIndex = normalized.lastIndexOf(",");
  const dotIndex = normalized.lastIndexOf(".");

  if (commaIndex !== -1 && dotIndex !== -1) {
    normalized =
      commaIndex > dotIndex
        ? normalized.replace(/\./g, "").replace(",", ".")
        : normalized.replace(/,/g, "");
  } else if (commaIndex !== -1) {
    const [, decimalPart = ""] = normalized.split(",");
    normalized =
      decimalPart.length === 3 ? normalized.replace(/,/g, "") : normalized.replace(",", ".");
  } else if (dotIndex !== -1) {
    const [, decimalPart = ""] = normalized.split(".");
    normalized = decimalPart.length === 3 ? normalized.replace(/\./g, "") : normalized;
  }

  const priceValue = Number(normalized);
  if (!Number.isFinite(priceValue)) return null;

  return {
    currency,
    value: priceValue
  };
}

export function createPropertySeoMeta(property, options = {}) {
  const siteUrl = normalizeSiteUrl(options.siteUrl);
  const publicPath = propertyPublicPath(property);
  const canonicalUrl = `${siteUrl}${publicPath}`;
  const categoryLabel = propertyCategoryLabel(property);
  const title = truncateText(`${property.title} | ${categoryLabel} en San Martín de los Andes`, 68);
  const location = propertyLocationText(property);
  const description = truncateText(
    `${categoryLabel} en ${location}. ${propertyDescriptionSource(property)}`,
    158
  );
  const imageUrl = absoluteUrl(siteUrl, property?.images?.[0] || HOME_IMAGE_PATH);

  return {
    title,
    description,
    canonicalUrl,
    imageUrl,
    publicPath,
    categoryLabel,
    location,
    homeTitle: HOME_TITLE,
    homeDescription: HOME_DESCRIPTION
  };
}

function propertyGeo(property) {
  const lat = Number(property?.latitude ?? property?.coords?.[0]);
  const lng = Number(property?.longitude ?? property?.coords?.[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    "@type": "GeoCoordinates",
    latitude: lat,
    longitude: lng
  };
}

function propertyOffer(property, meta) {
  const price = parsePriceText(property?.price);
  if (!price) return null;

  return {
    "@type": "Offer",
    url: meta.canonicalUrl,
    price: price.value,
    priceCurrency: price.currency,
    availability:
      property?.category === "vendido"
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
    seller: {
      "@id": ORGANIZATION_ID
    }
  };
}

export function buildPropertyJsonLd(property, options = {}) {
  const meta = createPropertySeoMeta(property, options);
  const geo = propertyGeo(property);
  const offer = propertyOffer(property, meta);
  const propertyId = `${meta.canonicalUrl}#property`;
  const webpageId = `${meta.canonicalUrl}#webpage`;
  const breadcrumbId = `${meta.canonicalUrl}#breadcrumb`;
  const propertyNode = {
    "@type": "Place",
    "@id": propertyId,
    name: property.title,
    description: meta.description,
    url: meta.canonicalUrl,
    image: meta.imageUrl,
    address: {
      "@type": "PostalAddress",
      addressLocality: meta.location,
      addressRegion: "Neuquén",
      addressCountry: "AR"
    },
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Operación",
        value: meta.categoryLabel
      },
      {
        "@type": "PropertyValue",
        name: "Superficie",
        value: property.area || "Superficie a confirmar"
      }
    ]
  };

  if (geo) propertyNode.geo = geo;
  if (offer) propertyNode.offers = offer;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["RealEstateAgent", "LocalBusiness"],
        "@id": ORGANIZATION_ID,
        name: "Denise Catalán Bienes Raíces",
        url: `${normalizeSiteUrl(options.siteUrl)}/`,
        logo: absoluteUrl(options.siteUrl, HOME_IMAGE_PATH),
        telephone: "+5492944688613",
        address: {
          "@type": "PostalAddress",
          addressLocality: "San Martín de los Andes",
          addressRegion: "Neuquén",
          addressCountry: "AR"
        }
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: "Denise Catalán Bienes Raíces",
        url: `${normalizeSiteUrl(options.siteUrl)}/`,
        inLanguage: "es-AR"
      },
      {
        "@type": "WebPage",
        "@id": webpageId,
        url: meta.canonicalUrl,
        name: meta.title,
        description: meta.description,
        inLanguage: "es-AR",
        isPartOf: {
          "@id": WEBSITE_ID
        },
        breadcrumb: {
          "@id": breadcrumbId
        },
        mainEntity: {
          "@id": propertyId
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": breadcrumbId,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Inicio",
            item: `${normalizeSiteUrl(options.siteUrl)}/`
          },
          {
            "@type": "ListItem",
            position: 2,
            name: property.title,
            item: meta.canonicalUrl
          }
        ]
      },
      propertyNode
    ]
  };
}

function upsertHeadTag(html, pattern, tag) {
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

function setTitle(html, title) {
  return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
}

function upsertMeta(html, attribute, name, content) {
  const pattern = new RegExp(
    `<meta\\s+[^>]*${attribute}="${escapeRegExp(name)}"[^>]*>`,
    "i"
  );
  return upsertHeadTag(
    html,
    pattern,
    `<meta ${attribute}="${escapeHtml(name)}" content="${escapeHtml(content)}" />`
  );
}

function upsertCanonical(html, href) {
  return upsertHeadTag(
    html,
    /<link\s+[^>]*rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="${escapeHtml(href)}" />`
  );
}

function setJsonLd(html, jsonLd) {
  const tag = `<script type="application/ld+json">${escapeJsonForScript(jsonLd)}</script>`;
  return upsertHeadTag(
    html,
    /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i,
    tag
  );
}

function buildPropertyFallbackHtml(property, meta) {
  const description = truncateText(propertyDescriptionSource(property), 700);
  const image = property?.images?.[0]
    ? `<img src="${escapeHtml(meta.imageUrl)}" alt="Foto principal de ${escapeHtml(property.title)}" />`
    : "";

  return `<main aria-label="Detalle de propiedad">
        <article>
          ${image}
          <p>${escapeHtml(meta.categoryLabel)}</p>
          <h1>${escapeHtml(property.title)}</h1>
          <p>${escapeHtml(meta.location)}</p>
          <p>${escapeHtml(description)}</p>
          <dl>
            <dt>Valor</dt>
            <dd>${escapeHtml(property.price || "Consultar")}</dd>
            <dt>Superficie</dt>
            <dd>${escapeHtml(property.area || "Superficie a confirmar")}</dd>
          </dl>
          <a href="https://wa.me/5492944688613">Consultar por WhatsApp</a>
        </article>
      </main>`;
}

function setRootFallback(html, fallbackHtml) {
  const replacement = `<div id="root">\n      ${fallbackHtml}\n    </div>`;
  const rootBeforeBodyPattern = /<div id="root">[\s\S]*?<\/div>\s*<\/body>/i;

  if (rootBeforeBodyPattern.test(html)) {
    return html.replace(rootBeforeBodyPattern, `${replacement}\n  </body>`);
  }

  return html.replace(/<div id="root">[\s\S]*?<\/div>/i, replacement);
}

export function buildPropertyStaticHtml(indexHtml, property, options = {}) {
  const meta = createPropertySeoMeta(property, options);
  const jsonLd = buildPropertyJsonLd(property, options);

  let html = setTitle(indexHtml, meta.title);
  html = upsertCanonical(html, meta.canonicalUrl);
  html = upsertMeta(html, "name", "description", meta.description);
  html = upsertMeta(html, "property", "og:type", "article");
  html = upsertMeta(html, "property", "og:title", meta.title);
  html = upsertMeta(html, "property", "og:description", meta.description);
  html = upsertMeta(html, "property", "og:url", meta.canonicalUrl);
  html = upsertMeta(html, "property", "og:image", meta.imageUrl);
  html = upsertMeta(html, "name", "twitter:card", "summary_large_image");
  html = upsertMeta(html, "name", "twitter:title", meta.title);
  html = upsertMeta(html, "name", "twitter:description", meta.description);
  html = upsertMeta(html, "name", "twitter:image", meta.imageUrl);
  html = setJsonLd(html, jsonLd);
  html = setRootFallback(html, buildPropertyFallbackHtml(property, meta));

  return html;
}

export function buildSitemapXml(properties, options = {}) {
  const siteUrl = normalizeSiteUrl(options.siteUrl);
  const generatedAt = options.generatedAt || DEFAULT_GENERATED_AT;
  const publishedProperties = properties.filter((property) => property?.isPublished !== false);
  const entries = [
    {
      loc: `${siteUrl}/`,
      lastmod: generatedAt.toISOString().slice(0, 10),
      changefreq: "weekly",
      priority: "1.0"
    },
    ...publishedProperties.map((property) => ({
      loc: `${siteUrl}${propertyPublicPath(property)}`,
      lastmod: propertyLastmod(property, generatedAt),
      changefreq: "weekly",
      priority: "0.8"
    }))
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${escapeHtml(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;
}

export async function writeStaticSeoFiles({ distDir, properties, siteUrl, generatedAt = new Date() }) {
  const indexPath = path.join(distDir, "index.html");
  const indexHtml = await fs.readFile(indexPath, "utf8");
  const sitemapXml = buildSitemapXml(properties, { siteUrl, generatedAt });

  await fs.writeFile(path.join(distDir, "sitemap.xml"), sitemapXml);

  for (const property of properties.filter((item) => item?.isPublished !== false)) {
    const publicPath = propertyPublicPath(property);
    if (publicPath === "/") continue;

    const propertyDir = path.join(distDir, publicPath.replace(/^\/+|\/+$/g, ""));
    await fs.mkdir(propertyDir, { recursive: true });
    await fs.writeFile(
      path.join(propertyDir, "index.html"),
      buildPropertyStaticHtml(indexHtml, property, { siteUrl })
    );
  }

  return {
    propertyCount: properties.filter((item) => item?.isPublished !== false).length,
    sitemapPath: path.join(distDir, "sitemap.xml")
  };
}
