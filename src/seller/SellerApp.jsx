"use client";

import { upload } from "@vercel/blob/client";
import { useEffect, useMemo, useRef, useState } from "react";
import { DocumentsPanel, NotesPanel } from "../components/ActivityPanels";
import AppNavbar from "../components/AppNavbar";
import { sellerNavbarItems } from "../components/AppNavbarConfig";
import ClientOperationCards from "../components/ClientOperationCards";
import ClientPropertyAssignmentsPanel, {
  emptyClientPropertyAssignmentForm
} from "../components/ClientPropertyAssignmentsPanel";
import {
  CATEGORY_META,
  filterAdminPropertiesByType,
  filterPropertiesBySearch,
  getAdminPropertyTypeTabs,
  propertyPublicPath,
  slugify
} from "../utils/properties";
import {
  activityAuthorFromProfile,
  createClientDocument,
  createClientNote,
  fetchClientDocuments,
  fetchClientNotes
} from "../utils/supabase/activity";
import {
  CLIENT_OPERATION_LABELS as operationLabels,
  CLIENT_OPERATIONS,
  CLIENT_STATUSES,
  deleteClientPropertyAssignment,
  fetchClients,
  fetchSearchRequests,
  saveClient,
  saveClientPropertyAssignment,
  SEARCH_REQUEST_STATUSES,
  SEARCH_REQUEST_STATUS_LABELS,
  SEARCH_REQUEST_OPERATION_LABELS,
  SEARCH_REQUEST_OPERATIONS,
  updateSearchRequest
} from "../utils/supabase/clients";
import {
  fetchInternalProfile,
  getCurrentSession,
  onAuthStateChange,
  signInSeller,
  signOutSeller
} from "../utils/supabase/sellers";
import { fetchInternalProperties, saveSellerProperty } from "../utils/supabase/properties";
import {
  getSellerClientIdFromPathname,
  getSellerRouteFromPathname,
  SELLER_HOME_PATH,
  SELLER_PROPERTIES_PATH,
  SELLER_NEW_PROPERTY_PATH,
  SELLER_SEARCH_REQUESTS_PATH,
  sellerClientPath,
  sellerPropertyEditPath,
  sellerPropertyPath
} from "./routing";
import logoMark from "../../ISO GRAFITO.png";

function assetUrl(asset) {
  return typeof asset === "string" ? asset : asset?.src || "";
}

const logoMarkUrl = assetUrl(logoMark);

const defaultPropertyCoords = {
  latitude: "-40.1573",
  longitude: "-71.3524"
};

const emptyPropertyForm = {
  databaseId: "",
  title: "",
  slug: "",
  location: "San Martin de los Andes, Neuquen",
  price: "Consultar",
  area: "Superficie a confirmar",
  category: "venta",
  latitude: defaultPropertyCoords.latitude,
  longitude: defaultPropertyCoords.longitude,
  markerColor: CATEGORY_META.venta.mapColor,
  summary: "",
  rawDescription: "",
  descriptionHtml: "",
  isPublished: true,
  displayOrder: 0,
  images: []
};

const imageContentTypes = ["image/avif", "image/jpeg", "image/png", "image/webp"];
const imageAccept = imageContentTypes.join(",");
const maxImageSizeInBytes = 25 * 1024 * 1024;

const mimeExtensions = {
  "image/avif": ".avif",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};

const statusLabels = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  visitando: "Visitando",
  cerrado: "Cerrado",
  pausado: "Pausado"
};

const emptyClientForm = {
  id: "",
  fullName: "",
  phone: "",
  email: "",
  isOwner: false,
  operation: "comprador",
  zone: "",
  budget: "",
  rooms: "",
  status: "nuevo",
  notes: "",
  propertyAssignments: []
};

function clientToForm(client) {
  return {
    id: client.id || "",
    fullName: client.fullName || "",
    phone: client.phone || "",
    email: client.email || "",
    isOwner: Boolean(client.isOwner),
    operation: CLIENT_OPERATIONS.includes(client.operation) ? client.operation : "comprador",
    zone: client.zone || "",
    budget: client.budget || "",
    rooms: client.rooms || "",
    status: CLIENT_STATUSES.includes(client.status) ? client.status : "nuevo",
    notes: client.notes || "",
    propertyAssignments: client.propertyAssignments || []
  };
}

function formatClientDate(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return entities[character];
  });
}

