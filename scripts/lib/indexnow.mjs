import { XMLParser } from "fast-xml-parser";

export const SITE_HOST = "www.denisecatalanbienesraices.com.ar";
export const SITE_URL = `https://${SITE_HOST}`;
export const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
export const INDEXNOW_KEY = "3eb7aa0dd3fadf4521b9f11b09b6869eefcc8d8dd228dd19a716cdf28045d0ec";
export const INDEXNOW_KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`;

const parser = new XMLParser({
  ignoreAttributes: false
});

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizePublicUrl(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  let url;
  try {
    url = new URL(text);
  } catch {
    return "";
  }

  if (url.protocol !== "https:" || url.hostname !== SITE_HOST) return "";
  url.hash = "";
  return url.href;
}

export function extractSitemapUrls(xml) {
  const parsed = parser.parse(String(xml || ""));
  const urlEntries = asArray(parsed?.urlset?.url);

  return urlEntries
    .map((entry) => normalizePublicUrl(entry?.loc))
    .filter(Boolean);
}

export function buildIndexNowPayload(urls) {
  const urlList = [...new Set(urls.map(normalizePublicUrl).filter(Boolean))];

  return {
    host: SITE_HOST,
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    urlList
  };
}

export async function fetchSitemapUrls(fetchImpl = fetch) {
  const response = await fetchImpl(SITEMAP_URL);

  if (!response.ok) {
    throw new Error(`No se pudo leer el sitemap (${response.status}).`);
  }

  return extractSitemapUrls(await response.text());
}

export async function submitIndexNowUrls(urls, fetchImpl = fetch) {
  const payload = buildIndexNowPayload(urls);

  if (!payload.urlList.length) {
    throw new Error("No hay URLs validas del sitio para enviar a IndexNow.");
  }

  const response = await fetchImpl(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(payload)
  });

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    submittedCount: payload.urlList.length,
    payload
  };
}
