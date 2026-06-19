import type { User } from "@supabase/supabase-js";

import { getPrisma } from "./prisma";
import {
  clientPortalFileToViewModel,
  clientPortalProfileToViewModel,
  clientPropertySubmissionToViewModel,
  clientSearchRequestToViewModel,
  searchRequestWithProfileToViewModel,
  type ClientPortalFileViewModel,
  type ClientPortalProfileViewModel,
  type ClientPropertySubmissionViewModel,
  type ClientSearchRequestViewModel,
  type SearchRequestWithProfileViewModel
} from "./view-models";
import {
  createSupabaseRequestClient,
  getBearerToken,
  getSupabaseUserFromAccessToken
} from "./auth/supabase";

export const CLIENT_PORTAL_FILES_BUCKET = "client-portal-files";
export const CLIENT_PORTAL_PROPERTY_STATUSES = [
  "borrador",
  "en_revision",
  "contactado",
  "convertido",
  "archivado"
];
export const CLIENT_PORTAL_SEARCH_STATUSES = CLIENT_PORTAL_PROPERTY_STATUSES;
export const CLIENT_PORTAL_FILE_KINDS = ["photo", "document"];

const PROPERTY_OPERATIONS = ["venta", "alquiler", "alquiler_permanente", "alquiler_turistico"];
const SEARCH_OPERATIONS = ["comprar", "alquilar", "temporada"];
const FILE_ENTITY_TYPES = ["profile", "property_submission", "search_request"];
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

function splitList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(textValue).filter(Boolean);
  }

  return textValue(value)
    .split(/[,\n]/g)
    .map(textValue)
    .filter(Boolean);
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

export function searchRequestDataFromClientValues(values: any = {}, userId: string) {
  const searchDetail = textValue(values.searchDetail);

  if (!searchDetail) {
    throw new Error("El detalle de busqueda es obligatorio.");
  }

  const preferences = textValue(values.preferences);

  return {
    userId,
    operation: SEARCH_OPERATIONS.includes(values.operation) ? values.operation : "alquilar",
    status: submittedStatus(values.status),
    searchDetail,
    zone: textValue(values.zone),
    budget: textValue(values.budget),
    rooms: textValue(values.rooms),
    preferences: preferences ? { text: preferences } : {},
    mustHaves: splitList(values.mustHaves),
    adminMessage: ""
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
  searchRequests: ClientSearchRequestViewModel[];
  files: ClientPortalFileViewModel[];
}> {
  await syncClientPortalUser({}, context.user);

  const [profile, propertySubmissions, searchRequests, files] = await Promise.all([
    getClientPortalProfile(context.user),
    listClientPropertySubmissions(context.user.id),
    listClientSearchRequests(context.user.id),
    listClientPortalFiles(context)
  ]);

  return {
    profile,
    propertySubmissions,
    searchRequests,
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

export async function listClientSearchRequests(userId: string): Promise<ClientSearchRequestViewModel[]> {
  const rows = await getPrisma().clientSearchRequest.findMany({
    where: {
      userId
    },
    orderBy: [
      { updatedAt: "desc" },
      { createdAt: "desc" }
    ]
  });

  return rows.map(clientSearchRequestToViewModel);
}

export async function createClientSearchRequest(values: any, userId: string): Promise<ClientSearchRequestViewModel> {
  const row = await getPrisma().clientSearchRequest.create({
    data: searchRequestDataFromClientValues(values, userId)
  });

  return clientSearchRequestToViewModel(row);
}

export async function listAllSearchRequests(filters: {
  status?: string;
  operation?: string;
} = {}): Promise<SearchRequestWithProfileViewModel[]> {
  const where: Record<string, string> = {};
  if (filters.status) where.status = filters.status;
  if (filters.operation) where.operation = filters.operation;

  const rows = await getPrisma().clientSearchRequest.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }]
  });

  const userIds = [...new Set(rows.map((r: any) => r.userId))];
  const profiles = userIds.length
    ? await getPrisma().clientPortalProfile.findMany({ where: { userId: { in: userIds } } })
    : [];
  const profileMap = new Map(profiles.map((p: any) => [p.userId, p]));

  return rows.map((row: any) => {
    const profile = profileMap.get(row.userId) || {};
    return searchRequestWithProfileToViewModel({ ...row, clientPortalProfile: profile });
  });
}

export async function updateSearchRequest(
  id: string,
  data: { status?: string; adminMessage?: string }
): Promise<SearchRequestWithProfileViewModel> {
  const update: Record<string, string> = {};
  if (data.status !== undefined) update.status = data.status;
  if (data.adminMessage !== undefined) update.adminMessage = data.adminMessage;

  const row = await getPrisma().clientSearchRequest.update({
    where: { id },
    data: update
  });

  const profile = await getPrisma().clientPortalProfile.findUnique({
    where: { userId: row.userId }
  });

  return searchRequestWithProfileToViewModel({ ...row, clientPortalProfile: profile || {} });
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
