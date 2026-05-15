import { handleUpload } from "@vercel/blob/client";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const allowedContentTypes = [
  "image/avif",
  "image/jpeg",
  "image/png",
  "image/webp"
];

function parseClientPayload(clientPayload) {
  if (!clientPayload) return {};

  try {
    return JSON.parse(clientPayload);
  } catch {
    throw new Error("Payload de subida invalido.");
  }
}

async function verifyAdmin(clientPayload) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Faltan variables publicas de Supabase.");
  }

  const payload = parseClientPayload(clientPayload);
  const accessToken = payload.accessToken;

  if (!accessToken) {
    throw new Error("Tenes que iniciar sesion para subir imagenes.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);

  if (userError || !userData.user) {
    throw new Error("La sesion de administrador no es valida.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("admin_profiles")
    .select("id")
    .eq("id", userData.user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error("El usuario no tiene permiso para subir imagenes.");
  }

  return {
    propertyId: payload.propertyId || null,
    userId: userData.user.id
  };
}

export default async function handler(request) {
  if (request.method && request.method !== "POST") {
    return Response.json({ error: "Metodo no permitido." }, { status: 405 });
  }

  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("Falta BLOB_READ_WRITE_TOKEN para subir imagenes a Vercel Blob.");
    }

    const body = await request.json();

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const tokenPayload = await verifyAdmin(clientPayload);

        if (!pathname.startsWith("properties/")) {
          throw new Error("Las imagenes deben guardarse dentro de properties/.");
        }

        return {
          allowedContentTypes,
          addRandomSuffix: true,
          maximumSizeInBytes: 25 * 1024 * 1024,
          tokenPayload: JSON.stringify(tokenPayload)
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("Imagen subida a Vercel Blob", blob.url);
      }
    });

    return Response.json(jsonResponse);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
