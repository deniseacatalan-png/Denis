import { jsonError, readJsonBody } from "@/server/api-response";
import { requireActiveSellerOrAdmin } from "@/server/auth/guards";
import { listClients, saveClient } from "@/server/clients";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireActiveSellerOrAdmin(request);
    const url = new URL(request.url);
    const clients = await listClients({
      operation: url.searchParams.get("operation") || "",
      status: url.searchParams.get("status") || "",
      createdBy: url.searchParams.get("createdBy") || ""
    });

    return Response.json({ clients });
  } catch (error) {
    return jsonError(error, "No se pudieron cargar los clientes.");
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireActiveSellerOrAdmin(request);
    const body = await readJsonBody(request);
    const client = await saveClient(body.client || body, user.id);
    return Response.json({ client });
  } catch (error) {
    return jsonError(error, "No se pudo guardar el cliente.");
  }
}
