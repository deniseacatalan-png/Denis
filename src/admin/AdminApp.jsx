import { upload } from "@vercel/blob/client";
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { CATEGORY_META, slugify } from "../utils/properties";
import {
  deleteAdminProperty,
  fetchAdminProperties,
  getCurrentSession,
  onAuthStateChange,
  saveAdminProperty,
  signInAdmin,
  signOutAdmin,
  updateAdminPropertyOrder
} from "../utils/supabase/properties";
import {
  CLIENT_OPERATIONS,
  CLIENT_STATUSES,
  fetchClients,
  saveClient
} from "../utils/supabase/clients";
import {
  createSellerFromAdmin,
  fetchSellerProfiles,
  setSellerActiveFromAdmin
} from "../utils/supabase/sellers";

const emptyPropertyForm = {
  databaseId: "",
  title: "",
  slug: "",
  location: "San Martin de los Andes, Neuquen",
  price: "Consultar",
  area: "Superficie a confirmar",
  category: "venta",
  latitude: "-40.1573",
  longitude: "-71.3524",
  markerColor: "#a65774",
  summary: "",
  descriptionHtml: "",
  rawDescription: "",
  isPublished: true,
  displayOrder: 0,
  images: []
};

const emptySellerForm = {
  username: "",
  fullName: "",
  password: "",
  isActive: true
};

const adminNavItems = [
  { label: "Resumen", path: "/admin", match: "dashboard" },
  { label: "Propiedades", path: "/admin/propiedades", match: "properties" },
  { label: "Clientes", path: "/admin/clientes", match: "clients" },
  { label: "Vendedores", path: "/admin/vendedores", match: "sellers" }
];

const operationLabels = {
  comprar: "Comprar",
  alquilar: "Alquilar"
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
  operation: "alquilar",
  zone: "",
  budget: "",
  rooms: "",
  status: "nuevo",
  notes: ""
};

const imageContentTypes = ["image/avif", "image/jpeg", "image/png", "image/webp"];
const imageAccept = imageContentTypes.join(",");
const maxImageSizeInBytes = 25 * 1024 * 1024;
const defaultPropertyCoords = [-40.1573, -71.3524];

const mimeExtensions = {
  "image/avif": ".avif",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};

function colorValue(value, fallback = "#a65774") {
  return /^#[0-9a-f]{6}$/i.test(value || "") ? value : fallback;
}

function reorderProperties(properties, sourceId, targetId) {
  const sourceIndex = properties.findIndex((property) => property.id === sourceId);
  const targetIndex = properties.findIndex((property) => property.id === targetId);

  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return properties;
  }

  const nextProperties = [...properties];
  const [movedProperty] = nextProperties.splice(sourceIndex, 1);
  nextProperties.splice(targetIndex, 0, movedProperty);

  return nextProperties.map((property, index) => ({
    ...property,
    displayOrder: index
  }));
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

function parseAdminRoute(pathname = window.location.pathname) {
  const parts = pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  const section = parts[1] || "";
  const id = parts[2] || "";
  const action = parts[3] || "";

  if (!section) return { section: "dashboard", mode: "dashboard", id: "" };
  if (section === "propiedades") {
    if (id === "nueva") return { section: "properties", mode: "new", id: "" };
    return { section: "properties", mode: action === "editar" ? "edit" : id ? "view" : "list", id };
  }
  if (section === "clientes") {
    if (id === "nuevo") return { section: "clients", mode: "new", id: "" };
    return { section: "clients", mode: action === "editar" ? "edit" : id ? "view" : "list", id };
  }
  if (section === "vendedores") {
    if (id === "nuevo") return { section: "sellers", mode: "new", id: "" };
    return { section: "sellers", mode: action === "editar" ? "edit" : id ? "view" : "list", id };
  }

  return { section: "not-found", mode: "not-found", id: "" };
}

