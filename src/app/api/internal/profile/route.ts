import { jsonError } from "@/server/api-response";
import { requireInternalUser } from "@/server/auth/guards";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { internalProfile } = await requireInternalUser(request);
    return Response.json({ internalProfile });
  } catch (error) {
    return jsonError(error, "No se pudo cargar el perfil interno.");
  }
}
