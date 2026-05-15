import fs from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";
import { createClient } from "@supabase/supabase-js";
import { readEnv, requiredEnv } from "./lib/env.mjs";
import { parseKmlProperties } from "./lib/kml-properties.mjs";

const cwd = process.cwd();
const env = readEnv(cwd);

try {
  requiredEnv(env, ["NEXT_PUBLIC_SUPABASE_URL", "BLOB_READ_WRITE_TOKEN"]);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const projectRef =
  env.SUPABASE_PROJECT_REF ||
  new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];

const imageContentTypes = new Map([
  [".avif", "image/avif"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"]
]);

function publicUrlToFilePath(publicDir, url) {
  const pathname = new URL(url, "https://local.invalid").pathname;
  const decodedParts = pathname.split("/").filter(Boolean).map(decodeURIComponent);
  return path.join(publicDir, ...decodedParts);
}

function blobPathFor(property, imageUrl, index) {
  const pathname = new URL(imageUrl, "https://local.invalid").pathname;
  const extension = path.extname(pathname).toLowerCase();
  const baseName = path.basename(pathname, extension);
  const safeBaseName = `${index}-${baseName}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `properties/${property.slug}/${safeBaseName || `imagen-${index}`}${extension}`;
}

async function fetchServiceRoleKey() {
  if (env.SUPABASE_SERVICE_ROLE_KEY) return env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env.SUPABASE_ACCESS_TOKEN) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY o SUPABASE_ACCESS_TOKEN para actualizar la base."
    );
  }

  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
    headers: {
      Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`
    }
  });

  if (!response.ok) {
    throw new Error(`No pude leer las API keys de Supabase (${response.status}).`);
  }

  const keys = await response.json();
  const serviceKey = keys.find((key) => key.name === "service_role");
  const value = serviceKey?.api_key || serviceKey?.key || serviceKey?.value;

  if (!value) {
    throw new Error("No encontre la service_role key del proyecto.");
  }

  return value;
}

const serviceRoleKey = await fetchServiceRoleKey();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const publicDir = path.join(cwd, "public");
const properties = parseKmlProperties({
  kmlPath: path.join(publicDir, "webpropiedades.kml"),
  publicDir
});

let migratedImages = 0;
let touchedProperties = 0;

for (const property of properties) {
  if (!property.images.length) continue;

  const blobUrls = [];

  for (const [index, imageUrl] of property.images.entries()) {
    const filePath = publicUrlToFilePath(publicDir, imageUrl);

    if (!fs.existsSync(filePath)) {
      console.warn(`Imagen no encontrada: ${imageUrl}`);
      continue;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentType = imageContentTypes.get(extension) || "application/octet-stream";
    const pathname = blobPathFor(property, imageUrl, index);
    const blob = await put(pathname, fs.readFileSync(filePath), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
      token: env.BLOB_READ_WRITE_TOKEN
    });

    blobUrls.push(blob.url);
    migratedImages += 1;
  }

  if (!blobUrls.length) continue;

  const { data: dbProperty, error: propertyError } = await supabase
    .from("properties")
    .select("id")
    .eq("kml_id", property.kmlId)
    .single();

  if (propertyError) throw propertyError;

  const { error: deleteError } = await supabase
    .from("property_images")
    .delete()
    .eq("property_id", dbProperty.id);

  if (deleteError) throw deleteError;

  const imageRows = blobUrls.map((url, index) => ({
    property_id: dbProperty.id,
    url,
    alt: property.title,
    sort_order: index
  }));

  const { error: insertError } = await supabase.from("property_images").insert(imageRows);
  if (insertError) throw insertError;

  touchedProperties += 1;
  console.log(`${property.title}: ${blobUrls.length} imagenes migradas`);
}

console.log(
  `Migracion completa. Propiedades actualizadas: ${touchedProperties}. Imagenes subidas: ${migratedImages}.`
);
