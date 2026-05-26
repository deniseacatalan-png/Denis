import fs from "node:fs";
import path from "node:path";
import { upload } from "@vercel/blob/client";
import { createClient } from "@supabase/supabase-js";
import { readArg, readEnv, requiredEnv } from "./lib/env.mjs";

const cwd = process.cwd();
const env = readEnv(cwd);
const publicDir = path.join(cwd, "public");
const adminEmailDomain = "admin.denise-catalan.local";
const defaultBaseUrl = "https://deniscatalan.vercel.app";
const baseUrl = (readArg("base-url", env.APP_BASE_URL || defaultBaseUrl) || defaultBaseUrl)
  .replace(/\/+$/, "");
const shouldMigrateLocalImages = process.argv.includes("--migrate-local-images");
const shouldVerifyOnly = process.argv.includes("--verify-only");
const shouldDryRun = process.argv.includes("--dry-run");
const maxImageSizeInBytes = 25 * 1024 * 1024;

const imageContentTypes = new Map([
  [".avif", "image/avif"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"]
]);

const stats = {
  properties: 0,
  rows: 0,
  localRows: 0,
  blobRows: 0,
  otherRows: 0,
  uploaded: 0,
  updated: 0,
  skipped: 0
};

function fail(message) {
  console.error(message);
  process.exit(1);
}

function usernameToAdminEmail(username) {
  const normalized = username.trim().toLowerCase();
  return normalized.includes("@") ? normalized : `${normalized}@${adminEmailDomain}`;
}

function isLocalImageUrl(url) {
  return typeof url === "string" && url.startsWith("/images/");
}

function isBlobUrl(url) {
  return typeof url === "string" && /^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\//.test(url);
}

function publicUrlToFilePath(url) {
  const pathname = new URL(url, "https://local.invalid").pathname;
  const decodedParts = pathname.split("/").filter(Boolean).map(decodeURIComponent);
  return path.join(publicDir, ...decodedParts);
}

function slugify(value, fallback = "propiedad") {
  const slug = String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

  return slug || fallback;
}

function blobPathFor(property, imageUrl, index) {
  const filePath = publicUrlToFilePath(imageUrl);
  const originalExtension = path.extname(filePath);
  const extension = originalExtension.toLowerCase() || ".jpg";
  const baseName = path.basename(filePath, originalExtension);
  const safeBaseName = slugify(`${index}-${baseName}`, `imagen-${index}`);
  const propertySlug = slugify(property.slug || property.title);

  return `properties/${propertySlug}/${safeBaseName}${extension}`;
}

async function verifyReachableImage(url) {
  const response = await fetch(url, { method: "HEAD" });
  const contentType = response.headers.get("content-type") || "";

  return {
    ok: response.ok && contentType.startsWith("image/"),
    status: response.status,
    contentType
  };
}

async function uploadLocalImage({ accessToken, image, imageIndex, property }) {
  const filePath = publicUrlToFilePath(image.url);

  if (!fs.existsSync(filePath)) {
    throw new Error(`No encontre el archivo local para ${image.url}`);
  }

  const fileSize = fs.statSync(filePath).size;
  if (fileSize > maxImageSizeInBytes) {
    throw new Error(`${image.url} supera el limite de 25 MB`);
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType = imageContentTypes.get(extension);
  if (!contentType) {
    throw new Error(`Tipo de imagen no permitido para ${image.url}`);
  }

  const pathname = blobPathFor(property, image.url, image.sort_order ?? imageIndex);
  const blob = await upload(pathname, fs.readFileSync(filePath), {
    access: "public",
    handleUploadUrl: `${baseUrl}/api/blob/upload`,
    contentType,
    multipart: fileSize > 4 * 1024 * 1024,
    clientPayload: JSON.stringify({
      accessToken,
      propertyId: property.id
    })
  });

  const reachable = await verifyReachableImage(blob.url);
  if (!reachable.ok) {
    throw new Error(
      `Blob subido pero no verificable (${reachable.status} ${reachable.contentType}): ${blob.url}`
    );
  }

  return blob;
}

async function fetchProperties(supabase) {
  const { data, error } = await supabase
    .from("properties")
    .select(`
      id,
      title,
      slug,
      property_images (
        id,
        url,
        sort_order
      )
    `)
    .order("display_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) throw error;
  return data || [];
}

try {
  requiredEnv(env, [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "ADMIN_USERNAME",
    "ADMIN_PASSWORD"
  ]);
} catch (error) {
  fail(error.message);
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

const email = usernameToAdminEmail(env.ADMIN_USERNAME);
const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
  email,
  password: env.ADMIN_PASSWORD
});

if (signInError || !signInData.session?.access_token || !signInData.user) {
  fail(`No pude iniciar sesion admin: ${signInError?.message || "sin sesion"}`);
}

const { data: profile, error: profileError } = await supabase
  .from("admin_profiles")
  .select("id, username, is_active")
  .eq("id", signInData.user.id)
  .eq("is_active", true)
  .maybeSingle();

if (profileError || !profile) {
  fail(`El usuario autenticado no esta activo como admin: ${profileError?.message || "sin perfil"}`);
}

const properties = await fetchProperties(supabase);
stats.properties = properties.length;

for (const property of properties) {
  const images = [...(property.property_images || [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );

  for (const [imageIndex, image] of images.entries()) {
    stats.rows += 1;

    if (isBlobUrl(image.url)) {
      stats.blobRows += 1;
      continue;
    }

    if (!isLocalImageUrl(image.url)) {
      stats.otherRows += 1;
      continue;
    }

    stats.localRows += 1;

    if (!shouldMigrateLocalImages || shouldVerifyOnly) {
      stats.skipped += 1;
      continue;
    }

    if (shouldDryRun) {
      console.log(`[dry-run] ${property.title}: ${image.url}`);
      stats.skipped += 1;
      continue;
    }

    const blob = await uploadLocalImage({
      accessToken: signInData.session.access_token,
      image,
      imageIndex,
      property
    });
    stats.uploaded += 1;

    const { error: updateError } = await supabase
      .from("property_images")
      .update({ url: blob.url })
      .eq("id", image.id);

    if (updateError) throw updateError;

    stats.updated += 1;
    console.log(`${property.title}: ${image.url} -> ${blob.url}`);
  }
}

const refreshedProperties = await fetchProperties(supabase);
const remainingLocalImages = [];
const nonBlobImages = [];
const unreachableBlobImages = [];

for (const property of refreshedProperties) {
  for (const image of property.property_images || []) {
    if (isLocalImageUrl(image.url)) {
      remainingLocalImages.push({ property: property.title, url: image.url });
      continue;
    }

    if (!isBlobUrl(image.url)) {
      nonBlobImages.push({ property: property.title, url: image.url });
      continue;
    }

    const reachable = await verifyReachableImage(image.url);
    if (!reachable.ok) {
      unreachableBlobImages.push({
        property: property.title,
        url: image.url,
        status: reachable.status,
        contentType: reachable.contentType
      });
    }
  }
}

console.log(JSON.stringify(
  {
    baseUrl,
    mode: shouldMigrateLocalImages ? "migrate-local-images" : "verify",
    admin: profile.username,
    stats,
    remainingLocalImages,
    nonBlobImages,
    unreachableBlobImages
  },
  null,
  2
));

if (
  !shouldDryRun &&
  (remainingLocalImages.length || nonBlobImages.length || unreachableBlobImages.length)
) {
  process.exit(1);
}
