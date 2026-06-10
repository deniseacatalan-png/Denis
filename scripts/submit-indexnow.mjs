#!/usr/bin/env node

import {
  INDEXNOW_ENDPOINT,
  INDEXNOW_KEY_LOCATION,
  SITEMAP_URL,
  buildIndexNowPayload,
  fetchSitemapUrls,
  submitIndexNowUrls
} from "./lib/indexnow.mjs";

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const explicitUrls = args.filter((arg) => arg !== "--dry-run");

async function main() {
  const urls = explicitUrls.length ? explicitUrls : await fetchSitemapUrls();
  const payload = buildIndexNowPayload(urls);

  if (isDryRun) {
    console.log(JSON.stringify({
      endpoint: INDEXNOW_ENDPOINT,
      sitemap: explicitUrls.length ? null : SITEMAP_URL,
      keyLocation: INDEXNOW_KEY_LOCATION,
      submittedCount: payload.urlList.length,
      payload
    }, null, 2));
    return;
  }

  const result = await submitIndexNowUrls(payload.urlList);

  if (!result.ok) {
    throw new Error(`IndexNow rechazo el envio (${result.status} ${result.statusText}).`);
  }

  console.log(
    `IndexNow recibio ${result.submittedCount} URLs. Estado: ${result.status} ${result.statusText || "OK"}`
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
