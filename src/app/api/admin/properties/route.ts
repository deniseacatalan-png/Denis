import { jsonError, readJsonBody } from "@/server/api-response";
import { requireAdmin } from "@/server/auth/guards";
import { deleteAdminProperty, listAdminProperties, saveAdminProperty } from "@/server/properties";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const properties = await listAdminProperties();
    return Response.json({ properties });
  } catch (error) {
    return jsonError(error, "No pudimos cargar las propiedades.");
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await readJsonBody(request);
    const propertyId = await saveAdminProperty(body.property || body);
    return Response.json({ propertyId });
  } catch (error) {
    return jsonError(error, "No se pudo guardar la propiedad.");
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const body = await readJsonBody(request);
    await deleteAdminProperty(body.propertyId || url.searchParams.get("propertyId") || "");
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error, "No se pudo eliminar la propiedad.");
  }
}
