"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DocumentsPanel, NotesPanel } from "../components/ActivityPanels";
import AppNavbar from "../components/AppNavbar";
import { sellerNavbarItems } from "../components/AppNavbarConfig";
import {
  activityAuthorFromProfile,
  createClientDocument,
  createClientNote,
  fetchClientDocuments,
  fetchClientNotes
} from "../utils/supabase/activity";
import {
  CLIENT_OPERATIONS,
  CLIENT_STATUSES,
  fetchClients,
  saveClient
} from "../utils/supabase/clients";
import {
  fetchInternalProfile,
  getCurrentSession,
  onAuthStateChange,
  signInSeller,
  signOutSeller
} from "../utils/supabase/sellers";
import { getSellerClientIdFromPathname, SELLER_HOME_PATH, sellerClientPath } from "./routing";
import logoMark from "../../ISO GRAFITO.png";

function assetUrl(asset) {
  return typeof asset === "string" ? asset : asset?.src || "";
}

const logoMarkUrl = assetUrl(logoMark);

const operationLabels = {
  comprar: "Comprar",
  alquilar: "Alquilar",
  temporada: "Temporada"
};

const statusLabels = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  visitando: "Visitando",
  cerrado: "Cerrado",
  pausado: "Pausado"
};

function clientSideLabel(client) {
  return client?.isOwner ? "Propietario" : "Busca comprar/alquilar";
}

const emptyClientForm = {
  id: "",
  fullName: "",
  phone: "",
  email: "",
  isOwner: false,
  operation: "alquilar",
  zone: "",
  budget: "",
  rooms: "",
  status: "nuevo",
  notes: ""
};

function clientToForm(client) {
  return {
    id: client.id || "",
    fullName: client.fullName || "",
    phone: client.phone || "",
    email: client.email || "",
    isOwner: Boolean(client.isOwner),
    operation: CLIENT_OPERATIONS.includes(client.operation) ? client.operation : "alquilar",
    zone: client.zone || "",
    budget: client.budget || "",
    rooms: client.rooms || "",
    status: CLIENT_STATUSES.includes(client.status) ? client.status : "nuevo",
    notes: client.notes || ""
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

function getInitialSellerClientId() {
  if (typeof window === "undefined") return "";
  return getSellerClientIdFromPathname(window.location.pathname);
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

function ClientDetailView({ client, internalProfile, session, activityAuthor, onEdit, onNewClient }) {
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
        <ClientDetailField label="Lado del cliente" value={clientSideLabel(client)} />
        <ClientDetailField label="Operación" value={operationLabels[client.operation] || client.operation} />
        <ClientDetailField label="Estado" value={statusLabels[client.status] || client.status} />
        <ClientDetailField label="Zona" value={client.zone} />
        <ClientDetailField label="Presupuesto" value={client.budget} />
        <ClientDetailField label="Ambientes" value={client.rooms} />
        <ClientDetailField label="Última actualización" value={formatClientDate(client.updatedAt || client.createdAt)} />
        <ClientDetailField label="Notas" value={client.notes} className="admin-field-wide" />
      </div>

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
  const [selectedClientId, setSelectedClientId] = useState(getInitialSellerClientId);
  const [editorMode, setEditorMode] = useState(() => (getInitialSellerClientId() ? "view" : "edit"));
  const [form, setForm] = useState(emptyClientForm);
  const [filters, setFilters] = useState({ operation: "", status: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const selectedClientIdRef = useRef(selectedClientId);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) || null,
    [clients, selectedClientId]
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
      const routedClientId = getInitialSellerClientId();
      setSelectedClientId(routedClientId);
      setEditorMode(routedClientId ? "view" : "edit");
      setMessage("");
      setError("");

      if (!routedClientId) {
        setForm(emptyClientForm);
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
  }, [selectedClient, selectedClientId]);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!session?.user?.id) {
        setInternalProfile(null);
        setClients([]);
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

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value
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
    setSelectedClientId("");
    setEditorMode("edit");
    setForm(emptyClientForm);
    setMessage("");
    setError("");
  };

  const handleSellerNavbarItemSelect = (item) => {
    if (item.action === "signout") {
      signOutSeller();
      return;
    }

    if (item.path === SELLER_HOME_PATH) {
      navigateSellerPath(SELLER_HOME_PATH);
      setSelectedClientId("");
      setEditorMode("edit");
      setForm(emptyClientForm);
      setMessage("");
      setError("");
    }
  };

  const openClientDetail = (clientId) => {
    navigateSellerPath(sellerClientPath(clientId));
    setSelectedClientId(clientId);
    setEditorMode("view");
    setMessage("");
    setError("");
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
        items={sellerNavbarItems({ isClientDetail: Boolean(selectedClientId) })}
        onItemSelect={handleSellerNavbarItemSelect}
      />
      <header className="admin-header">
        <div>
          <p>Denise Catalán</p>
          <h1>Portal de vendedores</h1>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="map-btn" onClick={loadClients} disabled={!internalProfile || isLoading}>
            Actualizar
          </button>
        </div>
      </header>

      {message ? <p className="admin-success seller-global-message">{message}</p> : null}
      {error ? <p className="admin-error seller-global-message">{error}</p> : null}

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
                <small>{clientSideLabel(client)}</small>
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
            <label>
              Operación
              <select value={form.operation} onChange={(event) => updateForm("operation", event.target.value)}>
                {CLIENT_OPERATIONS.map((operation) => (
                  <option value={operation} key={operation}>
                    {operationLabels[operation]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Lado del cliente
              <select
                value={form.isOwner ? "owner" : "seeker"}
                onChange={(event) => updateForm("isOwner", event.target.value === "owner")}
              >
                <option value="seeker">Busca comprar/alquilar</option>
                <option value="owner">Propietario</option>
              </select>
            </label>
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
    </main>
  );
}

export default SellerApp;
