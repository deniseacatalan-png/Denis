import { jsonError, readJsonBody } from "@/server/api-response";
import { requireAdmin } from "@/server/auth/guards";
import { listSellerProfiles, sanitizeSellerRequest, setSellerActive, upsertSeller } from "@/server/sellers-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const sellers = await listSellerProfiles();
    return Response.json({ sellers });
  } catch (error) {
    return jsonError(error, "No se pudieron cargar los vendedores.");
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireAdmin(request);
    const body = await readJsonBody(request);
    const seller = sanitizeSellerRequest(body);
    const profile =
      seller.action === "set_active"
        ? await setSellerActive({
            sellerId: seller.sellerId,
            isActive: seller.isActive
          })
        : await upsertSeller({
            adminUser: user,
            seller
          });

    return Response.json({ seller: profile });
  } catch (error) {
    return jsonError(error, "No se pudo administrar el vendedor.");
  }
}
