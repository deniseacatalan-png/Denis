import { fetchJsonWithAuth } from "./api.js";

export const CLIENT_OPERATIONS = ["comprar", "alquilar", "temporada"];
export const CLIENT_STATUSES = ["nuevo", "contactado", "visitando", "cerrado", "pausado"];

function textValue(value) {
  return String(value || "").trim();
}

export function normalizeClient(row) {
  return {
    id: row.id,
    createdBy: row.created_by || "",
    updatedBy: row.updated_by || "",
    fullName: row.full_name || "",
    phone: row.phone || "",
    email: row.email || "",
    isOwner: Boolean(row.is_owner),
    operation: row.operation || "alquilar",
    zone: row.zone || "",
    budget: row.budget || "",
    rooms: row.rooms || "",
    status: row.status || "nuevo",
    notes: row.notes || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || ""
  };
}

export function clientToDatabasePayload(values, userId) {
  const fullName = textValue(values.fullName);

  if (!fullName) {
    throw new Error("El nombre del cliente es obligatorio.");
  }

  const operation = CLIENT_OPERATIONS.includes(values.operation) ? values.operation : "alquilar";
  const status = CLIENT_STATUSES.includes(values.status) ? values.status : "nuevo";

  return {
    full_name: fullName,
    phone: textValue(values.phone),
    email: textValue(values.email).toLowerCase(),
    is_owner: Boolean(values.isOwner),
    operation,
    zone: textValue(values.zone),
    budget: textValue(values.budget),
    rooms: textValue(values.rooms),
    status,
    notes: textValue(values.notes),
    updated_by: userId
  };
}

export async function fetchClients(filters = {}) {
  const params = new URLSearchParams();

  if (CLIENT_OPERATIONS.includes(filters.operation)) {
    params.set("operation", filters.operation);
  }

  if (CLIENT_STATUSES.includes(filters.status)) {
    params.set("status", filters.status);
  }

  if (filters.createdBy) {
    params.set("createdBy", filters.createdBy);
  }

  const query = params.toString();
  const payload = await fetchJsonWithAuth(`/api/internal/clients${query ? `?${query}` : ""}`);
  return payload.clients || [];
}

export async function saveClient(values, userId) {
  clientToDatabasePayload(values, userId);
  const payload = await fetchJsonWithAuth("/api/internal/clients", {
    method: "POST",
    body: JSON.stringify({ client: values })
  });

  return payload.client;
}
