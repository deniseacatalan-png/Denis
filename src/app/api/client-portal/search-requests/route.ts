import { jsonError, readJsonBody } from "@/server/api-response";
import { createClientSearchRequest, getClientPortalContext } from "@/server/client-portal";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { user } = await getClientPortalContext(request);
    const body = await readJsonBody(request);
    const searchRequest = await createClientSearchRequest(body.searchRequest || body, user.id);
    return Response.json({ searchRequest });
  } catch (error) {
    return jsonError(error, "No se pudo guardar la busqueda.");
  }
}
