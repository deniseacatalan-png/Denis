export const SELLER_HOME_PATH = "/vendedor";
export const SELLER_PROPERTIES_PATH = "/vendedor/propiedades";
export const SELLER_NEW_PROPERTY_PATH = `${SELLER_PROPERTIES_PATH}/nueva`;
export const SELLER_SEARCH_REQUESTS_PATH = "/vendedor/busquedas";

export function getSellerRouteFromPathname(pathname = "") {
  if (/^\/vendedor\/propiedades\/nueva\/?$/.test(pathname)) {
    return {
      section: "properties",
      clientId: "",
      propertyId: "",
      propertyMode: "new"
    };
  }

  const propertyEditMatch = pathname.match(/^\/vendedor\/propiedades\/([^/]+)\/editar\/?$/);
  if (propertyEditMatch) {
    return {
      section: "properties",
      clientId: "",
      propertyId: decodeURIComponent(propertyEditMatch[1]),
      propertyMode: "edit"
    };
  }

  const propertyViewMatch = pathname.match(/^\/vendedor\/propiedades\/([^/]+)\/?$/);
  if (propertyViewMatch) {
    return {
      section: "properties",
      clientId: "",
      propertyId: decodeURIComponent(propertyViewMatch[1]),
      propertyMode: "view"
    };
  }

  if (/^\/vendedor\/propiedades\/?$/.test(pathname)) {
    return {
      section: "properties",
      clientId: "",
      propertyId: "",
      propertyMode: "list"
    };
  }

  const searchRequestMatch = pathname.match(/^\/vendedor\/busquedas(?:\/([^/]+))?\/?$/);
  if (searchRequestMatch) {
    return {
      section: "searchRequests",
      clientId: "",
      propertyId: "",
      propertyMode: "list",
      searchRequestId: searchRequestMatch[1] ? decodeURIComponent(searchRequestMatch[1]) : ""
    };
  }

  const clientId = getSellerClientIdFromPathname(pathname);

  return {
    section: "clients",
    clientId,
    propertyId: "",
    propertyMode: "list"
  };
}

export function getSellerClientIdFromPathname(pathname = "") {
  const match = pathname.match(/^\/vendedor\/cliente\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function sellerClientPath(clientId) {
  return `${SELLER_HOME_PATH}/cliente/${encodeURIComponent(String(clientId || ""))}`;
}

export function sellerPropertyPath(propertyId) {
  return `${SELLER_PROPERTIES_PATH}/${encodeURIComponent(String(propertyId || ""))}`;
}

export function sellerPropertyEditPath(propertyId) {
  return `${sellerPropertyPath(propertyId)}/editar`;
}
