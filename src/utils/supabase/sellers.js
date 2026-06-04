import { createClient } from "./client.js";

export const SELLER_EMAIL_DOMAIN = "vendedor.denise-catalan.local";

const SELLER_PROFILE_SELECT = `
  id,
  username,
  email,
  full_name,
  is_active,
  created_by,
  created_at,
  updated_at
`;

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
  const supabase = createClient();
  const { data: sellerProfile, error: sellerError } = await supabase
    .from("seller_profiles")
    .select(SELLER_PROFILE_SELECT)
    .eq("id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (sellerError) throw sellerError;
  if (sellerProfile) {
    return {
      role: "seller",
      profile: normalizeSellerProfile(sellerProfile)
    };
  }

  const { data: adminProfile, error: adminError } = await supabase
    .from("admin_profiles")
    .select("id, username, email, is_active")
    .eq("id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (adminError) throw adminError;
  if (!adminProfile) return null;

  return {
    role: "admin",
    profile: {
      id: adminProfile.id,
      username: adminProfile.username || "",
      email: adminProfile.email || "",
      fullName: adminProfile.username || "Administrador",
      isActive: Boolean(adminProfile.is_active)
    }
  };
}

export async function fetchSellerProfiles() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("seller_profiles")
    .select(SELLER_PROFILE_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(normalizeSellerProfile);
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
