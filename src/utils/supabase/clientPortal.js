import { fetchJsonWithAuth } from "./api.js";
import { createClient } from "./client.js";

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
export const CLIENT_PORTAL_PASSWORD_MIN_LENGTH = 8;

const PROPERTY_OPERATIONS = ["venta", "alquiler", "alquiler_permanente", "alquiler_turistico"];
const SEARCH_OPERATIONS = ["comprar", "alquilar", "temporada"];
const ACTIVE_FILE_STATUS = "active";

function textValue(value) {
  return String(value || "").trim();
}

function lowerTextValue(value) {
  return textValue(value).toLowerCase();
}

function userFullName(user) {
  return textValue(user?.user_metadata?.full_name) || textValue(user?.user_metadata?.name) || textValue(user?.email);
}

function userAvatarUrl(user) {
  return textValue(user?.user_metadata?.avatar_url) || textValue(user?.user_metadata?.picture);
}

function requireUserId(userId) {
  const normalizedUserId = textValue(userId);

  if (!normalizedUserId) {
    throw new Error("No se pudo identificar al cliente autenticado.");
  }

  return normalizedUserId;
}

function requireEmail(value) {
  const email = lowerTextValue(value);

  if (!email || !email.includes("@")) {
    throw new Error("Ingresa un email valido.");
  }

  return email;
}

function requirePassword(value) {
  const password = String(value || "");

  if (password.length < CLIENT_PORTAL_PASSWORD_MIN_LENGTH) {
    throw new Error(`La contrasenia debe tener al menos ${CLIENT_PORTAL_PASSWORD_MIN_LENGTH} caracteres.`);
  }

  return password;
}

function submittedStatus(value) {
  return value === "borrador" ? "borrador" : "en_revision";
}

function fileKind(value) {
  return CLIENT_PORTAL_FILE_KINDS.includes(value) ? value : "document";
}

function sanitizeFileName(fileName) {
  const normalized = textValue(fileName).replace(/[\\/]+/g, "-");
  return normalized || "archivo";
}

function sanitizePathSegment(value, fallback = "archivo") {
  const normalized = textValue(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

export function assertClientPortalStoragePath(storagePath, userId) {
  if (!textValue(storagePath).startsWith(`${userId}/`)) {
    throw new Error("La ruta del archivo no pertenece al cliente autenticado.");
  }
}

export function buildClientPortalRedirectUrl() {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/clientes`;
}

export function buildClientPortalPasswordResetUrl() {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/clientes/restablecer`;
}

export function clientPortalEmailCredentials(values = {}) {
  return {
    email: requireEmail(values.email),
    password: requirePassword(values.password),
    fullName: textValue(values.fullName)
  };
}

export function passwordResetEmailPayload(values = {}) {
  return {
    email: requireEmail(values.email)
  };
}

export function passwordUpdateToClientPayload(values = {}) {
  const password = requirePassword(values.password);
  const confirmPassword = String(values.confirmPassword || "");

  if (password !== confirmPassword) {
    throw new Error("Las contrasenias deben coincidir.");
  }

  return { password };
}

export function clientPortalStoragePath({ userId, entityType, entityId, fileName }) {
  const normalizedUserId = requireUserId(userId);
  const timestamp = Date.now();
  const safeEntityType = sanitizePathSegment(entityType, "portal");
  const safeEntityId = sanitizePathSegment(entityId, "general");
  const safeFileName = sanitizeFileName(fileName);

  return `${normalizedUserId}/${safeEntityType}/${safeEntityId}/${timestamp}-${safeFileName}`;
}

export async function signInWithGoogleClient() {
  const redirectTo = buildClientPortalRedirectUrl();

  return createClient().auth.signInWithOAuth({
    provider: "google",
    options: redirectTo ? { redirectTo } : undefined
  });
}

export async function signInWithEmailClient(values) {
  const credentials = clientPortalEmailCredentials(values);

  return createClient().auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password
  });
}

export async function signUpWithEmailClient(values) {
  const credentials = clientPortalEmailCredentials(values);
  const emailRedirectTo = buildClientPortalRedirectUrl();

  return createClient().auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      emailRedirectTo,
      data: credentials.fullName ? { full_name: credentials.fullName } : undefined
    }
  });
}

export async function sendClientPortalPasswordResetEmail(values) {
  const { email } = passwordResetEmailPayload(values);
  const redirectTo = buildClientPortalPasswordResetUrl();

  return createClient().auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);
}

