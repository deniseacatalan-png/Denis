import { useEffect, useMemo, useState } from "react";
import {
  CONTACT_OPERATIONS,
  CONTACT_STATUSES,
  fetchInternalProfile,
  fetchSellerContacts,
  getCurrentSession,
  onAuthStateChange,
  saveSellerContact,
  signInSeller,
  signOutSeller
} from "../utils/supabase/sellers";

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

const emptyContactForm = {
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

function contactToForm(contact) {
  return {
    id: contact.id || "",
    fullName: contact.fullName || "",
    phone: contact.phone || "",
    email: contact.email || "",
    operation: CONTACT_OPERATIONS.includes(contact.operation) ? contact.operation : "alquilar",
    zone: contact.zone || "",
    budget: contact.budget || "",
    rooms: contact.rooms || "",
    status: CONTACT_STATUSES.includes(contact.status) ? contact.status : "nuevo",
    notes: contact.notes || ""
  };
}

function formatContactDate(value) {
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
        <img src="/isodc.svg" alt="Logo Denise Catalán" />
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
  const [contacts, setContacts] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [form, setForm] = useState(emptyContactForm);
  const [filters, setFilters] = useState({ operation: "", status: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId) || null,
    [contacts, selectedContactId]
  );

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
    if (!selectedContact) return;
    setForm(contactToForm(selectedContact));
  }, [selectedContact]);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!session?.user?.id) {
        setInternalProfile(null);
        setContacts([]);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const profile = await fetchInternalProfile(session.user.id);
        if (!active) return;

        if (!profile) {
          setInternalProfile(null);
          setContacts([]);
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

  const loadContacts = async () => {
    if (!internalProfile) return;

    setIsLoading(true);
    setError("");

    try {
      const data = await fetchSellerContacts(filters);
      setContacts(data);
      setSelectedContactId((currentId) =>
        data.some((contact) => contact.id === currentId) ? currentId : data[0]?.id || ""
      );
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
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

  const startNewContact = () => {
    setSelectedContactId("");
    setForm(emptyContactForm);
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
      const savedContact = await saveSellerContact(form, session.user.id);
      setMessage("Contacto guardado.");
      await loadContacts();
      setSelectedContactId(savedContact.id);
      setForm(contactToForm(savedContact));
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
          <button type="button" className="map-btn" onClick={loadContacts} disabled={!internalProfile || isLoading}>
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
            <h2>Contactos</h2>
            <button type="button" className="wa-btn" onClick={startNewContact}>
              Nuevo
            </button>
          </div>

          <div className="seller-filters">
            <label>
              Operación
              <select value={filters.operation} onChange={(event) => updateFilter("operation", event.target.value)}>
                <option value="">Todas</option>
                {CONTACT_OPERATIONS.map((operation) => (
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
                {CONTACT_STATUSES.map((status) => (
                  <option value={status} key={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isLoading && !contacts.length ? <p className="admin-sidebar-note">Cargando contactos...</p> : null}
          <div className="seller-contact-rows">
            {contacts.map((contact) => (
              <button
                type="button"
                key={contact.id}
                className={`seller-contact-row ${contact.id === selectedContactId ? "active" : ""}`}
                onClick={() => setSelectedContactId(contact.id)}
              >
                <span>{contact.fullName}</span>
                <small>
                  {operationLabels[contact.operation] || contact.operation}
                  <span className={`seller-status-pill seller-status-pill--${contact.status}`}>
                    {statusLabels[contact.status] || contact.status}
                  </span>
                </small>
                <small>{contact.zone || "Sin zona"} · {formatContactDate(contact.updatedAt || contact.createdAt)}</small>
              </button>
            ))}
            {!isLoading && !contacts.length ? (
              <p className="seller-empty-state">No hay contactos para estos filtros.</p>
            ) : null}
          </div>
        </aside>

        <form className="seller-contact-editor" onSubmit={handleSave}>
          <div className="admin-editor-title">
            <div>
              <p>{form.id ? "Editar contacto" : "Nuevo contacto"}</p>
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
                {CONTACT_OPERATIONS.map((operation) => (
                  <option value={operation} key={operation}>
                    {operationLabels[operation]}
                  </option>
                ))}
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
                {CONTACT_STATUSES.map((status) => (
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
              {isSaving ? "Guardando..." : "Guardar contacto"}
            </button>
            <button type="button" className="map-btn" onClick={startNewContact}>
              Limpiar
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default SellerApp;
