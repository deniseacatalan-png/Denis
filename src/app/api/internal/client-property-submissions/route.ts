import { jsonError } from "@/server/api-response";
import { requireAdmin } from "@/server/auth/guards";
import { listClientPropertySubmissionsByClientId } from "@/server/client-portal";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const clientId = url.searchParams.get("clientId") || "";
    const propertySubmissions = await listClientPropertySubmissionsByClientId(clientId);

    return Response.json({ propertySubmissions });
  } catch (error) {
    return jsonError(error, "No se pudieron cargar las propiedades enviadas.");
  }
}
