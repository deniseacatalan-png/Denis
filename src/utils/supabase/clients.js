import { createClient } from "./client.js";

export const CLIENT_OPERATIONS = ["comprar", "alquilar"];
export const CLIENT_STATUSES = ["nuevo", "contactado", "visitando", "cerrado", "pausado"];

const CLIENT_SELECT = `
  id,
  created_by,
  updated_by,
  full_name,
  phone,
  email,
  operation,
  zone,
  budget,
  rooms,
  status,
  notes,
  created_at,
  updated_at
`;

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
  const supabase = createClient();
  let query = supabase
    .from("clients")
    .select(CLIENT_SELECT)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (CLIENT_OPERATIONS.includes(filters.operation)) {
    query = query.eq("operation", filters.operation);
  }

  if (CLIENT_STATUSES.includes(filters.status)) {
    query = query.eq("status", filters.status);
  }

  if (filters.createdBy) {
    query = query.eq("created_by", filters.createdBy);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(normalizeClient);
}

export async function saveClient(values, userId) {
  const supabase = createClient();
  const payload = clientToDatabasePayload(values, userId);

  if (values.id) {
    const { data, error } = await supabase
      .from("clients")
      .update(payload)
      .eq("id", values.id)
      .select(CLIENT_SELECT)
      .single();

    if (error) throw error;
    return normalizeClient(data);
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      ...payload,
      created_by: userId
    })
    .select(CLIENT_SELECT)
    .single();

  if (error) throw error;
  return normalizeClient(data);
}
