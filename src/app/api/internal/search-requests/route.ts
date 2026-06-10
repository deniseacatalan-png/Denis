import { jsonError } from "@/server/api-response";
import { requireActiveSellerOrAdmin } from "@/server/auth/guards";
import { listAllSearchRequests } from "@/server/client-portal";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireActiveSellerOrAdmin(request);
    const url = new URL(request.url);
    const searchRequests = await listAllSearchRequests({
      status: url.searchParams.get("status") || "",
      operation: url.searchParams.get("operation") || ""
    });

    return Response.json({ searchRequests });
  } catch (error) {
    return jsonError(error, "No se pudieron cargar las busquedas.");
  }
}
