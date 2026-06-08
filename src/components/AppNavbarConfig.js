export function publicNavbarItems({ isPropertyRoute = false } = {}) {
  const homeItem = isPropertyRoute
    ? { id: "home", label: "Inicio", action: "navigateHome" }
    : { id: "home", label: "Inicio", href: "#inicio" };

  return [
    homeItem,
    ...(isPropertyRoute ? [] : [{ id: "properties", label: "Propiedades", href: "#propiedades" }]),
    { id: "clients", label: "Portal clientes", href: "/clientes" },
    { id: "service", label: "Solicitar servicio", action: "openService", variant: "cta" }
  ];
}

export function clientNavbarItems({ isAuthenticated = false, activeView = "panel", authMode = "login" } = {}) {
  if (!isAuthenticated) {
    return [
      { id: "login", label: "Ingresar", action: "login", active: authMode === "login" },
      { id: "signup", label: "Crear cuenta", action: "signup", active: authMode === "signup", variant: "cta" }
    ];
  }

  return [
    { id: "panel", label: "Panel", path: "/clientes", viewId: "panel", active: activeView === "panel" },
    { id: "perfil", label: "Perfil", path: "/clientes/perfil", viewId: "perfil", active: activeView === "perfil" },
    { id: "signout", label: "Salir", action: "signout" }
  ];
}

export function adminNavbarItems({ activeSection = "dashboard" } = {}) {
  return [
    { id: "dashboard", label: "Resumen", path: "/admin", active: activeSection === "dashboard" },
    { id: "properties", label: "Propiedades", path: "/admin/propiedades", active: activeSection === "properties" },
    { id: "clients", label: "Clientes", path: "/admin/clientes", active: activeSection === "clients" },
    { id: "sellers", label: "Vendedores", path: "/admin/vendedores", active: activeSection === "sellers" },
    { id: "signout", label: "Cerrar sesión", action: "signout", variant: "cta" }
  ];
}

export function sellerNavbarItems({ activeSection = "clients", isClientDetail = false } = {}) {
  return [
    { id: "clients", label: "Clientes", path: "/vendedor", active: activeSection === "clients" || Boolean(isClientDetail) },
    { id: "properties", label: "Propiedades", path: "/vendedor/propiedades/nueva", active: activeSection === "properties" },
    { id: "publicSite", label: "Ver web", href: "/" },
    { id: "signout", label: "Cerrar sesión", action: "signout", variant: "cta" }
  ];
}
