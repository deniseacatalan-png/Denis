import { createClient } from "@supabase/supabase-js";

import { readEnv, requiredEnv } from "./lib/env.mjs";
import { writeStaticSeoFiles } from "./lib/static-seo.mjs";
import {
  getVisiblePublicProperties,
  normalizeDatabaseProperty
} from "../src/utils/properties.js";

const PROPERTY_SELECT = `
  id,
  kml_id,
  title,
  slug,
  location,
  price,
  area,
  category,
  latitude,
  longitude,
  marker_color,
  summary,
  description_html,
  raw_description,
  is_published,
  display_order,
  created_at,
  updated_at,
  property_images (
    id,
    url,
    alt,
    sort_order
  )
`;

function normalizeSeoProperty(row) {
  return {
    ...normalizeDatabaseProperty(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function fetchPublishedProperties(env) {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );

  const { data, error } = await supabase
    .from("properties")
    .select(PROPERTY_SELECT)
    .eq("is_published", true)
    .order("display_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) throw error;

  return getVisiblePublicProperties((data || []).map(normalizeSeoProperty));
}

async function main() {
  const cwd = process.cwd();
  const env = readEnv(cwd);
  requiredEnv(env, ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]);

  const siteUrl = env.SITE_URL || "https://www.denisecatalanbienesraices.com.ar";
  const properties = await fetchPublishedProperties(env);
  const result = await writeStaticSeoFiles({
    distDir: `${cwd}/dist`,
    properties,
    siteUrl,
    generatedAt: new Date()
  });

  console.log(
    `SEO estatico generado: ${result.propertyCount} propiedades y sitemap en ${result.sitemapPath}`
  );
}

main().catch((error) => {
  console.error("No se pudo generar el SEO estatico.");
  console.error(error);
  process.exit(1);
});
