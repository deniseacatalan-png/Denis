import { createClient } from "@supabase/supabase-js";

import { readArg, readEnv, requiredEnv } from "./lib/env.mjs";
import { parsePriceText } from "./lib/static-seo.mjs";

const cwd = process.cwd();
const env = readEnv(cwd);
const dryRun = readArg("dry-run", "true") !== "false";
const batchSize = Math.max(1, Number(readArg("batch-size", "500")) || 500);

requiredEnv(env, ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

function sameValue(left, right) {
  return String(left ?? "") === String(right ?? "");
}

function buildUpdateRow(parsed) {
  return {
    price_amount: parsed.value,
    currency: parsed.currency
  };
}

function parsePriceForBackfill(price) {
  const parsed = parsePriceText(price);
  if (parsed) return parsed;

  const text = String(price || "").trim();
  if (!text) return null;

  if (/^\d[\d.,]*$/.test(text)) {
    const normalized = text.replace(/\./g, "").replace(",", ".");
    const value = Math.round(Number(normalized));
    if (Number.isFinite(value)) {
      return { currency: "USD", value };
    }
  }

  return null;
}

const stats = {
  scanned: 0,
  parsed: 0,
  updated: 0,
  unchanged: 0,
  skipped: 0,
  failed: 0
};
const failedExamples = [];

for (let offset = 0; ; offset += batchSize) {
  const { data, error } = await supabase
    .from("properties")
    .select("id, title, price, price_amount, currency")
    .order("created_at", { ascending: true })
    .range(offset, offset + batchSize - 1);

  if (error) throw error;

  const rows = data || [];
  if (!rows.length) break;

  stats.scanned += rows.length;

  for (const row of rows) {
    const parsed = parsePriceForBackfill(row.price);
    if (!parsed) {
      stats.skipped += 1;
      if (failedExamples.length < 20) {
        failedExamples.push({ title: row.title, price: row.price });
      }
      continue;
    }

    stats.parsed += 1;

    const nextRow = buildUpdateRow(parsed);
    const alreadyMatches =
      Number(row.price_amount) === nextRow.price_amount && sameValue(row.currency || "USD", nextRow.currency);

    if (alreadyMatches) {
      stats.unchanged += 1;
      continue;
    }

    if (dryRun) {
      stats.updated += 1;
      continue;
    }

    const { error: updateError } = await supabase
      .from("properties")
      .update(nextRow)
      .eq("id", row.id);

    if (updateError) {
      stats.failed += 1;
      throw updateError;
    }

    stats.updated += 1;
  }

  if (rows.length < batchSize) break;
}

console.log(
  JSON.stringify(
    {
      dryRun,
      batchSize,
      ...stats,
      failedExamples
    },
    null,
    2
  )
);
