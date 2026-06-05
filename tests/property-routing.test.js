import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

test("Vercel normalizes trailing slashes before serving public property routes", async () => {
  const vercelConfig = JSON.parse(
    await readFile(path.join(projectRoot, "vercel.json"), "utf8")
  );

  assert.equal(vercelConfig.trailingSlash, false);
});
