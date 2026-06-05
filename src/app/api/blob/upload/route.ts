import { handleBlobUploadRequest } from "@/server/blob-upload";

export const dynamic = "force-dynamic";

export function POST(request: Request) {
  return handleBlobUploadRequest(request);
}
