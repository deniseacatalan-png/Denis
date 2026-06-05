import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "vitest";

test("Next handles public property routes without Vercel SPA rewrites", () => {
  assert.equal(existsSync("src/app/propiedades/[slug]/page.tsx"), true);

  const nextConfig = readFileSync("next.config.ts", "utf8");
  assert.match(nextConfig, /trailingSlash:\s*false/);

  const vercelConfig = JSON.parse(readFileSync("vercel.json", "utf8"));
  assert.equal(vercelConfig.trailingSlash, false);
  assert.equal(vercelConfig.rewrites, undefined);
});
