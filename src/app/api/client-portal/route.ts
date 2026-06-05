import { jsonError } from "@/server/api-response";
import { getClientPortalContext, getClientPortalSnapshot } from "@/server/client-portal";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const context = await getClientPortalContext(request);
    const snapshot = await getClientPortalSnapshot(context);
    return Response.json(snapshot);
  } catch (error) {
    return jsonError(error, "No se pudo cargar el portal de clientes.");
  }
}
