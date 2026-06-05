import { jsonError, readJsonBody } from "@/server/api-response";
import { requireActiveSellerOrAdmin } from "@/server/auth/guards";
import { createActivity, listActivity } from "@/server/activity";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { internalProfile } = await requireActiveSellerOrAdmin(request);
    const url = new URL(request.url);
    const items = await listActivity({
      entityType: url.searchParams.get("entityType"),
      entityId: url.searchParams.get("entityId"),
      kind: url.searchParams.get("kind"),
      internalProfile
    });

    return Response.json({ items });
  } catch (error) {
    return jsonError(error, "No se pudo cargar la actividad.");
  }
}

export async function POST(request: Request) {
  try {
    const { user, internalProfile } = await requireActiveSellerOrAdmin(request);
    const body = await readJsonBody(request);
    const item = await createActivity({
      entityType: body.entityType,
      entityId: body.entityId,
      kind: body.kind,
      body: body.body,
      fileMetadata: body.fileMetadata,
      userId: user.id,
      internalProfile
    });

    return Response.json({ item });
  } catch (error) {
    return jsonError(error, "No se pudo guardar la actividad.");
  }
}
