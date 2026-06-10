"use client";

import { upload } from "@vercel/blob/client";
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { DocumentsPanel, NotesPanel } from "../components/ActivityPanels";
import AppNavbar from "../components/AppNavbar";
import { adminNavbarItems } from "../components/AppNavbarConfig";
import ClientOperationCards from "../components/ClientOperationCards";
import ClientPropertyAssignmentsPanel, {
  emptyClientPropertyAssignmentForm
} from "../components/ClientPropertyAssignmentsPanel";
import {
  CATEGORY_META,
  filterAdminPropertiesByType,
  filterPropertiesBySearch,
  getAdminPropertyTypeTabs,
  slugify
} from "../utils/properties";
import {
  activityAuthorFromProfile,
  createClientDocument,
  createClientNote,
  createPropertyDocument,
  createPropertyNote,
  fetchClientDocuments,
  fetchClientNotes,
  fetchPropertyDocuments,
  fetchPropertyNotes
} from "../utils/supabase/activity";
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
  createSellerFromAdmin,
  fetchInternalProfile,
  fetchSellerProfiles,
  setSellerActiveFromAdmin
} from "../utils/supabase/sellers";
import logoMark from "../../ISO GRAFITO.png";

function assetUrl(asset) {
  return typeof asset === "string" ? asset : asset?.src || "";
}

const logoMarkUrl = assetUrl(logoMark);

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
  markerColor: CATEGORY_META.venta.mapColor,
  summary: "",
  descriptionHtml: "",
  rawDescription: "",
  isPublished: true,
  displayOrder: 0,
  images: []
};

