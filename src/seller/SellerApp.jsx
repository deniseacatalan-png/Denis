"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DocumentsPanel, NotesPanel } from "../components/ActivityPanels";
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
  const [selectedClientId, setSelectedClientId] = useState("");
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
    if (!selectedClient) return;
    setForm(clientToForm(selectedClient));
  }, [selectedClient]);

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
      const nextSelectedClientId = data.some((client) => client.id === currentSelectedClientId)
        ? currentSelectedClientId
        : data[0]?.id || "";

      setClients(data);
      setSelectedClientId(nextSelectedClientId);

      if (!nextSelectedClientId) {
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
    setSelectedClientId("");
    setForm(emptyClientForm);
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
      setSelectedClientId(savedClient.id);
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
      <header className="admin-header">
        <div>
          <p>Denise Catalán</p>
          <h1>Portal de vendedores</h1>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="map-btn" onClick={loadClients} disabled={!internalProfile || isLoading}>
            Actualizar
          </button>
          <button type="button" className="map-btn" onClick={signOutSeller}>
            Cerrar sesión
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
                onClick={() => setSelectedClientId(client.id)}
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
      </section>
    </main>
  );
}

export default SellerApp;
