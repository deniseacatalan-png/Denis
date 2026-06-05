import { getPrisma } from "./prisma";
import {
  activityDocumentToViewModel,
  activityNoteToViewModel,
  type ActivityDocumentViewModel,
  type ActivityNoteViewModel,
  type InternalProfile
} from "./view-models";

type EntityType = "property" | "client";
type ActivityKind = "notes" | "documents";

function textValue(value: unknown) {
  return String(value || "").trim();
}

function assertEntityType(value: unknown): asserts value is EntityType {
  if (value !== "property" && value !== "client") {
    throw new Error("Tipo de entidad invalido para notas y documentos.");
  }
}

function assertActivityKind(value: unknown): asserts value is ActivityKind {
  if (value !== "notes" && value !== "documents") {
    throw new Error("Tipo de actividad invalido.");
  }
}

function assertActivityAccess(entityType: EntityType, internalProfile: InternalProfile) {
  if (entityType === "property" && internalProfile.role !== "admin") {
    throw new Error("Solo un administrador puede administrar actividad de propiedades.");
  }
}

function authorPayload(userId: string, internalProfile: InternalProfile) {
  const role = internalProfile.role;
  const profile = internalProfile.profile;
  const fallbackName = role === "seller" ? "Vendedor" : "Administrador";

  return {
    createdBy: userId,
    authorRole: role,
    authorName: textValue(profile.fullName) || textValue(profile.username) || textValue(profile.email) || fallbackName
  };
}

export async function listActivity({
  entityType,
  entityId,
  kind,
  internalProfile
}: {
  entityType: unknown;
  entityId: unknown;
  kind: unknown;
  internalProfile: InternalProfile;
}): Promise<ActivityNoteViewModel[] | ActivityDocumentViewModel[]> {
  assertEntityType(entityType);
  assertActivityKind(kind);
  assertActivityAccess(entityType, internalProfile);

  const id = textValue(entityId);
  if (!id) {
    throw new Error("Falta el registro relacionado para cargar la actividad.");
  }

  if (entityType === "property" && kind === "notes") {
    const rows = await getPrisma().propertyNote.findMany({
      where: { propertyId: id },
      orderBy: { createdAt: "desc" }
    });
    return rows.map(activityNoteToViewModel);
  }

  if (entityType === "property" && kind === "documents") {
    const rows = await getPrisma().propertyDocument.findMany({
      where: { propertyId: id },
      orderBy: { createdAt: "desc" }
    });
    return rows.map(activityDocumentToViewModel);
  }

  if (entityType === "client" && kind === "notes") {
    const rows = await getPrisma().clientNote.findMany({
      where: { clientId: id },
      orderBy: { createdAt: "desc" }
    });
    return rows.map(activityNoteToViewModel);
  }

  const rows = await getPrisma().clientDocument.findMany({
    where: { clientId: id },
    orderBy: { createdAt: "desc" }
  });
  return rows.map(activityDocumentToViewModel);
}

export async function createActivity({
  entityType,
  entityId,
  kind,
  body,
  fileMetadata,
  userId,
  internalProfile
}: {
  entityType: unknown;
  entityId: unknown;
  kind: unknown;
  body?: unknown;
  fileMetadata?: any;
  userId: string;
  internalProfile: InternalProfile;
}) {
  assertEntityType(entityType);
  assertActivityKind(kind);
  assertActivityAccess(entityType, internalProfile);

  const id = textValue(entityId);
  if (!id) {
    throw new Error("Falta el registro relacionado para guardar la actividad.");
  }

  const author = authorPayload(userId, internalProfile);

  if (kind === "notes") {
    const noteBody = textValue(body);
    if (!noteBody) {
      throw new Error("La nota no puede estar vacia.");
    }

    const data = {
      body: noteBody,
      ...author
    };

    const row =
      entityType === "property"
        ? await getPrisma().propertyNote.create({ data: { ...data, propertyId: id } })
        : await getPrisma().clientNote.create({ data: { ...data, clientId: id } });

    return activityNoteToViewModel(row);
  }

  const fileName = textValue(fileMetadata?.fileName);
  const fileUrl = textValue(fileMetadata?.fileUrl);

  if (!fileName || !fileUrl) {
    throw new Error("El documento necesita nombre y URL.");
  }

  const data = {
    fileName,
    fileUrl,
    fileType: textValue(fileMetadata?.fileType),
    fileSize: BigInt(Number(fileMetadata?.fileSize || 0)),
    ...author
  };

  const row =
    entityType === "property"
      ? await getPrisma().propertyDocument.create({ data: { ...data, propertyId: id } })
      : await getPrisma().clientDocument.create({ data: { ...data, clientId: id } });

  return activityDocumentToViewModel(row);
}
