import { jsonError } from "@/server/api-response";
import { requireActiveSellerOrAdmin } from "@/server/auth/guards";
import { createSupabaseServiceClient } from "@/server/auth/supabase";

const bucketName = "property-images";
const allowedTypes = new Set(["image/avif", "image/jpeg", "image/png", "image/webp"]);

function safePathPart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function POST(request: Request) {
  try {
    await requireActiveSellerOrAdmin(request);
    const formData = await request.formData();
    const file = formData.get("file");
    const propertySlug = safePathPart(String(formData.get("propertySlug") || "propiedad")) || "propiedad";
    const index = Number(formData.get("index") || 0);

    if (!(file instanceof File) || !file.size) {
      return Response.json({ error: "Falta la imagen." }, { status: 400 });
    }
    if (!allowedTypes.has(file.type)) {
      return Response.json({ error: "Formato de imagen no permitido." }, { status: 415 });
    }
    if (file.size > 50 * 1024 * 1024) {
      return Response.json({ error: "La imagen supera el limite de 50 MB." }, { status: 413 });
    }

    const extension = file.name.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase() || ".jpg";
    const path = `properties/${propertySlug}/${Date.now()}-${Math.max(0, index)}${extension}`;
    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.storage.from(bucketName).upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false
    });

    if (error) throw error;
    const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
    return Response.json({ url: data.publicUrl });
  } catch (error) {
    return jsonError(error, "No se pudo subir la imagen a Supabase.");
  }
}
