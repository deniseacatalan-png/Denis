import { createClient } from "@supabase/supabase-js";

export const SELLER_EMAIL_DOMAIN = "vendedor.denise-catalan.local";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseRequestTimeoutMs = 10_000;

class SellerRouteError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

function textValue(value) {
  return String(value || "").trim();
}

export function usernameToSellerEmail(username) {
  const normalized = normalizeUsername(username);
  return normalized.includes("@") ? normalized : `${normalized}@${SELLER_EMAIL_DOMAIN}`;
}

export function getBearerToken(request) {
  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

export function sanitizeSellerRequest(body = {}) {
  const action = body.action === "set_active" ? "set_active" : "upsert";
  const rawUsername = normalizeUsername(body.username);
  const rawEmail = normalizeUsername(body.email);
  const username = rawUsername || (rawEmail.includes("@") ? rawEmail.split("@")[0] : rawEmail);
  const email = rawEmail || usernameToSellerEmail(username);
  const fullName = textValue(body.fullName || body.full_name || username);
  const password = textValue(body.password);
  const isActive = body.isActive ?? body.is_active ?? true;

  if (action === "upsert") {
    if (!username) {
      throw new SellerRouteError("El usuario del vendedor es obligatorio.");
    }

    if (password && password.length < 8) {
      throw new SellerRouteError("La contraseña debe tener al menos 8 caracteres.");
    }
  }

  return {
    action,
    username,
    email,
    fullName,
    password,
    isActive: Boolean(isActive)
  };
}

function normalizeSellerProfile(row) {
  return {
    id: row.id,
    username: row.username || "",
    email: row.email || "",
    full_name: row.full_name || "",
    is_active: Boolean(row.is_active),
    created_by: row.created_by || "",
    created_at: row.created_at || "",
    updated_at: row.updated_at || ""
  };
}

async function fetchWithTimeout(input, init = {}) {
  const controller = new AbortController();
  let didTimeout = false;

  const timeout = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, supabaseRequestTimeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal
    });
  } catch (error) {
    if (didTimeout) {
      throw new SellerRouteError("Supabase no respondio a tiempo.", 504);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function createRequestClient(accessToken) {
  if (!supabaseUrl || !supabaseKey) {
    throw new SellerRouteError("Faltan variables publicas de Supabase.", 500);
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      fetch: fetchWithTimeout
    }
  });
}

function createServiceClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new SellerRouteError("Falta SUPABASE_SERVICE_ROLE_KEY para crear vendedores.", 500);
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      fetch: fetchWithTimeout
    }
  });
}

async function verifyAdmin(accessToken) {
  if (!accessToken) {
    throw new SellerRouteError("Tenes que iniciar sesion como admin.", 401);
  }

  const supabase = createRequestClient(accessToken);
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);

  if (userError || !userData.user) {
    throw new SellerRouteError("La sesion de administrador no es valida.", 401);
  }

  const { data: profile, error: profileError } = await supabase
    .from("admin_profiles")
    .select("id")
    .eq("id", userData.user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (profileError || !profile) {
    throw new SellerRouteError("El usuario no tiene permiso para administrar vendedores.", 403);
  }

  return userData.user;
}

async function findUserByEmail(supabase, email) {
  const perPage = 1000;

  for (let page = 1; page < 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user) return user;
    if (data.users.length < perPage) return null;
  }

  return null;
}

async function upsertSeller({ adminUser, seller }) {
  const supabase = createServiceClient();
  let user = await findUserByEmail(supabase, seller.email);

  if (user) {
    const attributes = {
      email_confirm: true,
      user_metadata: {
        username: seller.username,
        full_name: seller.fullName
      }
    };

    if (seller.password) {
      attributes.password = seller.password;
    }

    const { data, error } = await supabase.auth.admin.updateUserById(user.id, attributes);
    if (error) throw error;
    user = data.user;
  } else {
    if (!seller.password) {
      throw new SellerRouteError("La contraseña es obligatoria para crear un vendedor.");
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: seller.email,
      password: seller.password,
      email_confirm: true,
      user_metadata: {
        username: seller.username,
        full_name: seller.fullName
      }
    });

    if (error) throw error;
    user = data.user;
  }

  const { data: profile, error: profileError } = await supabase
    .from("seller_profiles")
    .upsert({
      id: user.id,
      username: seller.username,
      email: seller.email,
      full_name: seller.fullName,
      is_active: seller.isActive,
      created_by: adminUser.id
    })
    .select("id, username, email, full_name, is_active, created_by, created_at, updated_at")
    .single();

  if (profileError) throw profileError;
  return normalizeSellerProfile(profile);
}

async function setSellerActive({ sellerId, isActive }) {
  if (!sellerId) {
    throw new SellerRouteError("Falta el vendedor a actualizar.");
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("seller_profiles")
    .update({ is_active: Boolean(isActive) })
    .eq("id", sellerId)
    .select("id, username, email, full_name, is_active, created_by, created_at, updated_at")
    .single();

  if (error) throw error;
  return normalizeSellerProfile(data);
}

async function handleSellerAdminRequest(request) {
  if (request.method && request.method !== "POST") {
    return Response.json({ error: "Metodo no permitido." }, { status: 405 });
  }

  try {
    const adminUser = await verifyAdmin(getBearerToken(request));
    const body = await request.json();
    const seller = sanitizeSellerRequest(body);

    const profile =
      seller.action === "set_active"
        ? await setSellerActive({
            sellerId: body.sellerId,
            isActive: seller.isActive
          })
        : await upsertSeller({ adminUser, seller });

    return Response.json({ seller: profile });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo administrar el vendedor." },
      { status: error?.status || 400 }
    );
  }
}

export function POST(request) {
  return handleSellerAdminRequest(request);
}

export default {
  fetch: handleSellerAdminRequest
};
