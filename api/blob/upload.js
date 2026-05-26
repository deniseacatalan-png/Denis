import { handleUpload } from "@vercel/blob/client";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const maxImageSizeInBytes = 25 * 1024 * 1024;
const supabaseRequestTimeoutMs = 10_000;

const allowedContentTypes = [
  "image/avif",
  "image/jpeg",
  "image/png",
  "image/webp"
];

class UploadRouteError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function isJsonRequest(request) {
  const contentType = request.headers.get("content-type") || "";
  return contentType.toLowerCase().includes("application/json");
}

async function readUploadBody(request) {
  if (!isJsonRequest(request)) {
    throw new UploadRouteError(
      "La ruta de subida espera JSON de Vercel Blob, no el archivo completo.",
      415
    );
  }

  return request.json();
}

async function fetchWithTimeout(input, init = {}) {
  const controller = new AbortController();
  const upstreamSignal = init.signal;
  let didTimeout = false;

  const timeout = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, supabaseRequestTimeoutMs);

  const abortFromUpstream = () => controller.abort(upstreamSignal.reason);
  if (upstreamSignal) {
    if (upstreamSignal.aborted) {
      abortFromUpstream();
    } else {
      upstreamSignal.addEventListener("abort", abortFromUpstream, { once: true });
    }
  }

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal
    });
  } catch (error) {
    if (didTimeout) {
      throw new Error(
        "Supabase no respondio a tiempo. Revisa las variables publicas de Supabase en Vercel."
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
    if (upstreamSignal) {
      upstreamSignal.removeEventListener("abort", abortFromUpstream);
    }
  }
}

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
      },
      fetch: fetchWithTimeout
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

async function handleBlobUploadRequest(request) {
  if (request.method && request.method !== "POST") {
    return Response.json({ error: "Metodo no permitido." }, { status: 405 });
  }

  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("Falta BLOB_READ_WRITE_TOKEN para subir imagenes a Vercel Blob.");
    }

    const body = await readUploadBody(request);

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
          maximumSizeInBytes: maxImageSizeInBytes,
          tokenPayload: JSON.stringify(tokenPayload)
        };
      }
    });

    return Response.json(jsonResponse);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo preparar la subida." },
      { status: error?.status || 400 }
    );
  }
}

export function POST(request) {
  return handleBlobUploadRequest(request);
}

export default {
  fetch: handleBlobUploadRequest
};
