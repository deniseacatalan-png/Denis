import { handleUpload } from "@vercel/blob/client";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const maxUploadSizeInBytes = 25 * 1024 * 1024;
const supabaseRequestTimeoutMs = 10_000;

const imageContentTypes = [
  "image/avif",
  "image/jpeg",
  "image/png",
  "image/webp"
];

const documentContentTypes = [
  "application/msword",
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

const allowedAttachmentContentTypes = [...imageContentTypes, ...documentContentTypes];

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

function makeSupabaseClient(accessToken) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Faltan variables publicas de Supabase.");
  }

  return createClient(supabaseUrl, supabaseKey, {
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
}

async function resolveInternalUser(clientPayload) {
  const payload = parseClientPayload(clientPayload);
  const accessToken = payload.accessToken;

  if (!accessToken) {
    throw new Error("Tenes que iniciar sesion para subir archivos.");
  }

  const supabase = makeSupabaseClient(accessToken);

  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);

  if (userError || !userData.user) {
    throw new Error("La sesion interna no es valida.");
  }

  const { data: adminProfile, error: adminError } = await supabase
    .from("admin_profiles")
    .select("id")
    .eq("id", userData.user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (adminError) {
    throw adminError;
  }

  if (adminProfile) {
    return {
      payload,
      role: "admin",
      userId: userData.user.id
    };
  }

  const { data: sellerProfile, error: sellerError } = await supabase
    .from("seller_profiles")
    .select("id")
    .eq("id", userData.user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (sellerError) {
    throw sellerError;
  }

  if (!sellerProfile) {
    throw new Error("El usuario no tiene permiso para subir archivos.");
  }

  return {
    payload,
    role: "seller",
    userId: userData.user.id
  };
}

function assertPathStartsWith(pathname, expectedPrefix, message) {
  if (!pathname.startsWith(expectedPrefix)) {
    throw new Error(message);
  }
}

async function authorizeUpload(pathname, clientPayload) {
  const internalUser = await resolveInternalUser(clientPayload);
  const uploadType = internalUser.payload.uploadType || "property-image";
  const propertyId = internalUser.payload.propertyId || null;
  const clientId = internalUser.payload.clientId || null;

  if (uploadType === "property-image") {
    if (internalUser.role !== "admin") {
      throw new Error("El usuario no tiene permiso para subir imagenes.");
    }

    assertPathStartsWith(pathname, "properties/", "Las imagenes deben guardarse dentro de properties/.");

    return {
      allowedContentTypes: imageContentTypes,
      tokenPayload: {
        propertyId,
        uploadType,
        userId: internalUser.userId,
        userRole: internalUser.role
      }
    };
  }

  if (uploadType === "property-document") {
    if (internalUser.role !== "admin") {
      throw new Error("Solo un administrador puede adjuntar archivos a propiedades.");
    }

    if (!propertyId) {
      throw new Error("Falta la propiedad para adjuntar el archivo.");
    }

    assertPathStartsWith(
      pathname,
      `property-documents/${propertyId}/`,
      "Los documentos de propiedades deben guardarse dentro de property-documents/<property_id>/."
    );

    return {
      allowedContentTypes: allowedAttachmentContentTypes,
      tokenPayload: {
        propertyId,
        uploadType,
        userId: internalUser.userId,
        userRole: internalUser.role
      }
    };
  }

  if (uploadType === "client-document") {
    if (!clientId) {
      throw new Error("Falta el cliente para adjuntar el archivo.");
    }

    assertPathStartsWith(
      pathname,
      `client-documents/${clientId}/`,
      "Los documentos de clientes deben guardarse dentro de client-documents/<client_id>/."
    );

    return {
      allowedContentTypes: allowedAttachmentContentTypes,
      tokenPayload: {
        clientId,
        uploadType,
        userId: internalUser.userId,
        userRole: internalUser.role
      }
    };
  }

  throw new Error("Tipo de subida invalido.");
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
        const uploadAuthorization = await authorizeUpload(pathname, clientPayload);

        return {
          allowedContentTypes: uploadAuthorization.allowedContentTypes,
          addRandomSuffix: true,
          maximumSizeInBytes: maxUploadSizeInBytes,
          tokenPayload: JSON.stringify(uploadAuthorization.tokenPayload)
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