const emptySellerForm = {
  sellerId: "",
  currentEmail: "",
  username: "",
  fullName: "",
  password: "",
  isActive: true
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

function sellerToForm(seller) {
  return {
    sellerId: seller.id || "",
    currentEmail: seller.email || "",
    username: seller.username || "",
    fullName: seller.fullName || "",
    password: "",
    isActive: Boolean(seller.isActive)
  };
}

function countClientsForSeller(clients, sellerId) {
  return clients.filter((client) => client.createdBy === sellerId).length;
}

function formatAdminDate(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

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

function colorValue(value, fallback = CATEGORY_META.venta.mapColor) {
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
  const extra = parts[4] || "";

  if (!section) return { section: "dashboard", mode: "dashboard", id: "" };
  if (section === "propiedades") {
    if (extra) return { section: "not-found", mode: "not-found", id: "" };
    if (id === "nueva") {
      return action
        ? { section: "not-found", mode: "not-found", id: "" }
        : { section: "properties", mode: "new", id: "" };
    }
    if (action && action !== "editar") return { section: "not-found", mode: "not-found", id: "" };
    return { section: "properties", mode: action === "editar" ? "edit" : id ? "view" : "list", id };
  }
  if (section === "clientes") {
    if (extra) return { section: "not-found", mode: "not-found", id: "" };
    if (id === "nuevo") {
      return action
        ? { section: "not-found", mode: "not-found", id: "" }
        : { section: "clients", mode: "new", id: "" };
    }
    if (action && action !== "editar") return { section: "not-found", mode: "not-found", id: "" };
    return { section: "clients", mode: action === "editar" ? "edit" : id ? "view" : "list", id };
  }
  if (section === "busquedas") {
    if (action || extra) return { section: "not-found", mode: "not-found", id: "" };
    return { section: "searchRequests", mode: id ? "view" : "list", id };
  }
  if (section === "vendedores") {
    if (extra) return { section: "not-found", mode: "not-found", id: "" };
    if (id === "nuevo") {
      return action
        ? { section: "not-found", mode: "not-found", id: "" }
        : { section: "sellers", mode: "new", id: "" };
    }
    if (action && action !== "editar") return { section: "not-found", mode: "not-found", id: "" };
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
    markerColor: property.markerColor || CATEGORY_META[property.category]?.mapColor || CATEGORY_META.venta.mapColor,
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
        <img src={logoMarkUrl} alt="Logo Denise Catalán" />
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
  const [internalProfile, setInternalProfile] = useState(null);
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(emptyPropertyForm);
  const [sellerForm, setSellerForm] = useState(emptySellerForm);
  const [clientForm, setClientForm] = useState(emptyClientForm);
  const [clientPropertyAssignmentForm, setClientPropertyAssignmentForm] = useState(emptyClientPropertyAssignmentForm);
  const [clientFilters, setClientFilters] = useState({ operation: "", status: "", createdBy: "" });
  const [propertyTypeTab, setPropertyTypeTab] = useState("venta");
  const [propertySearchQuery, setPropertySearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [isSavingClientPropertyAssignment, setIsSavingClientPropertyAssignment] = useState(false);
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
  const [searchRequests, setSearchRequests] = useState([]);
  const [searchRequestFilters, setSearchRequestFilters] = useState({ status: "", operation: "" });
  const [searchRequestError, setSearchRequestError] = useState("");
  const [searchRequestMessage, setSearchRequestMessage] = useState("");
  const [isSavingSearchRequest, setIsSavingSearchRequest] = useState(false);
  const [hasLoadedProperties, setHasLoadedProperties] = useState(false);
  const [hasLoadedAllClients, setHasLoadedAllClients] = useState(false);
  const [hasLoadedSellers, setHasLoadedSellers] = useState(false);
  const [route, setRoute] = useState(() => parseAdminRoute());
  const syncedPropertyRouteRef = useRef("");
  const syncedClientRouteRef = useRef("");
  const syncedSellerRouteRef = useRef("");

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === selectedId) || null,
    [properties, selectedId]
  );
  const routedProperty = useMemo(() => {
    if (route.section !== "properties" || !route.id) return null;

    return properties.find((property) => property.id === route.id || property.databaseId === route.id) || null;
  }, [properties, route.id, route.section]);
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
  const routedSeller = useMemo(() => {
    if (route.section !== "sellers" || !route.id) return null;

    return sellers.find((seller) => seller.id === route.id) || null;
  }, [route.id, route.section, sellers]);
  const activityAuthor = useMemo(() => {
    if (!session?.user?.id) return null;
    return activityAuthorFromProfile(session.user.id, internalProfile);
  }, [internalProfile, session?.user?.id]);

  useEffect(() => {
    const handlePopState = () => setRoute(parseAdminRoute());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateAdmin = (path) => {
    window.history.pushState({}, "", path);
    setRoute(parseAdminRoute(path));
  };

  const handleAdminNavbarItemSelect = (item) => {
    if (item.action === "signout") {
      signOutAdmin();
      return;
    }

    if (item.path) {
      navigateAdmin(item.path);
    }
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
    let active = true;

    async function loadInternalProfile() {
      if (!session?.user?.id) {
        setInternalProfile(null);
        return;
      }

      try {
        const profile = await fetchInternalProfile(session.user.id);
        if (active) setInternalProfile(profile);
      } catch (profileError) {
        if (active) {
          setInternalProfile(null);
          setError(profileError.message);
        }
      }
    }

    loadInternalProfile();

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (route.section === "properties" || !selectedProperty) return;
    setForm(propertyToForm(selectedProperty));
  }, [route.section, selectedProperty]);

  const loadProperties = async () => {
    if (!session) return;
    setIsLoading(true);
    setError("");

    try {
      const data = await fetchAdminProperties();
      setProperties(data);
      setSelectedId((currentId) => {
        if (route.section === "properties") return currentId;
        return currentId || data[0]?.id || "";
      });
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setHasLoadedProperties(true);
      setIsLoading(false);
    }
  };

  const loadSellers = async () => {
    if (!session) {
      setSellers([]);
      setHasLoadedSellers(false);
      return { ok: true };
    }
    setHasLoadedSellers(false);
    setSellerError("");

    try {
      const data = await fetchSellerProfiles();
      setSellers(data);
      return { ok: true };
    } catch (loadError) {
      setSellerError(loadError.message);
      return { ok: false, message: loadError.message };
    } finally {
      setHasLoadedSellers(true);
    }
  };

  const loadClients = async () => {
    if (!session) {
      setClients([]);
      return { ok: true };
    }
    setClientError("");

    try {
      const data = await fetchClients(clientFilters);
      setClients(data);
      return { ok: true };
    } catch (loadError) {
      setClientError(loadError.message);
      return { ok: false, message: loadError.message };
    }
  };

  const loadAllClients = async () => {
    if (!session) {
      setAllClients([]);
      setHasLoadedAllClients(false);
      return { ok: true };
    }
    setHasLoadedAllClients(false);
    setClientError("");

    try {
      const data = await fetchClients();
      setAllClients(data);
      return { ok: true };
    } catch (loadError) {
      setClientError(loadError.message);
      return { ok: false, message: loadError.message };
    } finally {
      setHasLoadedAllClients(true);
    }
  };

  useEffect(() => {
    loadProperties();
    loadSellers();
    loadAllClients();
  }, [session]);

  useEffect(() => {
    loadClients();
  }, [session, clientFilters.operation, clientFilters.status, clientFilters.createdBy]);

  const loadSearchRequests = async () => {
    if (!session) {
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
  }, [session, searchRequestFilters.status, searchRequestFilters.operation]);

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

  const updateClientField = (field, value) => {
    setClientForm((current) => ({
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

  useEffect(() => {
    if (route.section !== "properties") {
      syncedPropertyRouteRef.current = "";
      return;
    }

    const routeKey = `${route.mode}:${route.id}`;

    if (route.mode === "new") {
      const nextNewForm = {
        ...emptyPropertyForm,
        displayOrder: properties.length
      };

      setSelectedId("");

      if (syncedPropertyRouteRef.current !== routeKey) {
        syncedPropertyRouteRef.current = routeKey;
        setForm(nextNewForm);
        return;
      }

      setForm((current) => {
        if (current.databaseId) return nextNewForm;
        return current.displayOrder === properties.length
          ? current
          : { ...current, displayOrder: properties.length };
      });
      return;
    }

    if (route.mode === "edit" && routedProperty) {
      setSelectedId(routedProperty.id);

      if (syncedPropertyRouteRef.current !== routeKey) {
        setForm(propertyToForm(routedProperty));
        syncedPropertyRouteRef.current = routeKey;
      }
      return;
    }

    if (route.mode === "list" || route.mode === "view") {
      syncedPropertyRouteRef.current = routeKey;
    }
  }, [properties.length, route.id, route.mode, route.section, routedProperty]);

  useEffect(() => {
    if (route.section !== "clients") {
      syncedClientRouteRef.current = "";
      return;
    }

    const routeKey = `${route.mode}:${route.id}`;

    if (route.mode === "new") {
      if (syncedClientRouteRef.current !== routeKey) {
        syncedClientRouteRef.current = routeKey;
        setClientForm(emptyClientForm);
        setClientPropertyAssignmentForm(emptyClientPropertyAssignmentForm);
        setClientMessage("");
        setClientError("");
      }
      return;
    }

    if (route.mode === "edit") {
      const client = allClients.find((item) => item.id === route.id);
      if (client && syncedClientRouteRef.current !== routeKey) {
        syncedClientRouteRef.current = routeKey;
        setClientForm(clientToForm(client));
        setClientPropertyAssignmentForm(emptyClientPropertyAssignmentForm);
        setClientMessage("");
        setClientError("");
      }
      return;
    }

    if (route.mode === "list" || route.mode === "view") {
      syncedClientRouteRef.current = routeKey;
    }
  }, [route.section, route.mode, route.id, allClients]);

  useEffect(() => {
    if (route.section !== "sellers") {
      syncedSellerRouteRef.current = "";
      return;
    }

    const routeKey = `${route.mode}:${route.id}`;

    if (route.mode === "new") {
      if (syncedSellerRouteRef.current !== routeKey) {
        syncedSellerRouteRef.current = routeKey;
        setSellerForm({ ...emptySellerForm });
        setSellerMessage("");
        setSellerError("");
      }
      return;
    }

    if (route.mode === "edit") {
      if (routedSeller && syncedSellerRouteRef.current !== routeKey) {
        syncedSellerRouteRef.current = routeKey;
        setSellerForm(sellerToForm(routedSeller));
        setSellerMessage("");
        setSellerError("");
      }
      return;
    }

    if (route.mode === "list" || route.mode === "view") {
      syncedSellerRouteRef.current = routeKey;
    }
  }, [route.section, route.mode, route.id, routedSeller]);

  const handleCreateProperty = () => {
    setClientMessage("");
    startNewProperty();
    navigateAdmin("/admin/propiedades/nueva");
  };

  const handleCreateClient = () => {
    setClientForm(emptyClientForm);
    setClientPropertyAssignmentForm(emptyClientPropertyAssignmentForm);
    setClientError("");
    setClientMessage("");
    navigateAdmin("/admin/clientes/nuevo");
  };

  const handleCreateSeller = () => {
    setClientMessage("");
    setSellerMessage("");
    setSellerError("");
    setSellerForm({ ...emptySellerForm });
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
      navigateAdmin(`/admin/propiedades/${propertyId}`);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientSave = async (event) => {
    event.preventDefault();

    if (!session?.user?.id) {
      setClientError("Tu sesion expiro. Volve a ingresar para administrar clientes.");
      return;
    }

    if (route.section === "clients" && route.mode === "edit" && clientForm.id !== route.id) {
      setClientError("El editor todavia se esta preparando. Espera unos segundos e intenta nuevamente.");
      return;
    }

    if (route.section === "clients" && route.mode === "new" && clientForm.id) {
      setClientError("El editor todavia se esta preparando. Espera unos segundos e intenta nuevamente.");
      return;
    }

    setIsSavingClient(true);
    setClientMessage("");
    setClientError("");

    try {
      const savedClient = await saveClient(clientForm, session.user.id);
      setAllClients((currentClients) => {
        const existingIndex = currentClients.findIndex((client) => client.id === savedClient.id);
        if (existingIndex < 0) return [savedClient, ...currentClients];

        const nextClients = [...currentClients];
        nextClients[existingIndex] = savedClient;
        return nextClients;
      });
      setClientMessage("Cliente guardado.");
      navigateAdmin(`/admin/clientes/${savedClient.id}`);
      const refreshResults = await Promise.all([loadAllClients(), loadClients()]);
      const refreshError = refreshResults.find((result) => result && !result.ok);

      if (refreshError) {
        setClientError(`Cliente guardado, pero no pude actualizar la lista: ${refreshError.message}`);
      }
    } catch (saveError) {
      setClientError(saveError.message);
    } finally {
      setIsSavingClient(false);
    }
  };

  const updateClientPropertyAssignmentField = (field, value) => {
    setClientPropertyAssignmentForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const refreshClientsAfterPropertyAssignment = async () => {
    const refreshResults = await Promise.all([loadAllClients(), loadClients()]);
    return refreshResults.find((result) => result && !result.ok);
  };

  const handleClientPropertyAssign = async (event, clientId) => {
    event.preventDefault();

    if (!clientId) {
      setClientError("Guarda el cliente antes de asignarle una propiedad.");
      return;
    }

    setIsSavingClientPropertyAssignment(true);
    setClientMessage("");
    setClientError("");

    try {
      const savedAssignment = await saveClientPropertyAssignment({
        ...clientPropertyAssignmentForm,
        clientId
      });
      setClientForm((current) =>
        current.id === clientId
          ? {
              ...current,
              propertyAssignments: [savedAssignment, ...(current.propertyAssignments || [])]
            }
          : current
      );
      setClientPropertyAssignmentForm(emptyClientPropertyAssignmentForm);
      setClientMessage("Propiedad asignada al cliente.");
      const refreshError = await refreshClientsAfterPropertyAssignment();

      if (refreshError) {
        setClientError(`Propiedad asignada, pero no pude actualizar la lista: ${refreshError.message}`);
      }
    } catch (assignmentError) {
      setClientError(assignmentError.message);
    } finally {
      setIsSavingClientPropertyAssignment(false);
    }
  };

  const handleClientPropertyAssignmentDelete = async (assignmentId) => {
    if (!assignmentId) return;

    setIsSavingClientPropertyAssignment(true);
    setClientMessage("");
    setClientError("");

    try {
      await deleteClientPropertyAssignment(assignmentId);
      setClientForm((current) => ({
        ...current,
        propertyAssignments: (current.propertyAssignments || []).filter((assignment) => assignment.id !== assignmentId)
      }));
      setClientMessage("Propiedad quitada del cliente.");
      const refreshError = await refreshClientsAfterPropertyAssignment();

      if (refreshError) {
        setClientError(`Propiedad quitada, pero no pude actualizar la lista: ${refreshError.message}`);
      }
    } catch (assignmentError) {
      setClientError(assignmentError.message);
    } finally {
      setIsSavingClientPropertyAssignment(false);
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
      setSelectedId("");
      setForm({
        ...emptyPropertyForm,
        displayOrder: Math.max(properties.length - 1, 0)
      });
      await loadProperties();
      setMessage("Propiedad eliminada.");
      navigateAdmin("/admin/propiedades");
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

    if (route.section === "sellers" && route.mode === "new" && !sellerForm.password.trim()) {
      setSellerError("La contraseña es obligatoria para crear un vendedor.");
      return;
    }

    const isSellerEdit = route.section === "sellers" && route.mode === "edit";
    if (isSellerEdit && !routedSeller) {
      setSellerError("El editor todavia se esta preparando. Espera unos segundos e intenta nuevamente.");
      return;
    }

    const sellerPayload = isSellerEdit
      ? {
          ...sellerForm,
          sellerId: routedSeller.id,
          currentEmail: routedSeller.email
        }
      : {
          username: sellerForm.username,
          fullName: sellerForm.fullName,
          password: sellerForm.password,
          isActive: sellerForm.isActive
        };

    setIsSavingSeller(true);
    setSellerMessage("");
    setSellerError("");

    try {
      const savedSeller = await createSellerFromAdmin({
        accessToken: session.access_token,
        seller: sellerPayload
      });
      setSellers((currentSellers) => {
        const existingIndex = currentSellers.findIndex((seller) => seller.id === savedSeller.id);
        if (existingIndex < 0) return [savedSeller, ...currentSellers];

        const nextSellers = [...currentSellers];
        nextSellers[existingIndex] = savedSeller;
        return nextSellers;
      });
      setSellerMessage("Vendedor guardado.");
      setSellerForm({ ...emptySellerForm });
      const refreshResult = await loadSellers();
      if (refreshResult && !refreshResult.ok) {
        setSellerError(`Vendedor guardado, pero no pude actualizar la lista: ${refreshResult.message}`);
      }
      navigateAdmin(`/admin/vendedores/${savedSeller.id}`);
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
      const savedSeller = await setSellerActiveFromAdmin({
        accessToken: session.access_token,
        sellerId: seller.id,
        isActive
      });
      setSellers((currentSellers) =>
        currentSellers.map((currentSeller) => (currentSeller.id === savedSeller.id ? savedSeller : currentSeller))
      );
      setSellerMessage(isActive ? "Vendedor activado." : "Vendedor desactivado.");
      const refreshResult = await loadSellers();
      if (refreshResult && !refreshResult.ok) {
        setSellerError(`Vendedor actualizado, pero no pude actualizar la lista: ${refreshResult.message}`);
      }
    } catch (saveError) {
      setSellerError(saveError.message);
    } finally {
      setIsSavingSeller(false);
    }
  };

  const getPropertyCategoryLabel = (property) =>
    CATEGORY_META[property.category]?.label || property.category || "Sin categoria";

  const getInternalUserLabel = (userId) => {
    if (!userId) return "Sin asignar";

    const seller = sellers.find((item) => item.id === userId);
    if (seller) return seller.fullName || seller.username;

    if (userId === session?.user?.id) return "Administrador";

    return "Usuario interno";
  };

  const selectPropertyForView = (property) => {
    setSelectedId(property.id);
    navigateAdmin(`/admin/propiedades/${property.id}`);
  };

  const selectPropertyForEdit = (property) => {
    setSelectedId(property.id);
    setForm(propertyToForm(property));
    navigateAdmin(`/admin/propiedades/${property.id}/editar`);
  };

  const renderNotFound = (title, backPath) => (
    <section className="admin-panel">
      <h2>{title}</h2>
      <p className="seller-empty-state">No encontramos esa propiedad en el inventario.</p>
      <button type="button" className="wa-btn" onClick={() => navigateAdmin(backPath)}>
        Volver a propiedades
      </button>
    </section>
  );

  const renderPropertyLoading = (title = "Cargando propiedad...") => (
    <section className="admin-panel">
      <h2>{title}</h2>
      {error ? <p className="admin-error">{error}</p> : <p className="seller-empty-state">Cargando...</p>}
    </section>
  );

  const renderPropertiesList = () => {
    const hasPropertySearch = propertySearchQuery.trim().length > 0;
    const activePropertyTypeLabel =
      propertyTypeTabs.find((tab) => tab.id === propertyTypeTab)?.label || "propiedades";

    return (
      <section className="admin-sellers-panel" aria-labelledby="admin-properties-title">
        <div className="admin-sellers-header">
          <div>
            <p>Inventario</p>
            <h2 id="admin-properties-title">Propiedades</h2>
          </div>
          <button type="button" className="wa-btn" onClick={handleCreateProperty}>
            Nueva
          </button>
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

        {message ? <p className="admin-success">{message}</p> : null}
        {error ? <p className="admin-error">{error}</p> : null}
        {isSavingOrder ? <p className="admin-sidebar-note">Guardando orden...</p> : null}
        {isLoading && !hasLoadedProperties ? <p>Cargando...</p> : null}

        <div className="admin-property-list">
          {filteredProperties.map((property) => (
            <article
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
              onDragStart={(event) => handlePropertyDragStart(event, property.id)}
              onDragOver={(event) => handlePropertyDragOver(event, property.id)}
              onDrop={(event) => handlePropertyDrop(event, property.id)}
              onDragLeave={() => {
                setDropTargetPropertyId((currentId) => (currentId === property.id ? "" : currentId));
              }}
              onDragEnd={handlePropertyDragEnd}
              aria-label={`Ordenar ${property.title || "propiedad"}`}
            >
              <span className="admin-property-drag-handle" aria-hidden="true">::</span>
              <span>{property.title || "Sin titulo"}</span>
              <small>
                <span>{getPropertyCategoryLabel(property)}</span>
                <span>{property.location || "Sin ubicacion"}</span>
                <span className={`admin-publish-chip ${property.isPublished ? "is-published" : "is-hidden"}`}>
                  {property.isPublished ? "Publicada" : "Oculta"}
                </span>
                <button
                  type="button"
                  className="map-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    selectPropertyForView(property);
                  }}
                >
                  Ver
                </button>
                <button
                  type="button"
                  className="map-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    selectPropertyForEdit(property);
                  }}
                >
                  Editar
                </button>
              </small>
            </article>
          ))}
          {!properties.length && hasLoadedProperties ? (
            <p className="seller-empty-state">No hay propiedades cargadas.</p>
          ) : null}
          {properties.length && !activePropertyTypeProperties.length && hasLoadedProperties ? (
            <p className="seller-empty-state">No hay propiedades en {activePropertyTypeLabel}.</p>
          ) : null}
          {activePropertyTypeProperties.length && !filteredProperties.length && hasLoadedProperties ? (
            <p className="seller-empty-state">No encontramos propiedades para esa busqueda.</p>
          ) : null}
        </div>
      </section>
    );
  };

  const renderPropertyView = (property) => (
    <section className="admin-editor" aria-labelledby="admin-property-view-title">
      <div className="admin-editor-title">
        <div>
          <p>{getPropertyCategoryLabel(property)}</p>
          <h2 id="admin-property-view-title">{property.title || "Sin titulo"}</h2>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="map-btn" onClick={() => navigateAdmin("/admin/propiedades")}>
            Volver
          </button>
          <button type="button" className="wa-btn" onClick={() => selectPropertyForEdit(property)}>
            Editar
          </button>
        </div>
      </div>

      {message ? <p className="admin-success">{message}</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      <div className="admin-grid">
        <label>
          Valor
          <input readOnly value={property.price || "Consultar"} />
        </label>
        <label>
          Superficie
          <input readOnly value={property.area || "Superficie a confirmar"} />
        </label>
        <label>
          Ubicacion
          <input readOnly value={property.location || "Sin ubicacion cargada."} />
        </label>
        <label>
          Estado
          <input readOnly value={property.isPublished ? "Publicada" : "Oculta"} />
        </label>
      </div>

      <section className="admin-description-widget">
        <div className="admin-widget-header">
          <h3>Resumen</h3>
        </div>
        <p className="seller-empty-state">{property.summary || "Sin resumen cargado."}</p>
      </section>

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

      <NotesPanel
        entityId={property.databaseId || property.id}
        author={activityAuthor}
        fetchNotes={fetchPropertyNotes}
        createNote={createPropertyNote}
      />
      <DocumentsPanel
        entityType="property"
        entityId={property.databaseId || property.id}
        accessToken={session?.access_token || ""}
        author={activityAuthor}
        fetchDocuments={fetchPropertyDocuments}
        createDocument={createPropertyDocument}
      />
    </section>
  );

  const renderPropertyEditor = ({ showBackButton = true } = {}) => (
    <form className="admin-editor" onSubmit={handleSave}>
      <div className="admin-editor-title">
        <div>
          <p>{form.databaseId ? "Editar propiedad" : "Nueva propiedad"}</p>
          <h2>{form.title || "Sin titulo"}</h2>
        </div>
        <div className="admin-header-actions">
          {showBackButton ? (
            <button type="button" className="map-btn" onClick={() => navigateAdmin("/admin/propiedades")}>
              Volver
            </button>
          ) : null}
          <label className="admin-toggle">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(event) => updateField("isPublished", event.target.checked)}
            />
            Publicada
          </label>
        </div>
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
              value={colorValue(form.markerColor, CATEGORY_META[form.category]?.mapColor || CATEGORY_META.venta.mapColor)}
              onChange={(event) => updateField("markerColor", event.target.value)}
              aria-label="Color del punto en el mapa"
            />
            <input
              type="text"
              value={form.markerColor}
              onChange={(event) => updateField("markerColor", event.target.value)}
              placeholder={CATEGORY_META[form.category]?.mapColor || CATEGORY_META.venta.mapColor}
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
  );

  const renderClientsList = () => (
    <section className="admin-sellers-panel" aria-labelledby="admin-clients-title">
      <div className="admin-sellers-header">
        <div>
          <p>CRM</p>
          <h2 id="admin-clients-title">Clientes</h2>
        </div>
        <button type="button" className="wa-btn" onClick={handleCreateClient}>
          Nuevo
        </button>
      </div>

      {clientMessage ? <p className="admin-success">{clientMessage}</p> : null}
      {clientError ? <p className="admin-error">{clientError}</p> : null}

      <div className="admin-grid">
        <label>
          Vendedor
          <select
            value={clientFilters.createdBy}
            onChange={(event) =>
              setClientFilters((current) => ({
                ...current,
                createdBy: event.target.value
              }))
            }
          >
            <option value="">Todos</option>
            {sellers.map((seller) => (
              <option value={seller.id} key={seller.id}>
                {seller.fullName || seller.username}
              </option>
            ))}
          </select>
        </label>
        <label>
          Operacion
          <select
            value={clientFilters.operation}
            onChange={(event) =>
              setClientFilters((current) => ({
                ...current,
                operation: event.target.value
              }))
            }
          >
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
          <select
            value={clientFilters.status}
            onChange={(event) =>
              setClientFilters((current) => ({
                ...current,
                status: event.target.value
              }))
            }
          >
            <option value="">Todos</option>
            {CLIENT_STATUSES.map((status) => (
              <option value={status} key={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="admin-table-list">
        {clients.map((client) => (
          <div className="admin-table-row" key={client.id}>
            <div>
              <strong>{client.fullName || "Sin nombre"}</strong>
              <span>{operationLabels[client.operation] || client.operation || "Sin operacion"}</span>
              <small>
                {client.zone || "Sin zona"} - {formatAdminDate(client.updatedAt || client.createdAt)}
              </small>
              <small>Creado por: {getInternalUserLabel(client.createdBy)}</small>
            </div>
            <span className={`seller-status-pill seller-status-pill--${client.status}`}>
              {statusLabels[client.status] || client.status}
            </span>
            <div className="admin-header-actions">
              <button type="button" className="map-btn" onClick={() => navigateAdmin(`/admin/clientes/${client.id}`)}>
                Ver
              </button>
              <button
                type="button"
                className="map-btn"
                onClick={() => navigateAdmin(`/admin/clientes/${client.id}/editar`)}
              >
                Editar
              </button>
            </div>
          </div>
        ))}
        {!clients.length ? <p className="seller-empty-state">No hay clientes para estos filtros.</p> : null}
      </div>
    </section>
  );

  const renderClientView = (client) => (
    <section className="admin-editor" aria-labelledby="admin-client-view-title">
      <div className="admin-editor-title">
        <div>
          <p>{operationLabels[client.operation] || client.operation || "Cliente"}</p>
          <h2 id="admin-client-view-title">{client.fullName || "Sin nombre"}</h2>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="map-btn" onClick={() => navigateAdmin("/admin/clientes")}>
            Volver
          </button>
          <button type="button" className="wa-btn" onClick={() => navigateAdmin(`/admin/clientes/${client.id}/editar`)}>
            Editar
          </button>
        </div>
      </div>

      {clientMessage ? <p className="admin-success">{clientMessage}</p> : null}
      {clientError ? <p className="admin-error">{clientError}</p> : null}

      <div className="admin-grid">
        <label>
          Nombre
          <input readOnly value={client.fullName || "Sin nombre"} />
        </label>
        <label>
          Telefono
          <input readOnly value={client.phone || "Sin telefono"} />
        </label>
        <label>
          Email
          <input readOnly value={client.email || "Sin email"} />
        </label>
        <label>
          Tipo de cliente
          <input readOnly value={operationLabels[client.operation] || client.operation || "Sin operacion"} />
        </label>
        <label>
          Zona
          <input readOnly value={client.zone || "Sin zona"} />
        </label>
        <label>
          Presupuesto
          <input readOnly value={client.budget || "Sin presupuesto"} />
        </label>
        <label>
          Ambientes
          <input readOnly value={client.rooms || "Sin ambientes"} />
        </label>
        <label>
          Estado
          <input readOnly value={statusLabels[client.status] || client.status || "Sin estado"} />
        </label>
        <label>
          Creado
          <input readOnly value={formatAdminDate(client.createdAt)} />
        </label>
        <label>
          Actualizado
          <input readOnly value={formatAdminDate(client.updatedAt)} />
        </label>
        <label>
          Creado por
          <input readOnly value={getInternalUserLabel(client.createdBy)} />
        </label>
        <label>
          Actualizado por
          <input readOnly value={getInternalUserLabel(client.updatedBy)} />
        </label>
        <label className="admin-field-wide">
          Notas generales
          <textarea readOnly rows="7" value={client.notes || "Sin notas"} />
        </label>
      </div>

      <ClientPropertyAssignmentsPanel
        assignments={client.propertyAssignments || []}
        properties={properties}
        form={clientPropertyAssignmentForm}
        isSaving={isSavingClientPropertyAssignment}
        isLoadingProperties={isLoading && !hasLoadedProperties}
        onAssign={(event) => handleClientPropertyAssign(event, client.id)}
        onDelete={handleClientPropertyAssignmentDelete}
        onFormChange={updateClientPropertyAssignmentField}
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

  const renderClientEditor = () => (
    <form className="admin-editor" onSubmit={handleClientSave}>
      <div className="admin-editor-title">
        <div>
          <p>{clientForm.id ? "Editar cliente" : "Nuevo cliente"}</p>
          <h2>{clientForm.fullName || "Sin nombre"}</h2>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="map-btn" onClick={() => navigateAdmin("/admin/clientes")}>
            Volver
          </button>
        </div>
      </div>

      {clientMessage ? <p className="admin-success">{clientMessage}</p> : null}
      {clientError ? <p className="admin-error">{clientError}</p> : null}

      <div className="admin-grid">
        <label>
          Nombre
          <input
            value={clientForm.fullName}
            onChange={(event) => updateClientField("fullName", event.target.value)}
            required
          />
        </label>
        <label>
          Telefono
          <input value={clientForm.phone} onChange={(event) => updateClientField("phone", event.target.value)} />
        </label>
        <label>
          Email
          <input
            type="email"
            value={clientForm.email}
            onChange={(event) => updateClientField("email", event.target.value)}
          />
        </label>
        <ClientOperationCards
          value={clientForm.operation}
          onChange={(operation) => updateClientField("operation", operation)}
        />
        <label>
          Zona
          <input value={clientForm.zone} onChange={(event) => updateClientField("zone", event.target.value)} />
        </label>
        <label>
          Presupuesto
          <input value={clientForm.budget} onChange={(event) => updateClientField("budget", event.target.value)} />
        </label>
        <label>
          Ambientes
          <input value={clientForm.rooms} onChange={(event) => updateClientField("rooms", event.target.value)} />
        </label>
        <label>
          Estado
          <select value={clientForm.status} onChange={(event) => updateClientField("status", event.target.value)}>
            {CLIENT_STATUSES.map((status) => (
              <option value={status} key={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-field-wide">
          Notas
          <textarea rows="7" value={clientForm.notes} onChange={(event) => updateClientField("notes", event.target.value)} />
        </label>
      </div>

      {clientForm.id ? (
        <ClientPropertyAssignmentsPanel
          assignments={clientForm.propertyAssignments || []}
          properties={properties}
          form={clientPropertyAssignmentForm}
          isSaving={isSavingClientPropertyAssignment}
          isLoadingProperties={isLoading && !hasLoadedProperties}
          onAssign={(event) => handleClientPropertyAssign(event, clientForm.id)}
          onDelete={handleClientPropertyAssignmentDelete}
          onFormChange={updateClientPropertyAssignmentField}
        />
      ) : null}

      <div className="admin-editor-actions">
        <button type="submit" className="wa-btn" disabled={isSavingClient}>
          {isSavingClient ? "Guardando..." : "Guardar cliente"}
        </button>
        <button type="button" className="map-btn" onClick={() => navigateAdmin("/admin/clientes")}>
          Volver
        </button>
      </div>
    </form>
  );

  const renderSellersList = () => (
    <section className="admin-sellers-panel" aria-labelledby="admin-sellers-title">
      <div className="admin-sellers-header">
        <div>
          <p>Acceso interno</p>
          <h2 id="admin-sellers-title">Vendedores</h2>
        </div>
        <button type="button" className="wa-btn" onClick={handleCreateSeller}>
          Nuevo
        </button>
      </div>

      {sellerMessage ? <p className="admin-success">{sellerMessage}</p> : null}
      {sellerError ? <p className="admin-error">{sellerError}</p> : null}
      {isSavingSeller ? <p className="admin-sidebar-note">Guardando vendedor...</p> : null}

      <div className="admin-table-list">
        {sellers.map((seller) => (
          <div className="admin-table-row" key={seller.id}>
            <div>
              <strong>{seller.fullName || seller.username || "Sin nombre"}</strong>
              <span>{seller.username || "Sin usuario"}</span>
              <small>{seller.email || "Sin email"}</small>
            </div>
            <span className={`admin-publish-chip ${seller.isActive ? "is-published" : "is-hidden"}`}>
              {seller.isActive ? "Activo" : "Inactivo"}
            </span>
            <div className="admin-header-actions">
              <button
                type="button"
                className="map-btn"
                onClick={() => navigateAdmin(`/admin/vendedores/${seller.id}`)}
              >
                Ver
              </button>
              <button
                type="button"
                className="map-btn"
                onClick={() => {
                  setSellerForm(sellerToForm(seller));
                  navigateAdmin(`/admin/vendedores/${seller.id}/editar`);
                }}
              >
                Editar
              </button>
              <button
                type="button"
                className={`map-btn ${seller.isActive ? "admin-danger" : ""}`}
                onClick={() => handleSellerActiveChange(seller, !seller.isActive)}
                disabled={isSavingSeller}
              >
                {seller.isActive ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        ))}
        {!hasLoadedSellers && !sellerError ? <p className="seller-empty-state">Cargando...</p> : null}
        {!sellers.length && hasLoadedSellers && !sellerError ? (
          <p className="seller-empty-state">No hay vendedores cargados.</p>
        ) : null}
      </div>
    </section>
  );

  const renderSellerView = (seller) => {
    const sellerClientCount = countClientsForSeller(allClients, seller.id);

    return (
      <section className="admin-editor" aria-labelledby="admin-seller-view-title">
        <div className="admin-editor-title">
          <div>
            <p>{seller.isActive ? "Activo" : "Inactivo"}</p>
            <h2 id="admin-seller-view-title">{seller.fullName || seller.username || "Sin nombre"}</h2>
          </div>
          <div className="admin-header-actions">
            <button type="button" className="map-btn" onClick={() => navigateAdmin("/admin/vendedores")}>
              Volver
            </button>
            <button
              type="button"
              className="wa-btn"
              onClick={() => {
                setSellerForm(sellerToForm(seller));
                navigateAdmin(`/admin/vendedores/${seller.id}/editar`);
              }}
            >
              Editar
            </button>
            <button
              type="button"
              className={`map-btn ${seller.isActive ? "admin-danger" : ""}`}
              onClick={() => handleSellerActiveChange(seller, !seller.isActive)}
              disabled={isSavingSeller}
            >
              {seller.isActive ? "Desactivar" : "Activar"}
            </button>
          </div>
        </div>

        {sellerMessage ? <p className="admin-success">{sellerMessage}</p> : null}
        {sellerError ? <p className="admin-error">{sellerError}</p> : null}

        <div className="admin-grid">
          <label>
            Usuario
            <input readOnly value={seller.username || "Sin usuario"} />
          </label>
          <label>
            Nombre
            <input readOnly value={seller.fullName || "Sin nombre"} />
          </label>
          <label>
            Email
            <input readOnly value={seller.email || "Sin email"} />
          </label>
          <label>
            Estado
            <input readOnly value={seller.isActive ? "Activo" : "Inactivo"} />
          </label>
          <label>
            Clientes creados
            <input readOnly value={String(sellerClientCount)} />
          </label>
          <label>
            Creado
            <input readOnly value={formatAdminDate(seller.createdAt)} />
          </label>
          <label>
            Actualizado
            <input readOnly value={formatAdminDate(seller.updatedAt)} />
          </label>
        </div>
      </section>
    );
  };

  const renderSellerEditor = ({ isEdit = false } = {}) => (
    <form className="admin-editor" onSubmit={handleSellerSave}>
      <div className="admin-editor-title">
        <div>
          <p>{isEdit ? "Editar vendedor" : "Nuevo vendedor"}</p>
          <h2>{sellerForm.fullName || sellerForm.username || "Sin nombre"}</h2>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="map-btn" onClick={() => navigateAdmin("/admin/vendedores")}>
            Volver
          </button>
        </div>
      </div>

      {sellerMessage ? <p className="admin-success">{sellerMessage}</p> : null}
      {sellerError ? <p className="admin-error">{sellerError}</p> : null}

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
            autoComplete="new-password"
            minLength={8}
            placeholder={isEdit ? "Opcional al editar" : ""}
            required={!isEdit}
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
        <button type="button" className="map-btn" onClick={() => navigateAdmin("/admin/vendedores")}>
          Volver
        </button>
      </div>
    </form>
  );

  const renderSellerNotFound = () => (
    <section className="admin-panel">
      <h2>Vendedor no encontrado</h2>
      <p className="seller-empty-state">No encontramos ese vendedor.</p>
      <button type="button" className="wa-btn" onClick={() => navigateAdmin("/admin/vendedores")}>
        Volver a vendedores
      </button>
    </section>
  );

  const renderSellerLoading = (title = "Cargando vendedor...") => (
    <section className="admin-panel">
      <h2>{sellerError && title === "Cargando vendedor..." ? "No pude cargar el vendedor" : title}</h2>
      {sellerError ? <p className="admin-error">{sellerError}</p> : <p className="seller-empty-state">Cargando...</p>}
    </section>
  );

  const renderSellersSection = () => {
    if (route.mode === "list") return renderSellersList();

    if (route.mode === "new") {
      if (syncedSellerRouteRef.current !== "new:") return renderSellerLoading("Preparando editor...");
      return renderSellerEditor();
    }

    if (!route.id) return renderSellerNotFound();

    if (!routedSeller) {
      if (!hasLoadedSellers) return renderSellerLoading();
      if (sellerError) return renderSellerLoading();
      return renderSellerNotFound();
    }

    if (route.mode === "view") return renderSellerView(routedSeller);

    if (route.mode === "edit") {
      if (syncedSellerRouteRef.current !== `${route.mode}:${route.id}`) {
        return renderSellerLoading("Preparando editor...");
      }
      return renderSellerEditor({ isEdit: true });
    }

    return renderSellerNotFound();
  };

  const renderPropertiesSection = () => {
    if (route.mode === "list") return renderPropertiesList();

    if (route.mode === "new") {
      if (form.databaseId) return renderPropertyLoading("Preparando editor...");
      return renderPropertyEditor();
    }

    if (!route.id) return renderNotFound("Propiedad no encontrada", "/admin/propiedades");

    if (!routedProperty) {
      if (!hasLoadedProperties || isLoading) return renderPropertyLoading();
      return renderNotFound("Propiedad no encontrada", "/admin/propiedades");
    }

    if (route.mode === "view") return renderPropertyView(routedProperty);

    if (route.mode === "edit") {
      const routedDatabaseId = routedProperty.databaseId || routedProperty.id;
      if (form.databaseId !== routedDatabaseId) return renderPropertyLoading("Preparando editor...");
      return renderPropertyEditor();
    }

    return renderNotFound("Ruta de propiedades no encontrada", "/admin/propiedades");
  };

  const renderClientNotFound = () => (
    <section className="admin-panel">
      <h2>Cliente no encontrado</h2>
      <p className="seller-empty-state">No encontramos ese cliente en el CRM.</p>
      <button type="button" className="wa-btn" onClick={() => navigateAdmin("/admin/clientes")}>
        Volver a clientes
      </button>
    </section>
  );

  const renderClientLoading = (title = "Cargando cliente...") => (
    <section className="admin-panel">
      <h2>{clientError && title === "Cargando cliente..." ? "No pude cargar el cliente" : title}</h2>
      {clientError ? <p className="admin-error">{clientError}</p> : <p className="seller-empty-state">Cargando...</p>}
    </section>
  );

  const renderClientsSection = () => {
    if (route.mode === "list") return renderClientsList();

    if (route.mode === "new") {
      if (clientForm.id) return renderClientLoading("Preparando editor...");
      return renderClientEditor();
    }

    if (!route.id) return renderClientNotFound();

    const routedClient = allClients.find((client) => client.id === route.id);
    if (!routedClient) {
      if (!hasLoadedAllClients) return renderClientLoading();
      if (clientError) return renderClientLoading();
      return renderClientNotFound();
    }

    if (route.mode === "view") return renderClientView(routedClient);

    if (route.mode === "edit") {
      if (clientForm.id !== route.id) return renderClientLoading("Preparando editor...");
      return renderClientEditor();
    }

    return renderClientNotFound();
  };

  const renderSearchRequestsList = () => (
    <section className="admin-sellers-panel" aria-labelledby="admin-search-requests-title">
      <div className="admin-sellers-header">
        <div>
          <p>Portal de clientes</p>
          <h2 id="admin-search-requests-title">Búsquedas</h2>
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
              <small>{formatAdminDate(sr.updatedAt || sr.createdAt)}</small>
            </div>
            <span className={`seller-status-pill seller-status-pill--${sr.status}`}>
              {SEARCH_REQUEST_STATUS_LABELS[sr.status] || sr.status}
            </span>
            <div className="admin-header-actions">
              <button type="button" className="map-btn" onClick={() => navigateAdmin(`/admin/busquedas/${sr.id}`)}>
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
    <section className="admin-editor" aria-labelledby="admin-search-request-view-title">
      <div className="admin-editor-title">
        <div>
          <p>Búsqueda de cliente</p>
          <h2 id="admin-search-request-view-title">{sr.userName || sr.userEmail || "Usuario sin perfil"}</h2>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="map-btn" onClick={() => navigateAdmin("/admin/busquedas")}>
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
          <input readOnly value={formatAdminDate(sr.createdAt)} />
        </label>
        <label>
          Última actualización
          <input readOnly value={formatAdminDate(sr.updatedAt)} />
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
    if (route.mode === "list") return renderSearchRequestsList();

    if (!route.id) return renderSearchRequestsList();

    const sr = searchRequests.find((item) => item.id === route.id);
    if (!sr) {
      return (
        <section className="admin-panel">
          <p>No se encontró la búsqueda.</p>
          <button type="button" className="wa-btn" onClick={() => navigateAdmin("/admin/busquedas")}>
            Volver a búsquedas
          </button>
        </section>
      );
    }

    return renderSearchRequestView(sr);
  };

  const renderAdminContent = () => {
    if (route.section === "not-found") return <AdminNotFound navigateAdmin={navigateAdmin} />;

    if (route.section === "dashboard") {
      return (
        <>
          <AdminDashboardAlerts messages={[error, sellerError, clientError]} />
          <AdminDashboard
            properties={properties}
            clients={allClients}
            sellers={sellers}
            onCreateProperty={handleCreateProperty}
            onCreateClient={handleCreateClient}
            onCreateSeller={handleCreateSeller}
          />
        </>
      );
    }

    if (route.section === "properties") return renderPropertiesSection();

    if (route.section === "clients") return renderClientsSection();

    if (route.section === "searchRequests") return renderSearchRequestsSection();

    if (route.section === "sellers") return renderSellersSection();

    return <AdminNotFound navigateAdmin={navigateAdmin} />;
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
      <AppNavbar
        ariaLabel="Navegacion de administracion"
        brandLabel="Administrador"
        logoUrl={logoMarkUrl}
        onBrandClick={() => navigateAdmin("/admin")}
        items={adminNavbarItems({ activeSection: route.section })}
        onItemSelect={handleAdminNavbarItemSelect}
      />
      <header className="admin-header">
        <div>
          <p>Denise Catalán</p>
          <h1>Administrador de propiedades</h1>
        </div>
      </header>

      {renderAdminContent()}
    </main>
  );
}

export default AdminApp;