export async function updateClientPortalPassword(values) {
  const payload = passwordUpdateToClientPayload(values);

  return createClient().auth.updateUser(payload);
}

export async function signOutClientPortal() {
  return createClient().auth.signOut();
}

export function getClientPortalSession() {
  return createClient().auth.getSession();
}

export function onClientPortalAuthStateChange(callback) {
  return createClient().auth.onAuthStateChange((event, session) => callback(session, event));
}

export function normalizeClientPortalProfile(row = {}, user = {}) {
  return {
    userId: row.userId || row.user_id || user?.id || "",
    email: row.email || user?.email || "",
    fullName: textValue(row.fullName || row.full_name) || userFullName(user),
    avatarUrl: textValue(row.avatarUrl || row.avatar_url) || userAvatarUrl(user),
    phone: textValue(row.phone),
    isActive: row.isActive ?? row.is_active ?? true,
    createdAt: row.createdAt || row.created_at || "",
    updatedAt: row.updatedAt || row.updated_at || ""
  };
}

export function normalizePropertySubmission(row = {}) {
  const latitude = Number(row.latitude);
  const longitude = Number(row.longitude);

  return {
    id: row.id || "",
    userId: row.userId || row.user_id || "",
    title: row.title || "",
    operation: PROPERTY_OPERATIONS.includes(row.operation) ? row.operation : "venta",
    status: CLIENT_PORTAL_PROPERTY_STATUSES.includes(row.status) ? row.status : "borrador",
    propertyType: row.propertyType || row.property_type || "",
    location: row.location || row.address || row.zone || "",
    zone: row.zone || "",
    price: row.price || "",
    area: row.area || "",
    rooms: row.rooms || "",
    description: row.description || "",
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    adminMessage: row.adminMessage || row.admin_message || "",
    convertedPropertyId: row.convertedPropertyId || row.converted_property_id || "",
    createdAt: row.createdAt || row.created_at || "",
    updatedAt: row.updatedAt || row.updated_at || ""
  };
}

export function normalizeSearchRequest(row = {}) {
  return {
    id: row.id || "",
    userId: row.userId || row.user_id || "",
    operation: SEARCH_OPERATIONS.includes(row.operation) ? row.operation : "alquilar",
    status: CLIENT_PORTAL_SEARCH_STATUSES.includes(row.status) ? row.status : "borrador",
    searchDetail: row.searchDetail || row.search_detail || "",
    zone: row.zone || "",
    budget: row.budget || "",
    rooms: row.rooms || "",
    preferences: row.preferences || "",
    mustHaves: row.mustHaves || row.must_haves || "",
    adminMessage: row.adminMessage || row.admin_message || "",
    createdAt: row.createdAt || row.created_at || "",
    updatedAt: row.updatedAt || row.updated_at || ""
  };
}

export function normalizeClientPortalFile(row = {}) {
  const fileType = row.fileType || row.file_type || "";

  return {
    id: row.id || "",
    userId: row.userId || row.user_id || "",
    entityType: row.entityType || row.entity_type || "",
    entityId: row.entityId || row.entity_id || "",
    bucket: row.bucket || CLIENT_PORTAL_FILES_BUCKET,
    storagePath: row.storagePath || row.storage_path || "",
    fileName: row.fileName || row.file_name || "",
    fileType,
    fileSize: Number(row.fileSize ?? row.file_size ?? 0),
    kind: fileKind(row.kind),
    status: row.status || ACTIVE_FILE_STATUS,
    isImage: Boolean(row.isImage ?? row.is_image ?? fileType.startsWith("image/")),
    signedUrl: row.signedUrl || row.signed_url || "",
    createdAt: row.createdAt || row.created_at || "",
    updatedAt: row.updatedAt || row.updated_at || ""
  };
}

export function profileToClientPayload(values = {}, user = {}) {
  const userId = requireUserId(user?.id);
  const email = lowerTextValue(user?.email);

  if (!email) {
    throw new Error("El perfil de Google no tiene email disponible.");
  }

  return {
    userId,
    email,
    fullName: textValue(values.fullName) || userFullName(user),
    avatarUrl: userAvatarUrl(user),
    phone: textValue(values.phone),
    isActive: true
  };
}

