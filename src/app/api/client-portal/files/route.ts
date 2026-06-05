import { jsonError, readJsonBody } from "@/server/api-response";
import { createClientPortalFile, getClientPortalContext } from "@/server/client-portal";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const context = await getClientPortalContext(request);
    const body = await readJsonBody(request);
    const file = await createClientPortalFile(body.file || body, context);
    return Response.json({ file });
  } catch (error) {
    return jsonError(error, "No se pudo registrar el archivo.");
  }
}
