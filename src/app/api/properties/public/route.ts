import { jsonError } from "@/server/api-response";
import { listPublishedProperties } from "@/server/properties";

export async function GET() {
  try {
    const properties = await listPublishedProperties();
    return Response.json({ properties });
  } catch (error) {
    return jsonError(error, "No pudimos cargar las propiedades.");
  }
}
