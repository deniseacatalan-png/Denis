export const SELLER_HOME_PATH = "/vendedor";

export function getSellerClientIdFromPathname(pathname = "") {
  const match = pathname.match(/^\/vendedor\/cliente\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function sellerClientPath(clientId) {
  return `${SELLER_HOME_PATH}/cliente/${encodeURIComponent(String(clientId || ""))}`;
}
