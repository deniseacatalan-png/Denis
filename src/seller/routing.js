export const SELLER_HOME_PATH = "/vendedor";
export const SELLER_NEW_PROPERTY_PATH = "/vendedor/propiedades/nueva";

export function getSellerRouteFromPathname(pathname = "") {
  if (/^\/vendedor\/propiedades\/nueva\/?$/.test(pathname)) {
    return {
      section: "properties",
      clientId: ""
    };
  }

  const clientId = getSellerClientIdFromPathname(pathname);

  return {
    section: "clients",
    clientId
  };
}

export function getSellerClientIdFromPathname(pathname = "") {
  const match = pathname.match(/^\/vendedor\/cliente\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function sellerClientPath(clientId) {
  return `${SELLER_HOME_PATH}/cliente/${encodeURIComponent(String(clientId || ""))}`;
}
