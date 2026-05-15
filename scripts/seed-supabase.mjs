import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { readEnv, requiredEnv } from "./lib/env.mjs";
import { parseKmlProperties } from "./lib/kml-properties.mjs";

const cwd = process.cwd();
const env = readEnv(cwd);
requiredEnv(env, ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

function toPropertyRow(property) {
  return {
    kml_id: property.kmlId,
    title: property.title,
    slug: property.slug,
    location: property.location,
    price: property.price,
    area: property.area,
    category: property.category,
    latitude: property.latitude,
    longitude: property.longitude,
    style_color: property.styleColor,
    marker_color: property.markerColor,
    summary: property.summary,
    description_html: property.descriptionHtml,
    raw_description: property.rawDescription,
    is_published: property.isPublished,
    display_order: property.displayOrder
  };
}

const properties = parseKmlProperties({
  kmlPath: path.join(cwd, "public", "webpropiedades.kml"),
  publicDir: path.join(cwd, "public")
});

for (const property of properties) {
  const { data, error } = await supabase
    .from("properties")
    .upsert(toPropertyRow(property), { onConflict: "kml_id" })
    .select("id")
    .single();

  if (error) throw error;

  const propertyId = data.id;
  const { error: deleteError } = await supabase
    .from("property_images")
    .delete()
    .eq("property_id", propertyId);

  if (deleteError) throw deleteError;

  if (property.images.length) {
    const imageRows = property.images.map((url, index) => ({
      property_id: propertyId,
      url,
      alt: property.title,
      sort_order: index
    }));

    const { error: imageError } = await supabase.from("property_images").insert(imageRows);
    if (imageError) throw imageError;
  }
}

console.log(`Seed complete. Properties loaded: ${properties.length}`);
