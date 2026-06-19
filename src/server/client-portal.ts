import type { User } from "@supabase/supabase-js";

import { getPrisma } from "./prisma";
import {
  clientPortalFileToViewModel,
  clientPortalProfileToViewModel,
  clientPropertySubmissionToViewModel,
  type ClientPortalFileViewModel,
  type ClientPortalProfileViewModel,
  type ClientPropertySubmissionViewModel
} from "./view-models";
import {
  createSupabaseRequestClient,
  getBearerToken,
  getSupabaseUserFromAccessToken
} from "./auth/supabase";
import { CATEGORY_META, slugify } from "../utils/properties.js";

export const CLIENT_PORTAL_FILES_BUCKET = "client-portal-files";
export const CLIENT_PORTAL_PROPERTY_STATUSES = [
  "borrador",
  "en_revision",
  "contactado",
  "convertido",
  "archivado"
];
export const CLIENT_PORTAL_FILE_KINDS = ["photo", "document"];

const PROPERTY_OPERATIONS = ["venta", "alquiler", "alquiler_permanente", "alquiler_turistico"];
const FILE_ENTITY_TYPES = ["profile", "property_submission"];
const ACTIVE_FILE_STATUS = "active";

type ClientPortalContext = {
  accessToken: string;
  user: User;
};

function textValue(value: unknown) {
  return String(value || "").trim();
}

function lowerTextValue(value: unknown) {
  return textValue(value).toLowerCase();
}

function submittedStatus(value: unknown) {
  return value === "borrador" ? "borrador" : "en_revision";
}

function userFullName(user: User) {
  const metadata = user.user_metadata || {};
  return textValue(metadata.full_name) || textValue(metadata.name) || textValue(user.email);
}

function userAvatarUrl(user: User) {
  const metadata = user.user_metadata || {};
  return textValue(metadata.avatar_url) || textValue(metadata.picture);
}

function propertyCategoryFromSubmission(operation: unknown) {
  if (operation === "alquiler_turistico") return "alquiler_turistico";
  if (operation === "alquiler" || operation === "alquiler_permanente") return "alquiler_permanente";
  return "venta";
}

