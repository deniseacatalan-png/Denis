import { jsonError, readJsonBody } from "@/server/api-response";
import { requireAdmin } from "@/server/auth/guards";
import { updateAdminPropertyOrder } from "@/server/properties";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const body = await readJsonBody(request);
    await updateAdminPropertyOrder(body.properties || []);
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error, "No se pudo actualizar el orden.");
  }
}
