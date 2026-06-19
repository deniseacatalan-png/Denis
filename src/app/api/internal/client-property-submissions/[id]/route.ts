import { jsonError, readJsonBody } from "@/server/api-response";
import { requireAdmin } from "@/server/auth/guards";
import { reviewClientPropertySubmission } from "@/server/client-portal";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireAdmin(request);
    const { id } = await params;
    const body = await readJsonBody(request);
    const propertySubmission = await reviewClientPropertySubmission(id, {
      action: body.action,
      status: body.status,
      adminMessage: body.adminMessage,
      clientId: body.clientId,
      userId: user.id
    });

    return Response.json({ propertySubmission });
  } catch (error) {
    return jsonError(error, "No se pudo actualizar la solicitud.");
  }
}
