import { AuthRouteError } from "./http-errors";

export function jsonError(error: unknown, fallback = "No se pudo completar la operacion.") {
  const message = error instanceof Error ? error.message : fallback;
  const status =
    error instanceof AuthRouteError
      ? error.status
      : typeof (error as { status?: unknown })?.status === "number"
        ? Number((error as { status: number }).status)
        : 400;

  return Response.json({ error: message }, { status });
}

export async function readJsonBody<T = any>(request: Request): Promise<T> {
  return request.json().catch(() => ({} as T));
}
