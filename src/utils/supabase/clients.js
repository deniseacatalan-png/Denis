import { fetchJsonWithAuth } from "./api.js";

export const CLIENT_OPERATIONS = ["comprador", "vendedor", "locador", "inquilino"];
export const DEFAULT_CLIENT_OPERATION = "comprador";
export const CLIENT_OPERATION_LABELS = {
  comprador: "Comprador",
  vendedor: "Vendedor",
  locador: "Locador",
  inquilino: "Inquilino"
};
export const CLIENT_STATUSES = ["nuevo", "contactado", "visitando", "cerrado", "pausado"];
export const CLIENT_PROPERTY_RELATIONSHIPS = ["propietario", "comprador", "interesado", "inquilino"];

export function isOwnerClientOperation(operation) {
  return operation === "vendedor" || operation === "locador";
}

export function normalizeClientOperation(value, isOwner = false) {
  const operation = String(value || "");
  if (CLIENT_OPERATIONS.includes(operation)) return operation;
  if (operation === "comprar") return isOwner ? "vendedor" : "comprador";
  if (operation === "alquilar" || operation === "temporada") return isOwner ? "locador" : "inquilino";

  return isOwner ? "vendedor" : DEFAULT_CLIENT_OPERATION;
}

function textValue(value) {
  return String(value || "").trim();
}

export function normalizeClientPropertyAssignment(row = {}) {
  const property = row.property || null;

  return {
    id: row.id || "",
    clientId: row.client_id || row.clientId || "",
    propertyId: row.property_id || row.propertyId || "",
    relationship: row.relationship || "interesado",
    notes: row.notes || "",
    createdBy: row.created_by || row.createdBy || "",
    updatedBy: row.updated_by || row.updatedBy || "",
    createdAt: row.created_at || row.createdAt || "",
    updatedAt: row.updated_at || row.updatedAt || "",
    property: property
      ? {
          id: property.id || "",
          title: property.title || "",
          slug: property.slug || "",
          location: property.location || "",
          price: property.price || "Consultar",
          category: property.category || "venta",
          isPublished: Boolean(property.is_published ?? property.isPublished)
        }
      : null
  };
}

export function normalizeClient(row) {
  const operation = normalizeClientOperation(row.operation, Boolean(row.is_owner));

  return {
    id: row.id,
    createdBy: row.created_by || "",
    updatedBy: row.updated_by || "",
    fullName: row.full_name || "",
    phone: row.phone || "",
    email: row.email || "",
    isOwner: isOwnerClientOperation(operation),
    operation,
    zone: row.zone || "",
    budget: row.budget || "",
    rooms: row.rooms || "",
    status: row.status || "nuevo",
    notes: row.notes || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
    propertyAssignments: (row.client_property_assignments || row.propertyAssignments || []).map(
      normalizeClientPropertyAssignment
    )
  };
}

export function clientToDatabasePayload(values, userId) {
  const fullName = textValue(values.fullName);

  if (!fullName) {
    throw new Error("El nombre del cliente es obligatorio.");
  }

  const operation = normalizeClientOperation(values.operation, Boolean(values.isOwner));
  const status = CLIENT_STATUSES.includes(values.status) ? values.status : "nuevo";

  return {
    full_name: fullName,
    phone: textValue(values.phone),
    email: textValue(values.email).toLowerCase(),
    is_owner: isOwnerClientOperation(operation),
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

export function clientPropertyAssignmentToPayload(values) {
  const clientId = textValue(values.clientId);
  const propertyId = textValue(values.propertyId);
  const relationship = CLIENT_PROPERTY_RELATIONSHIPS.includes(values.relationship)
    ? values.relationship
    : "interesado";

  if (!clientId) {
    throw new Error("Falta el cliente para asignar la propiedad.");
  }

  if (!propertyId) {
    throw new Error("Selecciona una propiedad para asignar.");
  }

  return {
    id: textValue(values.id),
    clientId,
    propertyId,
    relationship,
    notes: textValue(values.notes)
  };
}

export async function saveClientPropertyAssignment(values) {
  const assignment = clientPropertyAssignmentToPayload(values);
  const payload = await fetchJsonWithAuth("/api/internal/client-property-assignments", {
    method: "POST",
    body: JSON.stringify({ assignment })
  });

  return payload.assignment;
}

export async function deleteClientPropertyAssignment(assignmentId) {
  await fetchJsonWithAuth("/api/internal/client-property-assignments", {
    method: "DELETE",
    body: JSON.stringify({ assignmentId })
  });
}
