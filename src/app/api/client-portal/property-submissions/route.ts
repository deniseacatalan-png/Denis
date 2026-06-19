import { jsonError, readJsonBody } from "@/server/api-response";
import {
  createClientPropertySubmission,
  getClientPortalContext,
  updateClientPropertySubmission
} from "@/server/client-portal";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { user } = await getClientPortalContext(request);
    const body = await readJsonBody(request);
    const payload = body.propertySubmission || body;
    const propertySubmission = payload.id
      ? await updateClientPropertySubmission(payload.id, payload, user.id)
      : await createClientPropertySubmission(payload, user.id);
    return Response.json({ propertySubmission });
  } catch (error) {
    return jsonError(error, "No se pudo enviar la propiedad.");
  }
}