function escapeHtml(value: unknown) {
  return textValue(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function descriptionToHtml(value: unknown) {
  const text = textValue(value);
  if (!text) return "";
  return `<p>${escapeHtml(text).replace(/\n+/g, "</p><p>")}</p>`;
}

export function portalClientSyncData(values: any = {}, user: User) {
  const email = lowerTextValue(user.email);

  if (!email) {
    throw new Error("No se pudo identificar el email del cliente autenticado.");
  }

  return {
    email,
    fullName: textValue(values.fullName) || userFullName(user),
    phone: textValue(values.phone)
  };
}

export function assertClientPortalStoragePath(storagePath: string, userId: string) {
  if (!storagePath.startsWith(`${userId}/`)) {
    throw new Error("La ruta del archivo no pertenece al cliente autenticado.");
  }
}

export function profileDataFromClientValues(values: any = {}, user: User) {
  const email = lowerTextValue(user.email);

  if (!email) {
    throw new Error("El perfil de Google no tiene email disponible.");
  }

  return {
    userId: user.id,
    email,
    fullName: textValue(values.fullName) || userFullName(user),
    avatarUrl: userAvatarUrl(user),
    phone: textValue(values.phone),
    isActive: true
  };
}

export async function syncClientPortalUser(values: any = {}, user: User) {
  const prisma = getPrisma();
  const data = portalClientSyncData(values, user);
  const existing = await prisma.client.findFirst({
    where: {
      email: data.email
    },
    select: {
      id: true
    }
  });

  if (existing) {
    await prisma.client.update({
      where: {
        id: existing.id
      },
      data: {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        updatedBy: user.id
      }
    });
    return;
  }

  await prisma.client.create({
    data: {
      createdBy: user.id,
      updatedBy: user.id,
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      isOwner: false,
      operation: "comprador",
      zone: "",
      budget: "",
      rooms: "",
      status: "nuevo",
      notes: ""
    }
  });

  const portalProfile = await prisma.clientPortalProfile.findUnique({
    where: {
      userId: user.id
    },
    select: {
      userId: true
    }
  });

  if (!portalProfile) {
    await prisma.clientPortalProfile.create({
      data: {
        userId: user.id,
        email: data.email,
        fullName: data.fullName,
        avatarUrl: userAvatarUrl(user),
        phone: data.phone,
        isActive: true
      }
    });
  }
}

export function propertySubmissionDataFromClientValues(values: any = {}, userId: string) {
  const title = textValue(values.title);
  const latitude = Number(values.latitude);
  const longitude = Number(values.longitude);

  if (!title) {
    throw new Error("El titulo de la propiedad es obligatorio.");
  }

  return {
    userId,
    title,
    operation: PROPERTY_OPERATIONS.includes(values.operation) ? values.operation : "venta",
    intent: "ofrecer",
    status: submittedStatus(values.status),
    propertyType: textValue(values.propertyType),
    address: textValue(values.location || values.address),
    zone: textValue(values.zone),
    price: textValue(values.price),
    area: textValue(values.area),
    rooms: textValue(values.rooms),
    description: textValue(values.description),
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null
  };
}

export function fileDataFromClientValues(values: any = {}, userId: string) {
  const storagePath = textValue(values.storagePath);
  const fileName = textValue(values.fileName);
  const entityType = FILE_ENTITY_TYPES.includes(values.entityType) ? values.entityType : "profile";

  if (!storagePath) {
    throw new Error("La ruta del archivo es obligatoria.");
  }

  if (!fileName) {
    throw new Error("El nombre del archivo es obligatorio.");
  }

  assertClientPortalStoragePath(storagePath, userId);

  return {
    userId,
    entityType,
    entityId: textValue(values.entityId) || userId,
    bucket: CLIENT_PORTAL_FILES_BUCKET,
    storagePath,
    fileName,
    fileType: textValue(values.fileType),
    fileSize: BigInt(Math.max(0, Math.round(Number(values.fileSize || 0)))),
    kind: CLIENT_PORTAL_FILE_KINDS.includes(values.kind) ? values.kind : "document",
    status: ACTIVE_FILE_STATUS
  };
}

export async function getClientPortalContext(request: Request): Promise<ClientPortalContext> {
  const accessToken = getBearerToken(request);
  const user = await getSupabaseUserFromAccessToken(accessToken);
  return { accessToken, user };
}

export async function getClientPortalSnapshot(
  context: ClientPortalContext
): Promise<{
  profile: ClientPortalProfileViewModel;
  propertySubmissions: ClientPropertySubmissionViewModel[];
  files: ClientPortalFileViewModel[];
}> {
  await syncClientPortalUser({}, context.user);

  const [profile, propertySubmissions, files] = await Promise.all([
    getClientPortalProfile(context.user),
    listClientPropertySubmissions(context.user.id),
    listClientPortalFiles(context)
  ]);

  return {
    profile,
    propertySubmissions,
    files
  };
}

export async function getClientPortalProfile(user: User): Promise<ClientPortalProfileViewModel> {
  const row = await getPrisma().clientPortalProfile.findUnique({
    where: {
      userId: user.id
    }
  });

  return clientPortalProfileToViewModel(row || {}, user);
}

export async function saveClientPortalProfile(values: any, user: User): Promise<ClientPortalProfileViewModel> {
  const data = profileDataFromClientValues(values, user);

  const row = await getPrisma().clientPortalProfile.upsert({
    where: {
      userId: user.id
    },
    update: data,
    create: data
  });

  await syncClientPortalUser(values, user);

  return clientPortalProfileToViewModel(row, user);
}

export async function listClientPropertySubmissions(userId: string): Promise<ClientPropertySubmissionViewModel[]> {
  const rows = await getPrisma().clientPropertySubmission.findMany({
    where: {
      userId
    },
    orderBy: [
      { updatedAt: "desc" },
      { createdAt: "desc" }
    ]
  });

  return rows.map(clientPropertySubmissionToViewModel);
}

export async function listClientPropertySubmissionsByClientId(clientId: string): Promise<ClientPropertySubmissionViewModel[]> {
  const client = await getPrisma().client.findUnique({
    where: { id: textValue(clientId) },
    select: {
      email: true
    }
  });

  if (!client?.email) {
    return [];
  }

  const portalProfile = await getPrisma().clientPortalProfile.findFirst({
    where: {
      email: client.email.toLowerCase()
    },
    select: {
      userId: true
    }
  });

  if (!portalProfile?.userId) {
    return [];
  }

  return listClientPropertySubmissions(portalProfile.userId);
}

async function createPropertyFromClientSubmission(
  tx: any,
  submission: any,
  client: { id: string; email: string },
  userId: string
) {
  const title = textValue(submission.title);
  const category = propertyCategoryFromSubmission(submission.operation);
  const location = textValue(submission.address || submission.location || submission.zone);
  const description = textValue(submission.description);
  const latitude = Number(submission.latitude);
  const longitude = Number(submission.longitude);
  const slugBase = slugify(title || `solicitud-${submission.id}`, 80) || `solicitud-${submission.id.slice(0, 8)}`;
  const slug = slugify(`${slugBase}-${submission.id.slice(0, 8)}`, 96) || `${submission.id.slice(0, 8)}`;

  const property = await tx.property.create({
    data: {
      title: title || "Propiedad sin titulo",
      slug,
      location,
      price: textValue(submission.price) || "Consultar",
      currency: "USD",
      area: textValue(submission.area) || "Superficie a confirmar",
      category,
      latitude: Number.isFinite(latitude) ? latitude : null,
      longitude: Number.isFinite(longitude) ? longitude : null,
      markerColor: CATEGORY_META[category]?.mapColor || CATEGORY_META.venta.mapColor,
      summary: description,
      descriptionHtml: descriptionToHtml(description),
      rawDescription: description,
      isPublished: false,
      displayOrder: 0
    },
    select: {
      id: true
    }
  });

  await tx.clientPropertyAssignment.create({
    data: {
      clientId: client.id,
      propertyId: property.id,
      relationship: "propietario",
      notes: "",
      createdBy: userId,
      updatedBy: userId
    }
  });

  return property.id;
}

export async function createClientPropertySubmission(
  values: any,
  userId: string
): Promise<ClientPropertySubmissionViewModel> {
  const row = await getPrisma().clientPropertySubmission.create({
    data: propertySubmissionDataFromClientValues(values, userId)
  });

  return clientPropertySubmissionToViewModel(row);
}

export async function updateClientPropertySubmission(
  id: string,
  values: any,
  userId: string
): Promise<ClientPropertySubmissionViewModel> {
  const submissionId = textValue(id);

  if (!submissionId) {
    throw new Error("Falta la solicitud de propiedad a actualizar.");
  }

  const existing = await getPrisma().clientPropertySubmission.findFirst({
    where: {
      id: submissionId,
      userId
    }
  });

  if (!existing) {
    throw new Error("No se encontro la solicitud de propiedad.");
  }

  if (existing.status !== "en_revision") {
    throw new Error("Solo se pueden editar solicitudes en revision.");
  }

  const row = await getPrisma().clientPropertySubmission.update({
    where: { id: submissionId },
    data: {
      ...propertySubmissionDataFromClientValues(values, userId),
      status: existing.status
    }
  });

  return clientPropertySubmissionToViewModel(row);
}

export async function reviewClientPropertySubmission(
  id: string,
  values: {
    action?: string;
    status?: string;
    adminMessage?: string;
    clientId?: string;
    userId?: string;
  }
): Promise<ClientPropertySubmissionViewModel> {
  const submissionId = textValue(id);

  if (!submissionId) {
    throw new Error("Falta la solicitud de propiedad a revisar.");
  }

  const action = textValue(values.action || "");
  const prisma = getPrisma();
  const submission = await prisma.clientPropertySubmission.findUnique({
    where: { id: submissionId }
  });

  if (!submission) {
    throw new Error("No se encontro la solicitud de propiedad.");
  }

  if (action === "approve") {
    const clientId = textValue(values.clientId);

    if (!clientId) {
      throw new Error("Falta el cliente para aprobar la solicitud.");
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        email: true
      }
    });

    if (!client?.email) {
      throw new Error("No se pudo encontrar el cliente para asignar la propiedad.");
    }

    const portalProfile = await prisma.clientPortalProfile.findFirst({
      where: {
        email: client.email.toLowerCase()
      },
      select: {
        userId: true
      }
    });

    if (!portalProfile?.userId) {
      throw new Error("El cliente no tiene un usuario del portal asociado.");
    }

    const userId = textValue(values.userId);
    if (!userId) {
      throw new Error("Falta el usuario interno que aprueba la solicitud.");
    }

    const row = await prisma.$transaction(async (tx: any) => {
      const propertyId = await createPropertyFromClientSubmission(tx, submission, client, userId);

      return tx.clientPropertySubmission.update({
        where: { id: submissionId },
        data: {
          status: "contactado",
          adminMessage: textValue(values.adminMessage),
          convertedPropertyId: propertyId
        }
      });
    });

    return clientPropertySubmissionToViewModel(row);
  }

  const update: Record<string, unknown> = {};
  if (values.status) update.status = values.status;
  if (values.adminMessage !== undefined) update.adminMessage = textValue(values.adminMessage);

  const row = await prisma.clientPropertySubmission.update({
    where: { id: submissionId },
    data: update
  });

  return clientPropertySubmissionToViewModel(row);
}

async function createClientFileSignedUrl(accessToken: string, storagePath: string) {
  if (!storagePath) return "";

  try {
    const supabase = createSupabaseRequestClient(accessToken);
    const { data, error } = await supabase.storage
      .from(CLIENT_PORTAL_FILES_BUCKET)
      .createSignedUrl(storagePath, 3600);

    if (error) throw error;
    return data?.signedUrl || "";
  } catch {
    return "";
  }
}

export async function listClientPortalFiles(context: ClientPortalContext): Promise<ClientPortalFileViewModel[]> {
  const rows = await getPrisma().clientPortalFile.findMany({
    where: {
      userId: context.user.id,
      status: ACTIVE_FILE_STATUS
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return Promise.all(
    rows.map(async (row: any) =>
      clientPortalFileToViewModel(row, await createClientFileSignedUrl(context.accessToken, row.storagePath))
    )
  );
}

export async function createClientPortalFile(values: any, context: ClientPortalContext) {
  const data = fileDataFromClientValues(values, context.user.id);
  const row = await getPrisma().clientPortalFile.create({ data });
  const signedUrl = await createClientFileSignedUrl(context.accessToken, row.storagePath);

  return clientPortalFileToViewModel(row, signedUrl);
}