function RichHtmlEditor({ html, onChange }) {
  const editorRef = useRef(null);
  const selectionRef = useRef(null);

  useEffect(() => {
    const editor = editorRef.current;
    const nextHtml = html || "";

    if (editor && editor.innerHTML !== nextHtml) {
      editor.innerHTML = nextHtml;
    }
  }, [html]);

  const saveSelection = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      selectionRef.current = range.cloneRange();
    }
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    if (!selectionRef.current || !selection) return;

    try {
      selection.removeAllRanges();
      selection.addRange(selectionRef.current);
    } catch {
      selectionRef.current = null;
    }
  };

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const nextHtml = editor.innerHTML === "<br>" ? "" : editor.innerHTML;
    const nextPlainText = editor.innerText.replace(/\n{3,}/g, "\n\n").trim();
    onChange(nextHtml, nextPlainText);
  };

  const applyCommand = (command, value = null) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    restoreSelection();
    document.execCommand(command, false, value);
    saveSelection();
    emitChange();
  };

  const keepFocus = (event) => {
    saveSelection();
    event.preventDefault();
  };

  const handlePaste = (event) => {
    const htmlPayload = event.clipboardData.getData("text/html");
    const textPayload = event.clipboardData.getData("text/plain");
    const pastedContent = htmlPayload || textToParagraphHtml(textPayload);

    if (!pastedContent) return;

    event.preventDefault();
    document.execCommand("insertHTML", false, pastedContent);
    window.setTimeout(emitChange, 0);
  };

  const handleLink = () => {
    const url = window.prompt("URL del enlace");
    if (!url) return;
    applyCommand("createLink", url);
  };

  return (
    <div className="admin-rich-editor">
      <div className="admin-rich-toolbar" aria-label="Herramientas de ficha tecnica" onMouseDown={saveSelection}>
        <select
          defaultValue="<p>"
          onChange={(event) => applyCommand("formatBlock", event.target.value)}
          aria-label="Formato"
        >
          <option value="<p>">Parrafo</option>
          <option value="<h3>">Titulo</option>
          <option value="<h4>">Subtitulo</option>
        </select>
        <button type="button" title="Negrita" onMouseDown={keepFocus} onClick={() => applyCommand("bold")}>
          <strong>B</strong>
        </button>
        <button type="button" title="Italica" onMouseDown={keepFocus} onClick={() => applyCommand("italic")}>
          <em>I</em>
        </button>
        <button type="button" title="Subrayado" onMouseDown={keepFocus} onClick={() => applyCommand("underline")}>
          <span className="admin-toolbar-underline">U</span>
        </button>
        <button
          type="button"
          title="Lista"
          onMouseDown={keepFocus}
          onClick={() => applyCommand("insertUnorderedList")}
        >
          Lista
        </button>
        <button
          type="button"
          title="Lista numerada"
          onMouseDown={keepFocus}
          onClick={() => applyCommand("insertOrderedList")}
        >
          1. Lista
        </button>
        <button type="button" title="Enlace" onMouseDown={keepFocus} onClick={handleLink}>
          Enlace
        </button>
        <button type="button" title="Limpiar formato" onMouseDown={keepFocus} onClick={() => applyCommand("removeFormat")}>
          Limpiar
        </button>
      </div>
      <div
        ref={editorRef}
        className="admin-rich-editor-surface rich-text"
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Escribi la ficha tecnica..."
        onInput={() => {
          saveSelection();
          emitChange();
        }}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onBlur={() => {
          saveSelection();
          emitChange();
        }}
        onPaste={handlePaste}
      />
    </div>
  );
}

function parseCoordinate(value, fallback) {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : fallback;
}

function MapCenterSync({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, Math.max(map.getZoom(), 14));
  }, [center, map]);

  return null;
}

function MapClickSync({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    }
  });

  return null;
}