function textToParagraphHtml(text) {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function htmlToPlainText(html) {
  if (!html) return "";

  if (typeof window !== "undefined" && typeof window.DOMParser !== "undefined") {
    const doc = new window.DOMParser().parseFromString(html, "text/html");
    return (doc.body.innerText || doc.body.textContent || "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  }

  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function colorValue(value, fallback = CATEGORY_META.venta.mapColor) {
  return /^#[0-9a-f]{6}$/i.test(value || "") ? value : fallback;
}

function imagePathForFile(file, propertySlug, index) {
  const extension = file.name.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase() || mimeExtensions[file.type] || "";
  const baseName = extension ? file.name.slice(0, -extension.length) : file.name;
  const safeBaseName = slugify(baseName, 72) || "imagen";
  return `properties/${propertySlug}/${Date.now()}-${index}-${safeBaseName}${extension}`;
}

function getInitialSellerRoute() {
  if (typeof window === "undefined") return { section: "clients", clientId: "" };
  return getSellerRouteFromPathname(window.location.pathname);
}

function getInitialSellerSection() {
  return getInitialSellerRoute().section;
}

function getInitialSellerClientId() {
  if (typeof window === "undefined") return "";
  return getSellerClientIdFromPathname(window.location.pathname);
}

function getInitialSellerPropertyId() {
  return getInitialSellerRoute().propertyId;
}

function getInitialSellerPropertyMode() {
  return getInitialSellerRoute().propertyMode;
}

function propertyToForm(property) {
  const rawDescription = property.rawDescription || htmlToPlainText(property.descriptionHtml);

  return {
    databaseId: property.databaseId || property.id || "",
    title: property.title || "",
    slug: property.slug || slugify(property.title),
    location: property.location || "",
    price: property.price || "Consultar",
    area: property.area || "Superficie a confirmar",
    category: property.category || "venta",
    latitude: String(property.latitude ?? property.coords?.[0] ?? defaultPropertyCoords.latitude),
    longitude: String(property.longitude ?? property.coords?.[1] ?? defaultPropertyCoords.longitude),
    markerColor: property.markerColor || CATEGORY_META[property.category]?.mapColor || CATEGORY_META.venta.mapColor,
    summary: property.summary || "",
    rawDescription,
    descriptionHtml: property.descriptionHtml || textToParagraphHtml(rawDescription),
    isPublished: Boolean(property.isPublished),
    displayOrder: property.displayOrder || 0,
    images: property.images || []
  };
}

function navigateSellerPath(path, options = {}) {
  if (typeof window === "undefined") return;
  const method = options.replace ? "replaceState" : "pushState";
  if (window.location.pathname === path) return;
  window.history[method]({}, "", path);
}

function detailValue(value) {
  return value || "Sin cargar";
}

function ClientDetailField({ label, value, className = "" }) {
  return (
    <div className={className}>
      <span>{label}</span>
      <strong>{detailValue(value)}</strong>
    </div>
  );
}

function ClientDetailView({
  client,
  internalProfile,
  session,
  activityAuthor,
  propertyAssignmentForm,
  properties,
  isSavingPropertyAssignment,
  isLoadingProperties,
  onPropertyAssign,
  onPropertyAssignmentDelete,
  onPropertyAssignmentFormChange,
  onEdit,
  onNewClient
}) {
  const contact = [client.phone, client.email].filter(Boolean).join(" · ");

  return (
    <section className="seller-contact-editor" aria-label="Detalle del cliente">
      <div className="admin-editor-title">
        <div>
          <p>Cliente</p>
          <h2>{client.fullName || "Sin nombre"}</h2>
        </div>
        {internalProfile ? (
          <span className="seller-profile-chip">
            {internalProfile.role === "admin" ? "Admin" : "Vendedor"}
          </span>
        ) : null}
      </div>

      <div className="admin-editor-actions">
        <button type="button" className="wa-btn" onClick={onEdit}>
          Editar cliente
        </button>
        <button type="button" className="map-btn" onClick={onNewClient}>
          Nuevo cliente
        </button>
      </div>

      <div className="admin-detail-grid seller-client-detail-grid">
        <ClientDetailField label="Contacto" value={contact} />
        <ClientDetailField label="Tipo de cliente" value={operationLabels[client.operation] || client.operation} />
        <ClientDetailField label="Estado" value={statusLabels[client.status] || client.status} />
        <ClientDetailField label="Zona" value={client.zone} />
        <ClientDetailField label="Presupuesto" value={client.budget} />
        <ClientDetailField label="Ambientes" value={client.rooms} />
        <ClientDetailField label="Última actualización" value={formatClientDate(client.updatedAt || client.createdAt)} />
        <ClientDetailField label="Notas" value={client.notes} className="admin-field-wide" />
      </div>

      <ClientPropertyAssignmentsPanel
        assignments={client.propertyAssignments || []}
        properties={properties}
        form={propertyAssignmentForm}
        isSaving={isSavingPropertyAssignment}
        isLoadingProperties={isLoadingProperties}
        onAssign={(event) => onPropertyAssign(event, client.id)}
        onDelete={onPropertyAssignmentDelete}
        onFormChange={onPropertyAssignmentFormChange}
      />

      <NotesPanel
        entityId={client.id}
        author={activityAuthor}
        fetchNotes={fetchClientNotes}
        createNote={createClientNote}
      />
      <DocumentsPanel
        entityType="client"
        entityId={client.id}
        accessToken={session?.access_token || ""}
        author={activityAuthor}
        fetchDocuments={fetchClientDocuments}
        createDocument={createClientDocument}
      />
    </section>
  );
}

function LoginPanel({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const { error: loginError } = await signInSeller(username, password);

    if (loginError) {
      setError("Usuario o contraseña incorrectos.");
      setIsSubmitting(false);
      return;
    }

    onLogin();
  };

  return (
    <main className="admin-shell admin-shell--login seller-shell">
      <section className="admin-login-panel">
        <img src={logoMarkUrl} alt="Logo Denise Catalán" />
        <h1>Vendedor</h1>
        <form onSubmit={handleSubmit} className="admin-form">
          <label>
            Usuario
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error ? <p className="admin-error">{error}</p> : null}
          <button type="submit" className="wa-btn" disabled={isSubmitting}>
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
        <a className="admin-back-link" href="/">
          Volver a la web
        </a>
      </section>
    </main>
  );
}

function SellerApp() {
  const [session, setSession] = useState(undefined);
  const [internalProfile, setInternalProfile] = useState(null);
  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [activeSection, setActiveSection] = useState(getInitialSellerSection);
  const [selectedClientId, setSelectedClientId] = useState(getInitialSellerClientId);
  const [selectedPropertyId, setSelectedPropertyId] = useState(getInitialSellerPropertyId);
  const [propertyMode, setPropertyMode] = useState(getInitialSellerPropertyMode);
  const [editorMode, setEditorMode] = useState(() => (getInitialSellerClientId() ? "view" : "edit"));
  const [form, setForm] = useState(emptyClientForm);
  const [propertyForm, setPropertyForm] = useState(emptyPropertyForm);
  const [propertyAssignmentForm, setPropertyAssignmentForm] = useState(emptyClientPropertyAssignmentForm);
  const [filters, setFilters] = useState({ operation: "", status: "" });
  const [propertyTypeTab, setPropertyTypeTab] = useState("venta");
  const [propertySearchQuery, setPropertySearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingProperty, setIsSavingProperty] = useState(false);
  const [isSavingPropertyAssignment, setIsSavingPropertyAssignment] = useState(false);
  const [isUploadingPropertyImages, setIsUploadingPropertyImages] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [propertyMessage, setPropertyMessage] = useState("");
  const [propertyError, setPropertyError] = useState("");
  const [searchRequests, setSearchRequests] = useState([]);
  const [searchRequestFilters, setSearchRequestFilters] = useState({ status: "", operation: "" });
  const [searchRequestError, setSearchRequestError] = useState("");
  const [searchRequestMessage, setSearchRequestMessage] = useState("");
  const [isSavingSearchRequest, setIsSavingSearchRequest] = useState(false);
  const [selectedSearchRequestId, setSelectedSearchRequestId] = useState("");
  const [showPropertyAssignmentForm, setShowPropertyAssignmentForm] = useState(false);
  const [savedPropertyPath, setSavedPropertyPath] = useState("");
  const selectedClientIdRef = useRef(selectedClientId);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) || null,
    [clients, selectedClientId]
  );
  const selectedProperty = useMemo(
    () =>
      properties.find((property) => property.id === selectedPropertyId || property.databaseId === selectedPropertyId) ||
      null,
    [properties, selectedPropertyId]
  );
  const filteredProperties = useMemo(
    () => filterPropertiesBySearch(filterAdminPropertiesByType(properties, propertyTypeTab), propertySearchQuery),
    [properties, propertySearchQuery, propertyTypeTab]
  );
  const propertyTypeTabs = useMemo(
    () => getAdminPropertyTypeTabs(properties),
    [properties]
  );
  const activePropertyTypeProperties = useMemo(
    () => filterAdminPropertiesByType(properties, propertyTypeTab),
    [properties, propertyTypeTab]
  );
  const activityAuthor = useMemo(() => {
    if (!session?.user?.id) return null;
    return activityAuthorFromProfile(session.user.id, internalProfile);
  }, [internalProfile, session?.user?.id]);

  useEffect(() => {
    selectedClientIdRef.current = selectedClientId;
  }, [selectedClientId]);

  useEffect(() => {
    const syncSelectedClientFromRoute = () => {
      const sellerRoute = getInitialSellerRoute();
      const routedClientId = sellerRoute.clientId;

      setActiveSection(sellerRoute.section);
      setSelectedClientId(routedClientId);
      setSelectedPropertyId(sellerRoute.propertyId);
      setPropertyMode(sellerRoute.propertyMode);
      setSelectedSearchRequestId(sellerRoute.searchRequestId || "");
      setEditorMode(routedClientId ? "view" : "edit");
      setMessage("");
      setError("");
      setPropertyMessage("");
      setPropertyError("");

      if (sellerRoute.section === "clients" && !routedClientId) {
        setForm(emptyClientForm);
      }

      if (sellerRoute.section === "properties" && sellerRoute.propertyMode === "new") {
        setPropertyForm(emptyPropertyForm);
      }
    };

    syncSelectedClientFromRoute();
    window.addEventListener("popstate", syncSelectedClientFromRoute);

    return () => {
      window.removeEventListener("popstate", syncSelectedClientFromRoute);
    };
  }, []);

  useEffect(() => {
    let active = true;

    getCurrentSession().then(({ data }) => {
      if (active) setSession(data.session);
    });

    const listener = onAuthStateChange((nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      listener.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!selectedClient) {
      if (selectedClientId) setForm(emptyClientForm);
      return;
    }
    setForm(clientToForm(selectedClient));
    setPropertyAssignmentForm(emptyClientPropertyAssignmentForm);
    setShowPropertyAssignmentForm(false);
  }, [selectedClient, selectedClientId]);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!session?.user?.id) {
        setInternalProfile(null);
        setClients([]);
        setProperties([]);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const profile = await fetchInternalProfile(session.user.id);
        if (!active) return;

        if (!profile) {
          setInternalProfile(null);
          setClients([]);
          setProperties([]);
          setError("Tu usuario no esta activo para acceder al portal interno.");
          return;
        }

        setInternalProfile(profile);
      } catch (profileError) {
        if (active) setError(profileError.message);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [session]);

  const loadClients = async () => {
    if (!internalProfile) return;

    setIsLoading(true);
    setError("");

    try {
      const data = await fetchClients(filters);
      const currentSelectedClientId = selectedClientIdRef.current;

      setClients(data);
      setSelectedClientId(currentSelectedClientId);

      if (!currentSelectedClientId) {
        setForm(emptyClientForm);
      }
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [internalProfile, filters.operation, filters.status]);

  const loadProperties = async () => {
    if (!internalProfile) return;

    setIsLoadingProperties(true);

    try {
      const data = await fetchInternalProperties();
      setProperties(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoadingProperties(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, [internalProfile]);

  const loadSearchRequests = async () => {
    if (!internalProfile) {
      setSearchRequests([]);
      return;
    }
    setSearchRequestError("");
    try {
      const data = await fetchSearchRequests(searchRequestFilters);
      setSearchRequests(data);
    } catch (loadError) {
      setSearchRequestError(loadError.message);
    }
  };

  useEffect(() => {
    loadSearchRequests();
  }, [internalProfile, searchRequestFilters.status, searchRequestFilters.operation]);

  const handleSearchRequestStatusUpdate = async (id, status) => {
    setIsSavingSearchRequest(true);
    setSearchRequestError("");
    try {
      const updated = await updateSearchRequest(id, { status });
      setSearchRequests((current) => current.map((sr) => (sr.id === id ? updated : sr)));
      setSearchRequestMessage("Estado actualizado.");
      setTimeout(() => setSearchRequestMessage(""), 3000);
    } catch (saveError) {
      setSearchRequestError(saveError.message);
    } finally {
      setIsSavingSearchRequest(false);
    }
  };

  const handleSearchRequestMessageUpdate = async (id, adminMessage) => {
    setIsSavingSearchRequest(true);
    setSearchRequestError("");
    try {
      const updated = await updateSearchRequest(id, { adminMessage });
      setSearchRequests((current) => current.map((sr) => (sr.id === id ? updated : sr)));
      setSearchRequestMessage("Mensaje guardado.");
      setTimeout(() => setSearchRequestMessage(""), 3000);
    } catch (saveError) {
      setSearchRequestError(saveError.message);
    } finally {
      setIsSavingSearchRequest(false);
    }
  };

  useEffect(() => {
    if (activeSection !== "properties" || propertyMode !== "edit" || !selectedProperty) return;
    setPropertyForm(propertyToForm(selectedProperty));
  }, [activeSection, propertyMode, selectedProperty]);

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const updatePropertyField = (field, value) => {
    setPropertyForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const updatePropertyTitle = (title) => {
    setPropertyForm((current) => ({
      ...current,
      title,
      slug: slugify(title)
    }));
  };

  const updatePropertyDescription = (rawDescription) => {
    setPropertyForm((current) => ({
      ...current,
      rawDescription,
      descriptionHtml: textToParagraphHtml(rawDescription)
    }));
  };

  const updateFilter = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value
    }));
  };

  const startNewClient = () => {
    navigateSellerPath(SELLER_HOME_PATH);
    setActiveSection("clients");
    setSelectedClientId("");
    setEditorMode("edit");
    setForm(emptyClientForm);
    setPropertyAssignmentForm(emptyClientPropertyAssignmentForm);
    setMessage("");
    setError("");
  };

  const startNewProperty = ({ resetForm = true } = {}) => {
    navigateSellerPath(SELLER_NEW_PROPERTY_PATH);
    setActiveSection("properties");
    setSelectedClientId("");
    setSelectedPropertyId("");
    setPropertyMode("new");
    setEditorMode("edit");
    setMessage("");
    setError("");
    setPropertyMessage("");
    setPropertyError("");
    setSavedPropertyPath("");

    if (resetForm) {
      setPropertyForm({ ...emptyPropertyForm, displayOrder: properties.length });
    }
  };

  const openPropertiesList = () => {
    navigateSellerPath(SELLER_PROPERTIES_PATH);
    setActiveSection("properties");
    setSelectedClientId("");
    setSelectedPropertyId("");
    setPropertyMode("list");
    setMessage("");
    setError("");
    setPropertyMessage("");
    setPropertyError("");
  };

  const openPropertyView = (propertyId) => {
    navigateSellerPath(sellerPropertyPath(propertyId));
    setActiveSection("properties");
    setSelectedClientId("");
    setSelectedPropertyId(propertyId);
    setPropertyMode("view");
    setPropertyMessage("");
    setPropertyError("");
  };

  const openPropertyEdit = (property) => {
    const propertyId = property.databaseId || property.id;
    setPropertyForm(propertyToForm(property));
    navigateSellerPath(sellerPropertyEditPath(propertyId));
    setActiveSection("properties");
    setSelectedClientId("");
    setSelectedPropertyId(propertyId);
    setPropertyMode("edit");
    setPropertyMessage("");
    setPropertyError("");
  };

  const handleSellerNavbarItemSelect = (item) => {
    if (item.action === "signout") {
      signOutSeller();
      return;
    }

    if (item.path === SELLER_PROPERTIES_PATH) {
      openPropertiesList();
      return;
    }

    if (item.path === SELLER_SEARCH_REQUESTS_PATH) {
      navigateSellerPath(SELLER_SEARCH_REQUESTS_PATH);
      setActiveSection("searchRequests");
      setSelectedClientId("");
      setSelectedSearchRequestId("");
      return;
    }

    if (item.path === SELLER_HOME_PATH) {
      navigateSellerPath(SELLER_HOME_PATH);
      setActiveSection("clients");
      setSelectedClientId("");
      setEditorMode("edit");
      setForm(emptyClientForm);
      setMessage("");
      setError("");
    }
  };

  const openClientDetail = (clientId) => {
    navigateSellerPath(sellerClientPath(clientId));
    setActiveSection("clients");
    setSelectedClientId(clientId);
    setEditorMode("view");
    setPropertyAssignmentForm(emptyClientPropertyAssignmentForm);
    setMessage("");
    setError("");
  };

  const updatePropertyAssignmentField = (field, value) => {
    setPropertyAssignmentForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleClientPropertyAssign = async (event, clientId) => {
    event.preventDefault();

    if (!clientId) {
      setError("Guarda el cliente antes de asignarle una propiedad.");
      return;
    }

    setIsSavingPropertyAssignment(true);
    setMessage("");
    setError("");

    try {
      const savedAssignment = await saveClientPropertyAssignment({
        ...propertyAssignmentForm,
        clientId
      });
      setClients((currentClients) =>
        currentClients.map((client) =>
          client.id === clientId
            ? {
                ...client,
                propertyAssignments: [savedAssignment, ...(client.propertyAssignments || [])]
              }
            : client
        )
      );
      setForm((current) =>
        current.id === clientId
          ? {
              ...current,
              propertyAssignments: [savedAssignment, ...(current.propertyAssignments || [])]
            }
          : current
      );
      setPropertyAssignmentForm(emptyClientPropertyAssignmentForm);
      setMessage("Propiedad asignada al cliente.");
      await loadClients();
    } catch (assignmentError) {
      setError(assignmentError.message);
    } finally {
      setIsSavingPropertyAssignment(false);
    }
  };

  const handleClientPropertyAssignmentDelete = async (assignmentId) => {
    if (!assignmentId) return;

    setIsSavingPropertyAssignment(true);
    setMessage("");
    setError("");

    try {
      await deleteClientPropertyAssignment(assignmentId);
      setClients((currentClients) =>
        currentClients.map((client) => ({
          ...client,
          propertyAssignments: (client.propertyAssignments || []).filter((assignment) => assignment.id !== assignmentId)
        }))
      );
      setForm((current) => ({
        ...current,
        propertyAssignments: (current.propertyAssignments || []).filter((assignment) => assignment.id !== assignmentId)
      }));
      setMessage("Propiedad quitada del cliente.");
      await loadClients();
    } catch (assignmentError) {
      setError(assignmentError.message);
    } finally {
      setIsSavingPropertyAssignment(false);
    }
  };

  const handlePropertyImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) return;

    setPropertyMessage("");
    setPropertyError("");
    setSavedPropertyPath("");

    if (!session?.access_token) {
      setPropertyError("Tu sesion expiro. Volve a ingresar para subir imagenes.");
      return;
    }

    const invalidFile = files.find((file) => !imageContentTypes.includes(file.type));
    if (invalidFile) {
      setPropertyError(`Formato no permitido: ${invalidFile.name}. Usa JPG, PNG, WEBP o AVIF.`);
      return;
    }

    const oversizedFile = files.find((file) => file.size > maxImageSizeInBytes);
    if (oversizedFile) {
      setPropertyError(`${oversizedFile.name} supera el limite de 25 MB para subir imagenes.`);
      return;
    }

    const propertySlug = slugify(propertyForm.slug || propertyForm.title || "propiedad", 80) || "propiedad";
    setIsUploadingPropertyImages(true);

    try {
      const uploadedUrls = [];

      for (const [index, file] of files.entries()) {
        const blob = await upload(imagePathForFile(file, propertySlug, index), file, {
          access: "public",
          handleUploadUrl: "/api/blob/upload",
          contentType: file.type,
          multipart: file.size > 4 * 1024 * 1024,
          clientPayload: JSON.stringify({
            accessToken: session.access_token,
            uploadType: "property-image",
            propertyId: propertyForm.databaseId || null
          })
        });

        uploadedUrls.push(blob.url);
      }

      setPropertyForm((current) => ({
        ...current,
        images: [...current.images, ...uploadedUrls]
      }));
      setPropertyMessage("Imagenes subidas. Guarda la propiedad para publicarlas.");
    } catch (uploadError) {
      setPropertyError(
        uploadError.message.includes("Failed to fetch")
          ? "No pude contactar la ruta de subida. En local, usa Vercel Dev o desplega en Vercel para probar Blob."
          : uploadError.message
      );
    } finally {
      setIsUploadingPropertyImages(false);
    }
  };

  const removePropertyImage = (imageIndex) => {
    setPropertyForm((current) => ({
      ...current,
      images: current.images.filter((_, index) => index !== imageIndex)
    }));
  };

  const handlePropertySave = async (event) => {
    event.preventDefault();

    if (!session?.user?.id) {
      setPropertyError("Tu sesion expiro. Volve a ingresar para guardar propiedades.");
      return;
    }

    setIsSavingProperty(true);
    setPropertyMessage("");
    setPropertyError("");
    setSavedPropertyPath("");

    try {
      const payload = {
        ...propertyForm,
        markerColor:
          propertyForm.markerColor ||
          CATEGORY_META[propertyForm.category]?.mapColor ||
          CATEGORY_META.venta.mapColor,
        descriptionHtml: propertyForm.descriptionHtml || textToParagraphHtml(propertyForm.rawDescription)
      };
      const propertyId = await saveSellerProperty(payload);
      setPropertyMessage("Propiedad guardada.");
      setSavedPropertyPath(propertyPublicPath(payload));
      await loadProperties();
      setSelectedPropertyId(propertyId);
      setPropertyMode("view");
      navigateSellerPath(sellerPropertyPath(propertyId), { replace: true });

      if (!payload.databaseId && !payload.id) {
        setPropertyForm({ ...emptyPropertyForm, displayOrder: properties.length + 1 });
      }
    } catch (saveError) {
      setPropertyError(saveError.message);
    } finally {
      setIsSavingProperty(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!session?.user?.id) {
      setError("Tu sesion expiro. Volve a ingresar.");
      return;
    }

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const savedClient = await saveClient(form, session.user.id);
      setMessage("Cliente guardado.");
      await loadClients();
      navigateSellerPath(sellerClientPath(savedClient.id), { replace: true });
      setSelectedClientId(savedClient.id);
      setEditorMode("view");
      setForm(clientToForm(savedClient));
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getPropertyCategoryLabel = (property) =>
    CATEGORY_META[property.category]?.label || property.category || "Sin categoria";

  const renderPropertiesList = () => {
    const hasPropertySearch = propertySearchQuery.trim().length > 0;
    const activePropertyTypeLabel =
      propertyTypeTabs.find((tab) => tab.id === propertyTypeTab)?.label || "propiedades";

    return (
      <section className="admin-sellers-panel" aria-labelledby="seller-properties-title">
        <div className="admin-sellers-header">
          <div>
            <p>Inventario</p>
            <h2 id="seller-properties-title">Propiedades</h2>
          </div>
          <div className="admin-header-actions">
            <button type="button" className="map-btn" onClick={loadProperties} disabled={!internalProfile || isLoadingProperties}>
              Actualizar
            </button>
            <button type="button" className="wa-btn" onClick={() => startNewProperty()}>
              Nueva propiedad
            </button>
          </div>
        </div>

        <div className="admin-property-tabs" role="tablist" aria-label="Tipos de propiedades">
          {propertyTypeTabs.map((tab) => (
            <button
              type="button"
              role="tab"
              aria-selected={tab.id === propertyTypeTab}
              className={tab.id === propertyTypeTab ? "is-active" : ""}
              key={tab.id}
              onClick={() => setPropertyTypeTab(tab.id)}
            >
              <span>{tab.label}</span>
              <small>{tab.count}</small>
            </button>
          ))}
        </div>

        <div className="admin-property-search">
          <label>
            <span>Buscar propiedades</span>
            <input
              type="search"
              value={propertySearchQuery}
              onChange={(event) => setPropertySearchQuery(event.target.value)}
              placeholder="Titulo, ubicacion, precio, estado, descripcion..."
              autoComplete="off"
            />
          </label>
          <div className="admin-property-search-meta">
            <span>
              {hasPropertySearch
                ? `${filteredProperties.length} de ${activePropertyTypeProperties.length} resultados en ${activePropertyTypeLabel}`
                : `${activePropertyTypeProperties.length} de ${properties.length} propiedades en ${activePropertyTypeLabel}`}
            </span>
            {hasPropertySearch ? (
              <button type="button" className="map-btn" onClick={() => setPropertySearchQuery("")}>
                Limpiar
              </button>
            ) : null}
          </div>
        </div>

        {propertyMessage ? <p className="admin-success">{propertyMessage}</p> : null}
        {propertyError ? <p className="admin-error">{propertyError}</p> : null}
        {isLoadingProperties && !properties.length ? <p className="admin-sidebar-note">Cargando propiedades...</p> : null}

        <div className="admin-property-list">
          {filteredProperties.map((property) => (
            <article className="admin-property-row" key={property.id}>
              <span>{property.title || "Sin titulo"}</span>
              <small>
                <span>{getPropertyCategoryLabel(property)}</span>
                <span>{property.location || "Sin ubicacion"}</span>
                <span>{property.price || "Consultar"}</span>
                <span className={`admin-publish-chip ${property.isPublished ? "is-published" : "is-hidden"}`}>
                  {property.isPublished ? "Publicada" : "Oculta"}
                </span>
                <button type="button" className="map-btn" onClick={() => openPropertyView(property.databaseId || property.id)}>
                  Ver
                </button>
                <button type="button" className="map-btn" onClick={() => openPropertyEdit(property)}>
                  Editar
                </button>
              </small>
            </article>
          ))}
          {!isLoadingProperties && !properties.length ? (
            <p className="seller-empty-state">No hay propiedades cargadas.</p>
          ) : null}
          {properties.length && !activePropertyTypeProperties.length ? (
            <p className="seller-empty-state">No hay propiedades en {activePropertyTypeLabel}.</p>
          ) : null}
          {activePropertyTypeProperties.length && !filteredProperties.length ? (
            <p className="seller-empty-state">No encontramos propiedades para esa busqueda.</p>
          ) : null}
        </div>
      </section>
    );
  };

  const renderPropertyNotFound = () => (
    <section className="admin-panel">
      <h2>Propiedad no encontrada</h2>
      <p className="seller-empty-state">No encontramos esa propiedad en el inventario.</p>
      <button type="button" className="wa-btn" onClick={openPropertiesList}>
        Volver a propiedades
      </button>
    </section>
  );

  const renderPropertyView = (property) => (
    <section className="seller-contact-editor" aria-labelledby="seller-property-view-title">
      <div className="admin-editor-title">
        <div>
          <p>{getPropertyCategoryLabel(property)}</p>
          <h2 id="seller-property-view-title">{property.title || "Sin titulo"}</h2>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="map-btn" onClick={openPropertiesList}>
            Volver
          </button>
          <button type="button" className="wa-btn" onClick={() => openPropertyEdit(property)}>
            Editar
          </button>
        </div>
      </div>

      {propertyMessage ? <p className="admin-success">{propertyMessage}</p> : null}
      {propertyError ? <p className="admin-error">{propertyError}</p> : null}

      <div className="admin-detail-grid seller-client-detail-grid">
        <ClientDetailField label="Valor" value={property.price || "Consultar"} />
        <ClientDetailField label="Superficie" value={property.area || "Superficie a confirmar"} />
        <ClientDetailField label="Ubicacion" value={property.location} />
        <ClientDetailField label="Estado" value={property.isPublished ? "Publicada" : "Oculta"} />
        <ClientDetailField label="Resumen" value={property.summary} className="admin-field-wide" />
      </div>

      <section className="admin-description-widget">
        <div className="admin-widget-header">
          <h3>Ficha tecnica</h3>
        </div>
        <div
          className="admin-preview-pane rich-text"
          dangerouslySetInnerHTML={{
            __html: property.descriptionHtml || "<p>Sin ficha tecnica cargada.</p>"
          }}
        />
      </section>

      <section className="admin-images-field">
        <div className="admin-images-header">
          <span>{property.images.length ? `${property.images.length} imagenes cargadas` : "Sin imagenes cargadas"}</span>
        </div>
        {property.images.length ? (
          <div className="admin-image-grid">
            {property.images.map((url, index) => (
              <div className="admin-image-preview" key={`${url}-${index}`}>
                <img src={url} alt={`Imagen ${index + 1} de ${property.title || "propiedad"}`} />
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </section>
  );

  const renderPropertyEditor = () => (
    <form className="seller-contact-editor" onSubmit={handlePropertySave}>
      <div className="admin-editor-title">
        <div>
          <p>{propertyForm.databaseId ? "Editar propiedad" : "Nueva propiedad"}</p>
          <h2>{propertyForm.title || "Sin titulo"}</h2>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="map-btn" onClick={openPropertiesList}>
            Volver
          </button>
          {internalProfile ? (
            <span className="seller-profile-chip">
              {internalProfile.role === "admin" ? "Admin" : "Vendedor"}
            </span>
          ) : null}
        </div>
      </div>

      {propertyMessage ? (
        <p className="admin-success">
          {propertyMessage}
          {savedPropertyPath ? (
            <>
              {" "}
              <a href={savedPropertyPath}>Ver en la web</a>
            </>
          ) : null}
        </p>
      ) : null}
      {propertyError ? <p className="admin-error">{propertyError}</p> : null}

      <div className="admin-grid">
        <label>
          Titulo
          <input
            value={propertyForm.title}
            onChange={(event) => updatePropertyTitle(event.target.value)}
            required
          />
        </label>
        <label>
          Categoria
          <select
            value={propertyForm.category}
            onChange={(event) => {
              const nextCategory = event.target.value;
              setPropertyForm((current) => ({
                ...current,
                category: nextCategory,
                markerColor: CATEGORY_META[nextCategory]?.mapColor || current.markerColor
              }));
            }}
          >
            {Object.entries(CATEGORY_META).map(([value, meta]) => (
              <option value={value} key={value}>
                {meta.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Valor
          <input value={propertyForm.price} onChange={(event) => updatePropertyField("price", event.target.value)} />
        </label>
        <label>
          Superficie
          <input value={propertyForm.area} onChange={(event) => updatePropertyField("area", event.target.value)} />
        </label>
        <label className="admin-field-wide">
          Ubicacion
          <input
            value={propertyForm.location}
            onChange={(event) => updatePropertyField("location", event.target.value)}
          />
        </label>
        <label>
          Latitud
          <input
            type="number"
            step="any"
            value={propertyForm.latitude}
            onChange={(event) => updatePropertyField("latitude", event.target.value)}
            required
          />
        </label>
        <label>
          Longitud
          <input
            type="number"
            step="any"
            value={propertyForm.longitude}
            onChange={(event) => updatePropertyField("longitude", event.target.value)}
            required
          />
        </label>
        <label className="admin-color-field">
          Color del punto
          <div className="admin-color-picker">
            <input
              type="color"
              value={colorValue(
                propertyForm.markerColor,
                CATEGORY_META[propertyForm.category]?.mapColor || CATEGORY_META.venta.mapColor
              )}
              onChange={(event) => updatePropertyField("markerColor", event.target.value)}
              aria-label="Color del punto"
            />
            <input
              type="text"
              value={propertyForm.markerColor}
              onChange={(event) => updatePropertyField("markerColor", event.target.value)}
            />
          </div>
        </label>
        <label className="admin-toggle admin-seller-toggle">
          <input
            type="checkbox"
            checked={propertyForm.isPublished}
            onChange={(event) => updatePropertyField("isPublished", event.target.checked)}
          />
          Publicada
        </label>
        <label className="admin-field-wide">
          Resumen
          <textarea
            rows="4"
            value={propertyForm.summary}
            onChange={(event) => updatePropertyField("summary", event.target.value)}
          />
        </label>
        <label className="admin-field-wide">
          Ficha tecnica
          <textarea
            rows="9"
            value={propertyForm.rawDescription}
            onChange={(event) => updatePropertyDescription(event.target.value)}
          />
        </label>
      </div>

      <div className="admin-images-field">
        <div className="admin-images-header">
          <label className="admin-upload-control">
            Subir imagenes
            <input
              type="file"
              accept={imageAccept}
              multiple
              onChange={handlePropertyImageUpload}
              disabled={isUploadingPropertyImages}
            />
          </label>
          <span>{isUploadingPropertyImages ? "Subiendo..." : `${propertyForm.images.length} imagenes`}</span>
        </div>
        {propertyForm.images.length ? (
          <div className="admin-image-grid">
            {propertyForm.images.map((url, index) => (
              <div className="admin-image-preview" key={`${url}-${index}`}>
                <img src={url} alt={`Imagen ${index + 1} de ${propertyForm.title || "propiedad"}`} />
                <button type="button" onClick={() => removePropertyImage(index)}>
                  Quitar
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="admin-editor-actions">
        <button type="submit" className="wa-btn" disabled={!internalProfile || isSavingProperty}>
          {isSavingProperty ? "Guardando..." : "Guardar propiedad"}
        </button>
        <button type="button" className="map-btn" onClick={() => startNewProperty()}>
          Limpiar
        </button>
      </div>
    </form>
  );

  const renderSearchRequestsList = () => (
    <section className="admin-sellers-panel" aria-labelledby="seller-search-requests-title">
      <div className="admin-sellers-header">
        <div>
          <p>Portal de clientes</p>
          <h2 id="seller-search-requests-title">Búsquedas</h2>
        </div>
      </div>

      {searchRequestMessage ? <p className="admin-success">{searchRequestMessage}</p> : null}
      {searchRequestError ? <p className="admin-error">{searchRequestError}</p> : null}

      <div className="admin-grid">
        <label>
          Operación
          <select
            value={searchRequestFilters.operation}
            onChange={(event) =>
              setSearchRequestFilters((current) => ({ ...current, operation: event.target.value }))
            }
          >
            <option value="">Todas</option>
            {SEARCH_REQUEST_OPERATIONS.map((op) => (
              <option value={op} key={op}>
                {SEARCH_REQUEST_OPERATION_LABELS[op]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Estado
          <select
            value={searchRequestFilters.status}
            onChange={(event) =>
              setSearchRequestFilters((current) => ({ ...current, status: event.target.value }))
            }
          >
            <option value="">Todos</option>
            {SEARCH_REQUEST_STATUSES.map((s) => (
              <option value={s} key={s}>
                {SEARCH_REQUEST_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="admin-table-list">
        {searchRequests.map((sr) => (
          <div className="admin-table-row" key={sr.id}>
            <div>
              <strong>{sr.userName || sr.userEmail || "Usuario sin perfil"}</strong>
              <span>{SEARCH_REQUEST_OPERATION_LABELS[sr.operation] || sr.operation}</span>
              <small>
                {sr.zone || "Sin zona"} · {sr.budget || "Sin presupuesto"} · {sr.rooms || "Sin ambientes"}
              </small>
              <small>{formatClientDate(sr.updatedAt || sr.createdAt)}</small>
            </div>
            <span className={`seller-status-pill seller-status-pill--${sr.status}`}>
              {SEARCH_REQUEST_STATUS_LABELS[sr.status] || sr.status}
            </span>
            <div className="admin-header-actions">
              <button
                type="button"
                className="map-btn"
                onClick={() => {
                  navigateSellerPath(`${SELLER_SEARCH_REQUESTS_PATH}/${sr.id}`);
                  setActiveSection("searchRequests");
                  setSelectedSearchRequestId(sr.id);
                }}
              >
                Ver
              </button>
            </div>
          </div>
        ))}
        {!searchRequests.length ? <p className="seller-empty-state">No hay busquedas para estos filtros.</p> : null}
      </div>
    </section>
  );

  const renderSearchRequestView = (sr) => (
    <section className="admin-editor" aria-labelledby="seller-search-request-view-title">
      <div className="admin-editor-title">
        <div>
          <p>Búsqueda de cliente</p>
          <h2 id="seller-search-request-view-title">{sr.userName || sr.userEmail || "Usuario sin perfil"}</h2>
        </div>
        <div className="admin-header-actions">
          <button
            type="button"
            className="map-btn"
            onClick={() => {
              navigateSellerPath(SELLER_SEARCH_REQUESTS_PATH);
              setActiveSection("searchRequests");
              setSelectedSearchRequestId("");
            }}
          >
            Volver
          </button>
        </div>
      </div>

      {searchRequestMessage ? <p className="admin-success">{searchRequestMessage}</p> : null}
      {searchRequestError ? <p className="admin-error">{searchRequestError}</p> : null}

      <div className="admin-grid">
        <label>
          Cliente
          <input readOnly value={sr.userName || "Sin nombre"} />
        </label>
        <label>
          Email
          <input readOnly value={sr.userEmail || "Sin email"} />
        </label>
        <label>
          Operación
          <input readOnly value={SEARCH_REQUEST_OPERATION_LABELS[sr.operation] || sr.operation} />
        </label>
        <label>
          Zona
          <input readOnly value={sr.zone || "Sin zona"} />
        </label>
        <label>
          Presupuesto
          <input readOnly value={sr.budget || "Sin presupuesto"} />
        </label>
        <label>
          Ambientes
          <input readOnly value={sr.rooms || "Sin ambientes"} />
        </label>
        <label className="admin-field-wide">
          Detalle de búsqueda
          <textarea readOnly rows="4" value={sr.searchDetail || "Sin detalle"} />
        </label>
        <label className="admin-field-wide">
          Preferencias
          <textarea readOnly rows="3" value={sr.preferences || "Sin preferencias"} />
        </label>
        <label className="admin-field-wide">
          No negociables
          <textarea readOnly rows="2" value={sr.mustHaves || "Sin requisitos"} />
        </label>
        <label>
          Fecha de creación
          <input readOnly value={formatClientDate(sr.createdAt)} />
        </label>
        <label>
          Última actualización
          <input readOnly value={formatClientDate(sr.updatedAt)} />
        </label>
      </div>

      <div className="admin-grid" style={{ marginTop: "1.5rem" }}>
        <label>
          Estado
          <select
            value={sr.status}
            disabled={isSavingSearchRequest}
            onChange={(event) => handleSearchRequestStatusUpdate(sr.id, event.target.value)}
          >
            {SEARCH_REQUEST_STATUSES.map((s) => (
              <option value={s} key={s}>
                {SEARCH_REQUEST_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-field-wide">
          Mensaje para el cliente
          <textarea
            rows="3"
            defaultValue={sr.adminMessage || ""}
            disabled={isSavingSearchRequest}
            onBlur={(event) => {
              if (event.target.value !== (sr.adminMessage || "")) {
                handleSearchRequestMessageUpdate(sr.id, event.target.value);
              }
            }}
          />
        </label>
      </div>
    </section>
  );

  const renderSearchRequestsSection = () => {
    if (!selectedSearchRequestId) return renderSearchRequestsList();

    const sr = searchRequests.find((item) => item.id === selectedSearchRequestId);
    if (!sr) {
      return (
        <section className="admin-panel">
          <p>No se encontró la búsqueda.</p>
          <button
            type="button"
            className="wa-btn"
            onClick={() => {
              navigateSellerPath(SELLER_SEARCH_REQUESTS_PATH);
              setActiveSection("searchRequests");
              setSelectedSearchRequestId("");
            }}
          >
            Volver a búsquedas
          </button>
        </section>
      );
    }

    return renderSearchRequestView(sr);
  };

  const renderPropertiesSection = () => {
    if (propertyMode === "list") return renderPropertiesList();

    if (propertyMode === "new") return renderPropertyEditor();

    if (!selectedPropertyId) return renderPropertyNotFound();

    if (!selectedProperty) {
      if (isLoadingProperties) {
        return (
          <section className="admin-panel">
            <h2>Cargando propiedad...</h2>
            <p className="seller-empty-state">Buscando los datos de la propiedad.</p>
          </section>
        );
      }

      return renderPropertyNotFound();
    }

    if (propertyMode === "edit") return renderPropertyEditor();

    return renderPropertyView(selectedProperty);
  };

  if (session === undefined) {
    return (
      <main className="admin-shell admin-shell--login seller-shell">
        <section className="admin-login-panel">
          <p>Cargando vendedor...</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return <LoginPanel onLogin={() => {}} />;
  }

  return (
    <main className="admin-shell seller-shell">
      <AppNavbar
        ariaLabel="Navegacion del portal de vendedores"
        brandLabel="Portal vendedores"
        logoUrl={logoMarkUrl}
        onBrandClick={() => handleSellerNavbarItemSelect({ path: SELLER_HOME_PATH })}
        items={sellerNavbarItems({ activeSection, isClientDetail: Boolean(selectedClientId) })}
        onItemSelect={handleSellerNavbarItemSelect}
      />
      <header className="admin-header">
        <div>
          <p>Denise Catalán</p>
          <h1>{activeSection === "properties" ? "Propiedades" : activeSection === "searchRequests" ? "Búsquedas" : "Portal de vendedores"}</h1>
        </div>
        <div className="admin-header-actions">
          {activeSection === "properties" ? (
            <>
              <button type="button" className="map-btn" onClick={startNewClient}>
                Clientes
              </button>
              <button type="button" className="wa-btn" onClick={() => startNewProperty()}>
                Nueva propiedad
              </button>
            </>
          ) : (
            <button type="button" className="map-btn" onClick={loadClients} disabled={!internalProfile || isLoading}>
              Actualizar
            </button>
          )}
        </div>
      </header>

      {activeSection === "clients" && message ? <p className="admin-success seller-global-message">{message}</p> : null}
      {error && (activeSection === "clients" || !internalProfile) ? (
        <p className="admin-error seller-global-message">{error}</p>
      ) : null}

      {activeSection === "properties" ? (
        renderPropertiesSection()
      ) : activeSection === "searchRequests" ? (
        renderSearchRequestsSection()
      ) : (
      <section className="seller-layout">
        <aside className="seller-contact-list">
          <div className="admin-sidebar-header">
            <h2>Clientes</h2>
            <button type="button" className="wa-btn" onClick={startNewClient}>
              Nuevo
            </button>
          </div>

          <div className="seller-filters">
            <label>
              Operación
              <select value={filters.operation} onChange={(event) => updateFilter("operation", event.target.value)}>
                <option value="">Todas</option>
                {CLIENT_OPERATIONS.map((operation) => (
                  <option value={operation} key={operation}>
                    {operationLabels[operation]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Estado
              <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
                <option value="">Todos</option>
                {CLIENT_STATUSES.map((status) => (
                  <option value={status} key={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isLoading && !clients.length ? <p className="admin-sidebar-note">Cargando clientes...</p> : null}
          <div className="seller-contact-rows">
            {clients.map((client) => (
              <button
                type="button"
                key={client.id}
                className={`seller-contact-row ${client.id === selectedClientId ? "active" : ""}`}
                onClick={() => openClientDetail(client.id)}
              >
                <span>{client.fullName}</span>
                <small>
                  {operationLabels[client.operation] || client.operation}
                  <span className={`seller-status-pill seller-status-pill--${client.status}`}>
                    {statusLabels[client.status] || client.status}
                  </span>
                </small>
                <small>{client.zone || "Sin zona"} · {formatClientDate(client.updatedAt || client.createdAt)}</small>
              </button>
            ))}
            {!isLoading && !clients.length ? (
              <p className="seller-empty-state">No hay clientes para estos filtros.</p>
            ) : null}
          </div>
        </aside>

        {selectedClientId && !selectedClient ? (
          <section className="seller-contact-editor" aria-label="Cliente no encontrado">
            <div className="admin-editor-title">
              <div>
                <p>Cliente</p>
                <h2>{isLoading ? "Cargando cliente..." : "Cliente no encontrado"}</h2>
              </div>
            </div>
            <p className="seller-empty-state">
              {isLoading ? "Buscando los datos del cliente." : "No se encontró un cliente con ese ID en el listado actual."}
            </p>
            {!isLoading ? (
              <div className="admin-editor-actions">
                <button type="button" className="map-btn" onClick={startNewClient}>
                  Volver a clientes
                </button>
              </div>
            ) : null}
          </section>
        ) : form.id && editorMode === "view" ? (
          <ClientDetailView
            client={selectedClient}
            internalProfile={internalProfile}
            session={session}
            activityAuthor={activityAuthor}
            propertyAssignmentForm={propertyAssignmentForm}
            properties={properties}
            isSavingPropertyAssignment={isSavingPropertyAssignment}
            isLoadingProperties={isLoadingProperties}
            onPropertyAssign={handleClientPropertyAssign}
            onPropertyAssignmentDelete={handleClientPropertyAssignmentDelete}
            onPropertyAssignmentFormChange={updatePropertyAssignmentField}
            onEdit={() => setEditorMode("edit")}
            onNewClient={startNewClient}
          />
        ) : (
        <form className="seller-contact-editor" onSubmit={handleSave}>
          <div className="admin-editor-title">
            <div>
              <p>{form.id ? "Editar cliente" : "Nuevo cliente"}</p>
              <h2>{form.fullName || "Sin nombre"}</h2>
            </div>
            {internalProfile ? (
              <span className="seller-profile-chip">
                {internalProfile.role === "admin" ? "Admin" : "Vendedor"}
              </span>
            ) : null}
          </div>

          <div className="admin-grid">
            <label>
              Nombre
              <input
                value={form.fullName}
                onChange={(event) => updateForm("fullName", event.target.value)}
                required
              />
            </label>
            <label>
              Teléfono
              <input value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} />
            </label>
            <label>
              Email
              <input type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} />
            </label>
            <ClientOperationCards
              value={form.operation}
              onChange={(operation) => updateForm("operation", operation)}
            />
            <label>
              Zona
              <input value={form.zone} onChange={(event) => updateForm("zone", event.target.value)} />
            </label>
            <label>
              Presupuesto
              <input value={form.budget} onChange={(event) => updateForm("budget", event.target.value)} />
            </label>
            <label>
              Ambientes
              <input value={form.rooms} onChange={(event) => updateForm("rooms", event.target.value)} />
            </label>
            <label>
              Estado
              <select value={form.status} onChange={(event) => updateForm("status", event.target.value)}>
                {CLIENT_STATUSES.map((status) => (
                  <option value={status} key={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field-wide">
              Notas
              <textarea rows="7" value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} />
            </label>
          </div>

          {form.id ? (
            <>
              {!showPropertyAssignmentForm ? (
                <button
                  type="button"
                  className="wa-btn"
                  style={{ marginBottom: "1rem" }}
                  onClick={() => setShowPropertyAssignmentForm(true)}
                >
                  Agregar propiedad
                </button>
              ) : (
                <>
                  <ClientPropertyAssignmentsPanel
                    assignments={form.propertyAssignments || []}
                    properties={properties}
                    form={propertyAssignmentForm}
                    isSaving={isSavingPropertyAssignment}
                    isLoadingProperties={isLoadingProperties}
                    onAssign={(event) => handleClientPropertyAssign(event, form.id)}
                    onDelete={handleClientPropertyAssignmentDelete}
                    onFormChange={updatePropertyAssignmentField}
                  />
                  <button
                    type="button"
                    className="map-btn"
                    style={{ marginTop: "1rem" }}
                    onClick={() => setShowPropertyAssignmentForm(false)}
                  >
                    Cancelar
                  </button>
                </>
              )}
            </>
          ) : null}

          <div className="admin-editor-actions">
            <button type="submit" className="wa-btn" disabled={!internalProfile || isSaving}>
              {isSaving ? "Guardando..." : "Guardar cliente"}
            </button>
            <button type="button" className="map-btn" onClick={startNewClient}>
              Limpiar
            </button>
          </div>

          {form.id ? (
            <>
              <NotesPanel
                entityId={form.id}
                author={activityAuthor}
                fetchNotes={fetchClientNotes}
                createNote={createClientNote}
              />
              <DocumentsPanel
                entityType="client"
                entityId={form.id}
                accessToken={session?.access_token || ""}
                author={activityAuthor}
                fetchDocuments={fetchClientDocuments}
                createDocument={createClientDocument}
              />
            </>
          ) : null}
        </form>
        )}
      </section>
      )}
    </main>
  );
}

export default SellerApp;