export function propertySubmissionToClientPayload(values = {}, userId) {
  const normalizedUserId = requireUserId(userId);
  const id = textValue(values.id);
  const title = textValue(values.title);
  const latitude = Number(values.latitude);
  const longitude = Number(values.longitude);

  if (!title) {
    throw new Error("El titulo de la propiedad es obligatorio.");
  }

  return {
    id,
    userId: normalizedUserId,
    title,
    operation: PROPERTY_OPERATIONS.includes(values.operation) ? values.operation : "venta",
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

export function searchRequestToClientPayload(values = {}, userId) {
  const normalizedUserId = requireUserId(userId);
  const searchDetail = textValue(values.searchDetail);

  if (!searchDetail) {
    throw new Error("El detalle de busqueda es obligatorio.");
  }

  return {
    userId: normalizedUserId,
    operation: SEARCH_OPERATIONS.includes(values.operation) ? values.operation : "alquilar",
    status: submittedStatus(values.status),
    searchDetail,
    zone: textValue(values.zone),
    budget: textValue(values.budget),
    rooms: textValue(values.rooms),
    preferences: textValue(values.preferences),
    mustHaves: textValue(values.mustHaves)
  };
}

export function fileMetadataToClientPayload(values = {}, userId) {
  const normalizedUserId = requireUserId(userId);
  const storagePath = textValue(values.storagePath || values.storage_path);
  const fileName = sanitizeFileName(values.fileName || values.file_name);

  if (!storagePath) {
    throw new Error("La ruta del archivo es obligatoria.");
  }

  if (!fileName) {
    throw new Error("El nombre del archivo es obligatorio.");
  }

  assertClientPortalStoragePath(storagePath, normalizedUserId);

  return {
    userId: normalizedUserId,
    entityType: textValue(values.entityType || values.entity_type || "profile"),
    entityId: textValue(values.entityId || values.entity_id || normalizedUserId),
    storagePath,
    fileName,
    fileType: textValue(values.fileType || values.file_type),
    fileSize: Number(values.fileSize || values.file_size || 0),
    kind: fileKind(values.kind),
    status: ACTIVE_FILE_STATUS
  };
}

export async function fetchClientPortalDashboard(user) {
  const payload = await fetchJsonWithAuth("/api/client-portal");

  return {
    profile: normalizeClientPortalProfile(payload.profile || {}, user),
    propertySubmissions: (payload.propertySubmissions || []).map(normalizePropertySubmission),
    searchRequests: (payload.searchRequests || []).map(normalizeSearchRequest),
    files: (payload.files || []).map(normalizeClientPortalFile)
  };
}

export async function saveClientPortalProfile(values, user) {
  const profile = profileToClientPayload(values, user);
  const payload = await fetchJsonWithAuth("/api/client-portal/profile", {
    method: "POST",
    body: JSON.stringify({ profile })
  });

  return normalizeClientPortalProfile(payload.profile || {}, user);
}

export async function savePropertySubmission(values, userId) {
  const propertySubmission = propertySubmissionToClientPayload(values, userId);
  const payload = await fetchJsonWithAuth("/api/client-portal/property-submissions", {
    method: "POST",
    body: JSON.stringify({ propertySubmission })
  });

  return normalizePropertySubmission(payload.propertySubmission || {});
}

export async function saveSearchRequest(values, userId) {
  const searchRequest = searchRequestToClientPayload(values, userId);
  const payload = await fetchJsonWithAuth("/api/client-portal/search-requests", {
    method: "POST",
    body: JSON.stringify({ searchRequest })
  });

  return normalizeSearchRequest(payload.searchRequest || {});
}

export async function saveClientPortalFileMetadata(values, userId) {
  const file = fileMetadataToClientPayload(values, userId);
  const payload = await fetchJsonWithAuth("/api/client-portal/files", {
    method: "POST",
    body: JSON.stringify({ file })
  });

  return normalizeClientPortalFile(payload.file || {});
}

export async function uploadClientPortalFile({ file, userId, entityType = "profile", entityId = "", kind }) {
  const normalizedUserId = requireUserId(userId);

  if (!file) {
    throw new Error("Selecciona un archivo para subir.");
  }

  const fileName = sanitizeFileName(file.name);
  const storagePath = clientPortalStoragePath({
    userId: normalizedUserId,
    entityType,
    entityId: entityId || normalizedUserId,
    fileName
  });

  const { error: uploadError } = await createClient()
    .storage
    .from(CLIENT_PORTAL_FILES_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type || undefined,
      upsert: false
    });

  if (uploadError) throw uploadError;

  return saveClientPortalFileMetadata(
    {
      entityType,
      entityId: entityId || normalizedUserId,
      storagePath,
      fileName,
      fileType: file.type || "",
      fileSize: file.size || 0,
      kind: kind || ((file.type || "").startsWith("image/") ? "photo" : "document")
    },
    normalizedUserId
  );
}
