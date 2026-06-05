import { createClient } from "@supabase/supabase-js";

import { AuthRouteError } from "../http-errors";

const supabaseRequestTimeoutMs = 10_000;

export function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}) {
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
      throw new AuthRouteError("Supabase no respondio a tiempo.", 504);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function createSupabaseRequestClient(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new AuthRouteError("Faltan variables publicas de Supabase.", 500);
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

export function createSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new AuthRouteError("Falta SUPABASE_SERVICE_ROLE_KEY para administrar usuarios.", 500);
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

export async function getSupabaseUserFromAccessToken(accessToken: string) {
  if (!accessToken) {
    throw new AuthRouteError("Tenes que iniciar sesion.", 401);
  }

  const supabase = createSupabaseRequestClient(accessToken);
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    throw new AuthRouteError("La sesion interna no es valida.", 401);
  }

  return data.user;
}

export async function getSupabaseUserFromRequest(request: Request) {
  return getSupabaseUserFromAccessToken(getBearerToken(request));
}
