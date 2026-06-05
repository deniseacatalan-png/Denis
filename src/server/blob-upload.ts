import { handleUpload } from "@vercel/blob/client";

import { getPrisma } from "./prisma";
import { resolveInternalProfileForUser } from "./auth/guards";
import { getSupabaseUserFromAccessToken } from "./auth/supabase";

const maxUploadSizeInBytes = 25 * 1024 * 1024;

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
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function isJsonRequest(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  return contentType.toLowerCase().includes("application/json");
}

async function readUploadBody(request: Request) {
  if (!isJsonRequest(request)) {
    throw new UploadRouteError(
      "La ruta de subida espera JSON de Vercel Blob, no el archivo completo.",
      415
    );
  }

  return request.json();
}

function parseClientPayload(clientPayload?: string | null) {
  if (!clientPayload) return {};

  try {
    return JSON.parse(clientPayload);
  } catch {
    throw new Error("Payload de subida invalido.");
  }
}

async function resolveInternalUser(clientPayload?: string | null) {
  const payload = parseClientPayload(clientPayload);
  const accessToken = payload.accessToken;

  if (!accessToken) {
    throw new Error("Tenes que iniciar sesion para subir archivos.");
  }

  const user = await getSupabaseUserFromAccessToken(accessToken);
  const internalProfile = await resolveInternalProfileForUser(getPrisma(), user.id);

  if (!internalProfile) {
    throw new Error("El usuario no tiene permiso para subir archivos.");
  }

  return {
    payload,
    role: internalProfile.role,
    userId: user.id
  };
}

function assertPathStartsWith(pathname: string, expectedPrefix: string, message: string) {
  if (!pathname.startsWith(expectedPrefix)) {
    throw new Error(message);
  }
}

async function authorizeUpload(pathname: string, clientPayload?: string | null) {
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

export async function handleBlobUploadRequest(request: Request) {
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
  } catch (error: any) {
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo preparar la subida." },
      { status: error?.status || 400 }
    );
  }
}
