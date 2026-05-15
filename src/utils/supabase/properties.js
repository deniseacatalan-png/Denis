import { createClient } from "./client";
import {
  normalizeDatabaseProperty,
  propertyToDatabasePayload
} from "../properties";

const PROPERTY_SELECT = `
  id,
  kml_id,
  title,
  slug,
  location,
  price,
  area,
  category,
  latitude,
  longitude,
  style_color,
  marker_color,
  summary,
  description_html,
  raw_description,
  is_published,
  display_order,
  property_images (
    id,
    url,
    alt,
    sort_order
  )
`;

const ADMIN_EMAIL_DOMAIN = "admin.denise-catalan.local";

export function usernameToAdminEmail(username) {
  const normalized = username.trim().toLowerCase();
  return normalized.includes("@") ? normalized : `${normalized}@${ADMIN_EMAIL_DOMAIN}`;
}

export async function signInAdmin(username, password) {
  const supabase = createClient();
  return supabase.auth.signInWithPassword({
    email: usernameToAdminEmail(username),
    password
  });
}

export function getCurrentSession() {
  return createClient().auth.getSession();
}

export function onAuthStateChange(callback) {
  return createClient().auth.onAuthStateChange((_event, session) => callback(session));
}

export async function signOutAdmin() {
  return createClient().auth.signOut();
}

export async function fetchPublishedProperties() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("properties")
    .select(PROPERTY_SELECT)
    .eq("is_published", true)
    .in("category", ["venta", "alquiler_turistico"])
    .order("display_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) throw error;
  return (data || []).map(normalizeDatabaseProperty);
}

export async function fetchAdminProperties() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("properties")
    .select(PROPERTY_SELECT)
    .order("display_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) throw error;
  return (data || []).map(normalizeDatabaseProperty);
}

export async function saveAdminProperty(values) {
  const supabase = createClient();
  const payload = propertyToDatabasePayload(values);
  const imageUrls = values.images
    .map((url) => url.trim())
    .filter(Boolean);

  if (!payload.title) {
    throw new Error("El titulo es obligatorio.");
  }

  if (payload.latitude === null || payload.longitude === null) {
    throw new Error("La latitud y longitud son obligatorias.");
  }

  let propertyId = values.databaseId || "";

  if (propertyId) {
    const { error } = await supabase
      .from("properties")
      .update(payload)
      .eq("id", propertyId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from("properties")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw error;
    propertyId = data.id;
  }

  const { error: deleteError } = await supabase
    .from("property_images")
    .delete()
    .eq("property_id", propertyId);
  if (deleteError) throw deleteError;

  if (imageUrls.length) {
    const rows = imageUrls.map((url, index) => ({
      property_id: propertyId,
      url,
      alt: values.title.trim(),
      sort_order: index
    }));
    const { error: imageError } = await supabase.from("property_images").insert(rows);
    if (imageError) throw imageError;
  }

  return propertyId;
}

export async function deleteAdminProperty(propertyId) {
  const supabase = createClient();
  const { error } = await supabase.from("properties").delete().eq("id", propertyId);
  if (error) throw error;
}
