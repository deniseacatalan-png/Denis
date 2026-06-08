import { createClient } from "./client";
import { fetchJson, fetchJsonWithAuth } from "./api.js";

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
  const payload = await fetchJson("/api/properties/public");
  return payload.properties || [];
}

export async function fetchAdminProperties() {
  const payload = await fetchJsonWithAuth("/api/admin/properties");
  return payload.properties || [];
}

export async function saveInternalProperty(values) {
  const payload = await fetchJsonWithAuth("/api/admin/properties", {
    method: "POST",
    body: JSON.stringify({ property: values })
  });

  return payload.propertyId;
}

export async function saveAdminProperty(values) {
  return saveInternalProperty(values);
}

export async function saveSellerProperty(values) {
  return saveInternalProperty(values);
}

export async function updateAdminPropertyOrder(orderedProperties) {
  await fetchJsonWithAuth("/api/admin/properties/order", {
    method: "PATCH",
    body: JSON.stringify({ properties: orderedProperties })
  });
}

export async function deleteAdminProperty(propertyId) {
  await fetchJsonWithAuth("/api/admin/properties", {
    method: "DELETE",
    body: JSON.stringify({ propertyId })
  });
}
