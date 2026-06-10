import { jsonError, readJsonBody } from "@/server/api-response";
import { requireActiveSellerOrAdmin } from "@/server/auth/guards";
import { updateSearchRequest } from "@/server/client-portal";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireActiveSellerOrAdmin(request);
    const { id } = await params;
    const body = await readJsonBody(request);
    const searchRequest = await updateSearchRequest(id, {
      status: body.status,
      adminMessage: body.adminMessage
    });

    return Response.json({ searchRequest });
  } catch (error) {
    return jsonError(error, "No se pudo actualizar la busqueda.");
  }
}
