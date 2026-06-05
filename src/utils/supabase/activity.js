import { fetchJsonWithAuth } from "./api.js";

const entityConfig = {
  property: {
    idColumn: "property_id",
    notesTable: "property_notes",
    documentsTable: "property_documents"
  },
  client: {
    idColumn: "client_id",
    notesTable: "client_notes",
    documentsTable: "client_documents"
  }
};

function textValue(value) {
  return String(value || "").trim();
}

function configForEntity(entityType) {
  const config = entityConfig[entityType];

  if (!config) {
    throw new Error("Tipo de entidad invalido para notas y documentos.");
  }

  return config;
}

function authorPayload(author) {
  const userId = textValue(author?.userId);
  const role = author?.role === "seller" ? "seller" : "admin";
  const fallbackName = role === "seller" ? "Vendedor" : "Administrador";

  if (!userId) {
    throw new Error("No se pudo identificar al usuario interno.");
  }

  return {
    created_by: userId,
    author_role: role,
    author_name: textValue(author?.name) || fallbackName
  };
}

export function normalizeActivityNote(row) {
  return {
    id: row.id,
    entityId: row.property_id || row.client_id || "",
    body: row.body || "",
    createdBy: row.created_by || "",
    authorRole: row.author_role || "admin",
    authorName: row.author_name || "",
    createdAt: row.created_at || ""
  };
}

export function normalizeActivityDocument(row) {
  const fileType = row.file_type || "";

  return {
    id: row.id,
    entityId: row.property_id || row.client_id || "",
    fileName: row.file_name || "",
    fileUrl: row.file_url || "",
    fileType,
    fileSize: Number(row.file_size || 0),
    isImage: fileType.startsWith("image/"),
    createdBy: row.created_by || "",
    authorRole: row.author_role || "admin",
    authorName: row.author_name || "",
    createdAt: row.created_at || ""
  };
}

export function activityAuthorFromProfile(userId, internalProfile) {
  const role = internalProfile?.role === "seller" ? "seller" : "admin";
  const profile = internalProfile?.profile || {};
  const fallbackName = role === "seller" ? "Vendedor" : "Administrador";

  return {
    userId,
    role,
    name: textValue(profile.fullName) || textValue(profile.username) || textValue(profile.email) || fallbackName
  };
}

export function noteToDatabasePayload(entityType, entityId, body, author) {
  const config = configForEntity(entityType);
  const noteBody = textValue(body);

  if (!textValue(entityId)) {
    throw new Error("Falta el registro relacionado para guardar la nota.");
  }

  if (!noteBody) {
    throw new Error("La nota no puede estar vacia.");
  }

  return {
    [config.idColumn]: entityId,
    body: noteBody,
    ...authorPayload(author)
  };
}

export function documentToDatabasePayload(entityType, entityId, fileMetadata, author) {
  const config = configForEntity(entityType);
  const fileName = textValue(fileMetadata?.fileName);
  const fileUrl = textValue(fileMetadata?.fileUrl);

  if (!textValue(entityId)) {
    throw new Error("Falta el registro relacionado para guardar el documento.");
  }

  if (!fileName || !fileUrl) {
    throw new Error("El documento necesita nombre y URL.");
  }

  return {
    [config.idColumn]: entityId,
    file_name: fileName,
    file_url: fileUrl,
    file_type: textValue(fileMetadata?.fileType),
    file_size: Number(fileMetadata?.fileSize || 0),
    ...authorPayload(author)
  };
}

async function fetchNotes(entityType, entityId) {
  configForEntity(entityType);
  const params = new URLSearchParams({
    entityType,
    entityId,
    kind: "notes"
  });
  const payload = await fetchJsonWithAuth(`/api/internal/activity?${params.toString()}`);
  return payload.items || [];
}

async function createNote(entityType, entityId, body, author) {
  noteToDatabasePayload(entityType, entityId, body, author);
  const payload = await fetchJsonWithAuth("/api/internal/activity", {
    method: "POST",
    body: JSON.stringify({
      entityType,
      entityId,
      kind: "notes",
      body
    })
  });

  return payload.item;
}

async function fetchDocuments(entityType, entityId) {
  configForEntity(entityType);
  const params = new URLSearchParams({
    entityType,
    entityId,
    kind: "documents"
  });
  const payload = await fetchJsonWithAuth(`/api/internal/activity?${params.toString()}`);
  return payload.items || [];
}

async function createDocument(entityType, entityId, fileMetadata, author) {
  documentToDatabasePayload(entityType, entityId, fileMetadata, author);
  const payload = await fetchJsonWithAuth("/api/internal/activity", {
    method: "POST",
    body: JSON.stringify({
      entityType,
      entityId,
      kind: "documents",
      fileMetadata
    })
  });

  return payload.item;
}

export function fetchPropertyNotes(propertyId) {
  return fetchNotes("property", propertyId);
}

export function createPropertyNote(propertyId, body, author) {
  return createNote("property", propertyId, body, author);
}

export function fetchClientNotes(clientId) {
  return fetchNotes("client", clientId);
}

export function createClientNote(clientId, body, author) {
  return createNote("client", clientId, body, author);
}

export function fetchPropertyDocuments(propertyId) {
  return fetchDocuments("property", propertyId);
}

export function createPropertyDocument(propertyId, fileMetadata, author) {
  return createDocument("property", propertyId, fileMetadata, author);
}

export function fetchClientDocuments(clientId) {
  return fetchDocuments("client", clientId);
}

export function createClientDocument(clientId, fileMetadata, author) {
  return createDocument("client", clientId, fileMetadata, author);
}
