import { createClient } from "./client.js";

async function currentAccessToken() {
  const {
    data: { session }
  } = await createClient().auth.getSession();

  if (!session?.access_token) {
    throw new Error("Tu sesion expiro. Volve a ingresar.");
  }

  return session.access_token;
}

export async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "No se pudo completar la operacion.");
  }

  return payload;
}

export async function fetchJsonWithAuth(url, options = {}) {
  const accessToken = await currentAccessToken();

  return fetchJson(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {})
    }
  });
}
