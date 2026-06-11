import { createClient } from "./client.js";
import { fetchJsonWithAuth } from "./api.js";

export const SELLER_EMAIL_DOMAIN = "vendedor.denise-catalan.local";

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

export function usernameToSellerEmail(username) {
  const normalized = normalizeUsername(username);
  return normalized.includes("@") ? normalized : `${normalized}@${SELLER_EMAIL_DOMAIN}`;
}

export function normalizeSellerProfile(row) {
  return {
    id: row.id,
    username: row.username || "",
    email: row.email || "",
    fullName: row.full_name || "",
    isActive: Boolean(row.is_active),
    createdBy: row.created_by || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || ""
  };
}

export async function signInSeller(username, password) {
  const supabase = createClient();
  return supabase.auth.signInWithPassword({
    email: usernameToSellerEmail(username),
    password
  });
}

export const SELLER_REDIRECT_PATH = "/vendedor";

export async function signInSellerWithRedirect(username, password) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: usernameToSellerEmail(username),
    password
  });

  if (error) {
    throw error;
  }

  // If login is successful, check if user has seller role and redirect if needed
  if (data.user && data.user.user_metadata && data.user.user_metadata.role === "seller") {
    // Redirect to seller portal
    if (typeof window !== "undefined") {
      window.location.href = SELLER_REDIRECT_PATH;
    }
  }

  return data;
}

export function getCurrentSession() {
  return createClient().auth.getSession();
}

export function onAuthStateChange(callback) {
  return createClient().auth.onAuthStateChange((_event, session) => callback(session));
}

export async function signOutSeller() {
  return createClient().auth.signOut();
}

export async function fetchInternalProfile(userId) {
  if (!userId) return null;
  const payload = await fetchJsonWithAuth("/api/internal/profile");
  return payload.internalProfile || null;
}

export async function fetchSellerProfiles() {
  const payload = await fetchJsonWithAuth("/api/admin/sellers");
  return payload.sellers || [];
}

export async function createSellerFromAdmin({ accessToken, seller }) {
  const response = await fetch("/api/admin/sellers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      action: "upsert",
      ...seller
    })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "No se pudo guardar el vendedor.");
  }

  return normalizeSellerProfile(payload.seller);
}

export async function setSellerActiveFromAdmin({ accessToken, sellerId, isActive }) {
  const response = await fetch("/api/admin/sellers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      action: "set_active",
      sellerId,
      isActive
    })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "No se pudo actualizar el vendedor.");
  }

  return normalizeSellerProfile(payload.seller);
}
