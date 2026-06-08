import { jsonError } from "@/server/api-response";
import { requireActiveSellerOrAdmin } from "@/server/auth/guards";
import { listAdminProperties } from "@/server/properties";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireActiveSellerOrAdmin(request);
    const properties = await listAdminProperties();
    return Response.json({ properties });
  } catch (error) {
    return jsonError(error, "No se pudieron cargar las propiedades.");
  }
}
