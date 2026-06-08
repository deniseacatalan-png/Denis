import { jsonError, readJsonBody } from "@/server/api-response";
import { requireActiveSellerOrAdmin } from "@/server/auth/guards";
import { deleteClientPropertyAssignment, saveClientPropertyAssignment } from "@/server/clients";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { user } = await requireActiveSellerOrAdmin(request);
    const body = await readJsonBody(request);
    const assignment = await saveClientPropertyAssignment(body.assignment || body, user.id);
    return Response.json({ assignment });
  } catch (error) {
    return jsonError(error, "No se pudo asignar la propiedad.");
  }
}

export async function DELETE(request: Request) {
  try {
    await requireActiveSellerOrAdmin(request);
    const url = new URL(request.url);
    const body = await readJsonBody(request);
    await deleteClientPropertyAssignment(body.assignmentId || url.searchParams.get("assignmentId") || "");
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error, "No se pudo quitar la propiedad asignada.");
  }
}