function LocationPicker({ latitude, longitude, location, markerColor, onCoordinatesChange }) {
  const previousLocationRef = useRef(location);
  const [searchQuery, setSearchQuery] = useState(location || "");
  const [searchResults, setSearchResults] = useState([]);
  const [searchMessage, setSearchMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const hasValidLatitude = Number.isFinite(Number(latitude));
  const hasValidLongitude = Number.isFinite(Number(longitude));
  const safeMarkerColor = colorValue(markerColor);
  const position = useMemo(
    () => [
      parseCoordinate(latitude, defaultPropertyCoords[0]),
      parseCoordinate(longitude, defaultPropertyCoords[1])
    ],
    [latitude, longitude]
  );
  const markerIcon = useMemo(
    () =>
      L.divIcon({
        className: "admin-location-marker",
        html: `<span class="admin-location-marker-pin" style="--marker-color: ${safeMarkerColor}"></span>`,
        iconSize: [34, 44],
        iconAnchor: [17, 40],
        popupAnchor: [0, -34]
      }),
    [safeMarkerColor]
  );

  useEffect(() => {
    if (location !== previousLocationRef.current) {
      previousLocationRef.current = location;
      setSearchQuery(location || "");
    }
  }, [location]);

  const updateCoordinates = (nextLatitude, nextLongitude) => {
    onCoordinatesChange(nextLatitude.toFixed(6), nextLongitude.toFixed(6));
  };

  const handleMarkerDrag = (event) => {
    const nextPosition = event.target.getLatLng();
    updateCoordinates(nextPosition.lat, nextPosition.lng);
  };

  const handleSearch = async (event) => {
    event?.preventDefault();
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) return;

    const coordinateMatch = trimmedQuery.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
    if (coordinateMatch) {
      updateCoordinates(Number(coordinateMatch[1]), Number(coordinateMatch[2]));
      setSearchResults([]);
      setSearchMessage("");
      return;
    }

    setIsSearching(true);
    setSearchMessage("");

    try {
      const params = new URLSearchParams({
        format: "json",
        limit: "5",
        countrycodes: "ar",
        addressdetails: "1",
        "accept-language": "es",
        q: trimmedQuery
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error("No se pudo buscar esa ubicacion.");
      }

      const results = await response.json();
      setSearchResults(results);
      setSearchMessage(results.length ? "" : "No encontre resultados para esa busqueda.");
    } catch (searchError) {
      setSearchResults([]);
      setSearchMessage(searchError.message);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result) => {
    const nextLatitude = Number(result.lat);
    const nextLongitude = Number(result.lon);

    if (!Number.isFinite(nextLatitude) || !Number.isFinite(nextLongitude)) return;

    updateCoordinates(nextLatitude, nextLongitude);
    setSearchQuery(result.display_name || "");
    setSearchResults([]);
    setSearchMessage("");
  };

  return (
    <section className="admin-location-picker">
      <div className="admin-location-picker-header">
        <div>
          <h3>Ubicacion en mapa</h3>
          <p>{hasValidLatitude && hasValidLongitude ? "Coordenadas seleccionadas" : "San Martin de los Andes"}</p>
        </div>
        <div className="admin-location-search">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSearch(event);
              }
            }}
            placeholder="Buscar por nombre o direccion"
          />
          <button type="button" className="map-btn" onClick={handleSearch} disabled={isSearching}>
            {isSearching ? "Buscando..." : "Buscar"}
          </button>
        </div>
      </div>

      {searchMessage ? <p className="admin-location-message">{searchMessage}</p> : null}

      {searchResults.length ? (
        <div className="admin-location-results">
          {searchResults.map((result) => (
            <button type="button" key={result.place_id} onClick={() => selectSearchResult(result)}>
              {result.display_name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="admin-location-map-wrap">
        <MapContainer center={position} zoom={14} scrollWheelZoom={true} className="admin-location-map">
          <MapCenterSync center={position} />
          <MapClickSync onSelect={updateCoordinates} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} draggable icon={markerIcon} eventHandlers={{ dragend: handleMarkerDrag }}>
            <Popup>Ubicacion de la propiedad</Popup>
          </Marker>
        </MapContainer>
      </div>

      <div className="admin-location-coordinates">
        <label>
          Latitud
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(event) => onCoordinatesChange(event.target.value, longitude)}
            required
          />
        </label>
        <label>
          Longitud
          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(event) => onCoordinatesChange(latitude, event.target.value)}
            required
          />
        </label>
      </div>
    </section>
  );
}

function imagePathForFile(file, propertySlug, index) {
  const extension = file.name.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase() || mimeExtensions[file.type] || "";
  const baseName = extension ? file.name.slice(0, -extension.length) : file.name;
  const safeBaseName = slugify(baseName, 72) || "imagen";
  return `properties/${propertySlug}/${Date.now()}-${index}-${safeBaseName}${extension}`;
}

function propertyToForm(property) {
  const rawDescription = property.rawDescription || "";

  return {
    databaseId: property.databaseId || property.id || "",
    title: property.title || "",
    slug: property.slug || slugify(property.title),
    location: property.location || "",
    price: property.price || "Consultar",
    area: property.area || "Superficie a confirmar",
    category: property.category || "venta",
    latitude: String(property.latitude ?? property.coords?.[0] ?? ""),
    longitude: String(property.longitude ?? property.coords?.[1] ?? ""),
    markerColor: property.markerColor || CATEGORY_META[property.category]?.mapColor || "#a65774",
    summary: property.summary || "",
    descriptionHtml: property.descriptionHtml || textToParagraphHtml(rawDescription),
    rawDescription,
    isPublished: Boolean(property.isPublished),
    displayOrder: property.displayOrder || 0,
    images: property.images || []
  };
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

    const { error: loginError } = await signInAdmin(username, password);

    if (loginError) {
      setError("Usuario o contraseña incorrectos.");
      setIsSubmitting(false);
      return;
    }

    onLogin();
  };

  return (
    <main className="admin-shell admin-shell--login">
      <section className="admin-login-panel">
        <img src="/isodc.svg" alt="Logo Denise Catalán" />
        <h1>Administrador</h1>
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

function AdminDashboard({ properties, clients, sellers, onCreateProperty, onCreateClient, onCreateSeller }) {
  const publishedCount = properties.filter((property) => property.isPublished).length;
  const activeSellerCount = sellers.filter((seller) => seller.isActive).length;
  const recentClients = clients.slice(0, 4);

  return (
    <section className="admin-crm-dashboard">
      <div className="admin-metric-grid">
        <article className="admin-metric-card">
          <span>Propiedades</span>
          <strong>{properties.length}</strong>
        </article>
        <article className="admin-metric-card">
          <span>Publicadas</span>
          <strong>{publishedCount}</strong>
        </article>
        <article className="admin-metric-card">
          <span>Clientes</span>
          <strong>{clients.length}</strong>
        </article>
        <article className="admin-metric-card">
          <span>Vendedores activos</span>
          <strong>{activeSellerCount}</strong>
        </article>
      </div>

      <div className="admin-crm-grid">
        <section className="admin-panel">
          <h2>Actividad reciente</h2>
          <div className="admin-table-list">
            {recentClients.map((client) => (
              <div className="admin-table-row" key={client.id}>
                <div>
                  <strong>{client.fullName}</strong>
                  <span>{operationLabels[client.operation] || client.operation}</span>
                </div>
                <span className={`seller-status-pill seller-status-pill--${client.status}`}>
                  {statusLabels[client.status] || client.status}
                </span>
              </div>
            ))}
            {!recentClients.length ? <p className="seller-empty-state">No hay clientes cargados.</p> : null}
          </div>
        </section>

        <section className="admin-panel">
          <h2>Accesos rapidos</h2>
          <div className="admin-quick-actions">
            <button type="button" className="wa-btn" onClick={onCreateProperty}>
              Nueva propiedad
            </button>
            <button type="button" className="wa-btn" onClick={onCreateClient}>
              Nuevo cliente
            </button>
            <button type="button" className="wa-btn" onClick={onCreateSeller}>
              Nuevo vendedor
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}

function AdminDashboardAlerts({ messages }) {
  const visibleMessages = messages.filter(Boolean);

  if (!visibleMessages.length) return null;

  return (
    <section className="admin-dashboard-alerts" aria-live="polite">
      {visibleMessages.map((alertMessage, index) => (
        <p className="admin-error" key={`${alertMessage}-${index}`}>
          {alertMessage}
        </p>
      ))}
    </section>
  );
}

function AdminNotFound({ navigateAdmin }) {
  return (
    <section className="admin-panel">
      <h2>Ruta no encontrada</h2>
      <p className="seller-empty-state">No encontramos esa ruta del administrador.</p>
      <button type="button" className="wa-btn" onClick={() => navigateAdmin("/admin")}>
        Volver al resumen
      </button>
    </section>
  );
}

function AdminApp() {
  const [session, setSession] = useState(undefined);
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(emptyPropertyForm);
  const [sellerForm, setSellerForm] = useState(emptySellerForm);
  const [clientFilters, setClientFilters] = useState({ operation: "", status: "", createdBy: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [isSavingSeller, setIsSavingSeller] = useState(false);
  const [draggingPropertyId, setDraggingPropertyId] = useState("");
  const [dropTargetPropertyId, setDropTargetPropertyId] = useState("");
  const [descriptionView, setDescriptionView] = useState("editor");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [clientMessage, setClientMessage] = useState("");
  const [clientError, setClientError] = useState("");
  const [sellerMessage, setSellerMessage] = useState("");
  const [sellerError, setSellerError] = useState("");
  const [route, setRoute] = useState(() => parseAdminRoute());

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === selectedId) || null,
    [properties, selectedId]
  );

  useEffect(() => {
    const handlePopState = () => setRoute(parseAdminRoute());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateAdmin = (path) => {
    window.history.pushState({}, "", path);
    setRoute(parseAdminRoute(path));
  };

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
    if (!selectedProperty) return;
    setForm(propertyToForm(selectedProperty));
  }, [selectedProperty]);

  const loadProperties = async () => {
    if (!session) return;
    setIsLoading(true);
    setError("");

    try {
      const data = await fetchAdminProperties();
      setProperties(data);
      setSelectedId((currentId) => currentId || data[0]?.id || "");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSellers = async () => {
    if (!session) return;
    setSellerError("");

    try {
      const data = await fetchSellerProfiles();
      setSellers(data);
    } catch (loadError) {
      setSellerError(loadError.message);
    }
  };

  const loadClients = async () => {
    if (!session) return;
    setClientError("");

    try {
      const data = await fetchClients(clientFilters);
      setClients(data);
    } catch (loadError) {
      setClientError(loadError.message);
    }
  };

  useEffect(() => {
    loadProperties();
    loadSellers();
  }, [session]);

  useEffect(() => {
    loadClients();
  }, [session, clientFilters.operation, clientFilters.status, clientFilters.createdBy]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const updateSellerField = (field, value) => {
    setSellerForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const updateTitle = (title) => {
    setForm((current) => ({
      ...current,
      title,
      slug: slugify(title)
    }));
  };

  const updateDescription = (descriptionHtml, rawDescription = htmlToPlainText(descriptionHtml)) => {
    setForm((current) => ({
      ...current,
      descriptionHtml,
      rawDescription
    }));
  };

  const startNewProperty = () => {
    setSelectedId("");
    setForm({
      ...emptyPropertyForm,
      displayOrder: properties.length
    });
    setMessage("");
    setError("");
  };

  const handleCreateProperty = () => {
    setClientMessage("");
    startNewProperty();
    navigateAdmin("/admin/propiedades/nueva");
  };

  const handleCreateClient = () => {
    setClientError("");
    setClientMessage(
      "La seccion de clientes todavia esta en conversion. El alta dedicada se abrira en la proxima tarea."
    );
    navigateAdmin("/admin/clientes/nuevo");
  };

  const handleCreateSeller = () => {
    setClientMessage("");
    setSellerMessage("");
    setSellerError("");
    setSellerForm(emptySellerForm);
    navigateAdmin("/admin/vendedores/nuevo");
  };

  const handlePropertyDragStart = (event, propertyId) => {
    setDraggingPropertyId(propertyId);
    setDropTargetPropertyId("");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", propertyId);
  };

  const handlePropertyDragOver = (event, propertyId) => {
    if (!draggingPropertyId || draggingPropertyId === propertyId) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTargetPropertyId(propertyId);
  };

  const handlePropertyDrop = async (event, targetPropertyId) => {
    event.preventDefault();
    const sourcePropertyId = draggingPropertyId || event.dataTransfer.getData("text/plain");

    setDraggingPropertyId("");
    setDropTargetPropertyId("");

    if (!sourcePropertyId || sourcePropertyId === targetPropertyId) return;

    const nextProperties = reorderProperties(properties, sourcePropertyId, targetPropertyId);
    if (nextProperties === properties) return;

    setProperties(nextProperties);
    setForm((current) => {
      const selectedPropertyInOrder = nextProperties.find((property) => property.id === current.databaseId);
      return selectedPropertyInOrder
        ? { ...current, displayOrder: selectedPropertyInOrder.displayOrder }
        : current;
    });
    setIsSavingOrder(true);
    setMessage("");
    setError("");

    try {
      await updateAdminPropertyOrder(nextProperties);
      setMessage("Orden actualizado.");
    } catch (orderError) {
      setError(orderError.message);
      await loadProperties();
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handlePropertyDragEnd = () => {
    setDraggingPropertyId("");
    setDropTargetPropertyId("");
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsLoading(true);

    try {
      const propertyId = await saveAdminProperty(form);
      setMessage("Propiedad guardada.");
      await loadProperties();
      setSelectedId(propertyId);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!form.databaseId) return;
    const confirmed = window.confirm(`Eliminar ${form.title}?`);
    if (!confirmed) return;

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      await deleteAdminProperty(form.databaseId);
      setMessage("Propiedad eliminada.");
      startNewProperty();
      await loadProperties();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) return;

    setMessage("");
    setError("");

    if (!session?.access_token) {
      setError("Tu sesion expiro. Volve a ingresar para subir imagenes.");
      return;
    }

    const invalidFile = files.find((file) => !imageContentTypes.includes(file.type));
    if (invalidFile) {
      setError(`Formato no permitido: ${invalidFile.name}. Usa JPG, PNG, WEBP o AVIF.`);
      return;
    }

    const oversizedFile = files.find((file) => file.size > maxImageSizeInBytes);
    if (oversizedFile) {
      setError(`${oversizedFile.name} supera el limite de 25 MB para subir imagenes.`);
      return;
    }

    const propertySlug = slugify(form.slug || form.title || "propiedad", 80) || "propiedad";
    setIsUploadingImages(true);

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
            propertyId: form.databaseId || null
          })
        });

        uploadedUrls.push(blob.url);
      }

      setForm((current) => ({
        ...current,
        images: [...current.images, ...uploadedUrls]
      }));
      setMessage("Imagenes subidas a Vercel Blob. Guarda la propiedad para asociarlas.");
    } catch (uploadError) {
      setError(
        uploadError.message.includes("Failed to fetch")
          ? "No pude contactar la ruta de subida. En local, usa Vercel Dev o desplega en Vercel para probar Blob."
          : uploadError.message
      );
    } finally {
      setIsUploadingImages(false);
    }
  };

  const removeImage = (imageIndex) => {
    setForm((current) => ({
      ...current,
      images: current.images.filter((_, index) => index !== imageIndex)
    }));
  };

  const handleSellerSave = async (event) => {
    event.preventDefault();

    if (!session?.access_token) {
      setSellerError("Tu sesion expiro. Volve a ingresar para administrar vendedores.");
      return;
    }

    setIsSavingSeller(true);
    setSellerMessage("");
    setSellerError("");

    try {
      await createSellerFromAdmin({
        accessToken: session.access_token,
        seller: sellerForm
      });
      setSellerMessage("Vendedor guardado.");
      setSellerForm(emptySellerForm);
      await loadSellers();
    } catch (saveError) {
      setSellerError(saveError.message);
    } finally {
      setIsSavingSeller(false);
    }
  };

  const handleSellerActiveChange = async (seller, isActive) => {
    if (!session?.access_token) {
      setSellerError("Tu sesion expiro. Volve a ingresar para administrar vendedores.");
      return;
    }

    setIsSavingSeller(true);
    setSellerMessage("");
    setSellerError("");

    try {
      await setSellerActiveFromAdmin({
        accessToken: session.access_token,
        sellerId: seller.id,
        isActive
      });
      setSellerMessage(isActive ? "Vendedor activado." : "Vendedor desactivado.");
      await loadSellers();
    } catch (saveError) {
      setSellerError(saveError.message);
    } finally {
      setIsSavingSeller(false);
    }
  };

  if (session === undefined) {
    return (
      <main className="admin-shell admin-shell--login">
        <section className="admin-login-panel">
          <p>Cargando administrador...</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return <LoginPanel onLogin={loadProperties} />;
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p>Denise Catalán</p>
          <h1>Administrador de propiedades</h1>
        </div>
        <div className="admin-header-actions">
          <a href="/vendedor" className="map-btn">
            Portal vendedor
          </a>
          <a href="/" className="map-btn">
            Ver web
          </a>
          <button type="button" className="map-btn" onClick={signOutAdmin}>
            Cerrar sesión
          </button>
        </div>
      </header>

      {route.section === "not-found" ? (
        <AdminNotFound navigateAdmin={navigateAdmin} />
      ) : route.section === "dashboard" ? (
        <>
          <AdminDashboardAlerts messages={[error, sellerError, clientError]} />
          <AdminDashboard
            properties={properties}
            clients={clients}
            sellers={sellers}
            onCreateProperty={handleCreateProperty}
            onCreateClient={handleCreateClient}
            onCreateSeller={handleCreateSeller}
          />
        </>
      ) : (
        <>
          {route.section === "clients" && clientMessage ? <p className="admin-success">{clientMessage}</p> : null}
          <section className="admin-layout">
            <aside className="admin-sidebar">
              <div className="admin-sidebar-header">
                <h2>Propiedades</h2>
                <button type="button" className="wa-btn" onClick={startNewProperty}>
                  Nueva
                </button>
              </div>
              {isSavingOrder ? <p className="admin-sidebar-note">Guardando orden...</p> : null}
              {isLoading && !properties.length ? <p>Cargando...</p> : null}
              <div className="admin-property-list">
                {properties.map((property) => (
                  <button
                    type="button"
                    key={property.id}
                    draggable
                    className={[
                      "admin-property-row",
                      property.id === selectedId ? "active" : "",
                      property.id === draggingPropertyId ? "is-dragging" : "",
                      property.id === dropTargetPropertyId ? "is-drop-target" : ""
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setSelectedId(property.id)}
                    onDragStart={(event) => handlePropertyDragStart(event, property.id)}
                    onDragOver={(event) => handlePropertyDragOver(event, property.id)}
                    onDrop={(event) => handlePropertyDrop(event, property.id)}
                    onDragLeave={() => {
                      setDropTargetPropertyId((currentId) => (currentId === property.id ? "" : currentId));
                    }}
                    onDragEnd={handlePropertyDragEnd}
                    aria-label={`Ordenar ${property.title}`}
                  >
                    <span className="admin-property-drag-handle" aria-hidden="true">::</span>
                    <span>{property.title}</span>
                    <small>
                      {CATEGORY_META[property.category]?.label || property.category}
                      <span className={`admin-publish-chip ${property.isPublished ? "is-published" : "is-hidden"}`}>
                        {property.isPublished ? "Publicada" : "Oculta"}
                      </span>
                    </small>
                  </button>
                ))}
              </div>
            </aside>

            <form className="admin-editor" onSubmit={handleSave}>
              <div className="admin-editor-title">
                <div>
                  <p>{form.databaseId ? "Editar propiedad" : "Nueva propiedad"}</p>
                  <h2>{form.title || "Sin titulo"}</h2>
                </div>
                <label className="admin-toggle">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(event) => updateField("isPublished", event.target.checked)}
                  />
                  Publicada
                </label>
              </div>

              {message ? <p className="admin-success">{message}</p> : null}
              {error ? <p className="admin-error">{error}</p> : null}

              <div className="admin-grid">
                <label>
                  Titulo
                  <input
                    value={form.title}
                    onChange={(event) => updateTitle(event.target.value)}
                    required
                  />
                </label>
                <label>
                  Categoria
                  <select value={form.category} onChange={(event) => updateField("category", event.target.value)}>
                    {Object.entries(CATEGORY_META).map(([value, meta]) => (
                      <option value={value} key={value}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Valor
                  <input value={form.price} onChange={(event) => updateField("price", event.target.value)} />
                </label>
                <label>
                  Superficie
                  <input value={form.area} onChange={(event) => updateField("area", event.target.value)} />
                </label>
                <label className="admin-field-wide">
                  Ubicación
                  <input value={form.location} onChange={(event) => updateField("location", event.target.value)} />
                </label>
                <LocationPicker
                  latitude={form.latitude}
                  longitude={form.longitude}
                  location={form.location}
                  markerColor={form.markerColor}
                  onCoordinatesChange={(nextLatitude, nextLongitude) => {
                    setForm((current) => ({
                      ...current,
                      latitude: nextLatitude,
                      longitude: nextLongitude
                    }));
                  }}
                />
                <label className="admin-color-field">
                  Color del punto en el mapa
                  <div className="admin-color-picker">
                    <input
                      type="color"
                      value={colorValue(form.markerColor, CATEGORY_META[form.category]?.mapColor || "#a65774")}
                      onChange={(event) => updateField("markerColor", event.target.value)}
                      aria-label="Color del punto en el mapa"
                    />
                    <input
                      type="text"
                      value={form.markerColor}
                      onChange={(event) => updateField("markerColor", event.target.value)}
                      placeholder={CATEGORY_META[form.category]?.mapColor || "#a65774"}
                    />
                  </div>
                </label>
              </div>

              <label>
                Resumen
                <textarea
                  rows="4"
                  value={form.summary}
                  onChange={(event) => updateField("summary", event.target.value)}
                />
              </label>
              <section className="admin-description-widget">
                <div className="admin-widget-header">
                  <h3>Ficha tecnica</h3>
                  <div className="admin-segmented-control" aria-label="Vista de ficha tecnica">
                    <button
                      type="button"
                      className={descriptionView === "editor" ? "active" : ""}
                      onClick={() => setDescriptionView("editor")}
                    >
                      Editor
                    </button>
                    <button
                      type="button"
                      className={descriptionView === "plain" ? "active" : ""}
                      onClick={() => setDescriptionView("plain")}
                    >
                      Texto
                    </button>
                    <button
                      type="button"
                      className={descriptionView === "html" ? "active" : ""}
                      onClick={() => setDescriptionView("html")}
                    >
                      HTML
                    </button>
                    <button
                      type="button"
                      className={descriptionView === "preview" ? "active" : ""}
                      onClick={() => setDescriptionView("preview")}
                    >
                      Vista
                    </button>
                  </div>
                </div>

                {descriptionView === "editor" ? (
                  <RichHtmlEditor html={form.descriptionHtml} onChange={updateDescription} />
                ) : null}

                {descriptionView === "plain" ? (
                  <label>
                    Texto plano
                    <textarea
                      rows="10"
                      value={form.rawDescription}
                      onChange={(event) => updateField("rawDescription", event.target.value)}
                    />
                  </label>
                ) : null}

                {descriptionView === "html" ? (
                  <label>
                    HTML crudo
                    <textarea
                      rows="10"
                      value={form.descriptionHtml}
                      onChange={(event) => updateDescription(event.target.value)}
                    />
                  </label>
                ) : null}

                {descriptionView === "preview" ? (
                  <div
                    className="admin-preview-pane rich-text"
                    dangerouslySetInnerHTML={{
                      __html: form.descriptionHtml || "<p>Sin ficha tecnica cargada.</p>"
                    }}
                  />
                ) : null}
              </section>
              <div className="admin-images-field">
                <div className="admin-images-header">
                  <label className="admin-upload-control">
                    Subir imagenes
                    <input
                      type="file"
                      accept={imageAccept}
                      multiple
                      onChange={handleImageUpload}
                      disabled={isUploadingImages}
                    />
                  </label>
                  <span>{isUploadingImages ? "Subiendo..." : `${form.images.length} imagenes`}</span>
                </div>
                {form.images.length ? (
                  <div className="admin-image-grid">
                    {form.images.map((url, index) => (
                      <div className="admin-image-preview" key={`${url}-${index}`}>
                        <img src={url} alt={`Imagen ${index + 1} de ${form.title || "propiedad"}`} />
                        <button type="button" onClick={() => removeImage(index)}>
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="admin-editor-actions">
                <button type="submit" className="wa-btn" disabled={isLoading}>
                  {isLoading ? "Guardando..." : "Guardar propiedad"}
                </button>
                {form.databaseId ? (
                  <button type="button" className="map-btn admin-danger" onClick={handleDelete} disabled={isLoading}>
                    Eliminar
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="admin-sellers-panel" aria-labelledby="admin-sellers-title">
            <div className="admin-sellers-header">
              <div>
                <p>Acceso interno</p>
                <h2 id="admin-sellers-title">Vendedores</h2>
              </div>
              <button type="button" className="map-btn" onClick={loadSellers} disabled={isSavingSeller}>
                Actualizar
              </button>
            </div>

            {sellerMessage ? <p className="admin-success">{sellerMessage}</p> : null}
            {sellerError ? <p className="admin-error">{sellerError}</p> : null}

            <div className="admin-sellers-layout">
              <form className="admin-seller-form" onSubmit={handleSellerSave}>
                <div className="admin-grid">
                  <label>
                    Usuario
                    <input
                      value={sellerForm.username}
                      onChange={(event) => updateSellerField("username", event.target.value)}
                      autoComplete="off"
                      required
                    />
                  </label>
                  <label>
                    Nombre
                    <input
                      value={sellerForm.fullName}
                      onChange={(event) => updateSellerField("fullName", event.target.value)}
                      autoComplete="off"
                    />
                  </label>
                  <label>
                    Contraseña
                    <input
                      type="password"
                      value={sellerForm.password}
                      onChange={(event) => updateSellerField("password", event.target.value)}
                      minLength={8}
                      required
                    />
                  </label>
                  <label className="admin-toggle admin-seller-toggle">
                    <input
                      type="checkbox"
                      checked={sellerForm.isActive}
                      onChange={(event) => updateSellerField("isActive", event.target.checked)}
                    />
                    Activo
                  </label>
                </div>
                <div className="admin-editor-actions">
                  <button type="submit" className="wa-btn" disabled={isSavingSeller}>
                    {isSavingSeller ? "Guardando..." : "Guardar vendedor"}
                  </button>
                </div>
              </form>

              <div className="admin-seller-list">
                {sellers.map((seller) => (
                  <article className="admin-seller-row" key={seller.id}>
                    <div>
                      <strong>{seller.fullName || seller.username}</strong>
                      <span>{seller.username}</span>
                      <small>{seller.email}</small>
                    </div>
                    <button
                      type="button"
                      className={`map-btn ${seller.isActive ? "admin-danger" : ""}`}
                      onClick={() => handleSellerActiveChange(seller, !seller.isActive)}
                      disabled={isSavingSeller}
                    >
                      {seller.isActive ? "Desactivar" : "Activar"}
                    </button>
                  </article>
                ))}
                {!sellers.length ? <p className="seller-empty-state">No hay vendedores cargados.</p> : null}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

export default AdminApp;
