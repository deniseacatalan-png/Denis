import { jsonError, readJsonBody } from "@/server/api-response";
import { getClientPortalContext, saveClientPortalProfile } from "@/server/client-portal";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { user } = await getClientPortalContext(request);
    const body = await readJsonBody(request);
    const profile = await saveClientPortalProfile(body.profile || body, user);
    return Response.json({ profile });
  } catch (error) {
    return jsonError(error, "No se pudo guardar el perfil.");
  }
}
