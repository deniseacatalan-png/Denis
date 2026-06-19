"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import logoMark from "../../ISO GRAFITO.png";
import AppNavbar from "../components/AppNavbar";
import { clientNavbarItems } from "../components/AppNavbarConfig";
import { LocationPicker } from "../components/LocationPicker";
import {
  fetchClientPortalDashboard,
  getClientPortalSession,
  onClientPortalAuthStateChange,
  saveClientPortalProfile,
  savePropertySubmission,
  saveSearchRequest,
  sendClientPortalPasswordResetEmail,
  signInWithEmailClient,
  signInWithGoogleClient,
  signOutClientPortal,
  signUpWithEmailClient,
  updateClientPortalPassword,
  uploadClientPortalFile
} from "../utils/supabase/clientPortal.js";

function assetUrl(asset) {
  return typeof asset === "string" ? asset : asset?.src || "";
}

const logoMarkUrl = assetUrl(logoMark);

const emptyProfileForm = {
  fullName: "",
  phone: ""
};

const emptyAuthForm = {
  fullName: "",
  email: "",
  password: ""
};

const emptyPasswordUpdateForm = {
  password: "",
  confirmPassword: ""
};

const emptyPropertyForm = {
  title: "",
  operation: "venta",
  propertyType: "",
  address: "",
  zone: "",
  price: "",
  area: "",
  rooms: "",
  description: "",
  latitude: "-40.1573",
  longitude: "-71.3524"
};

const emptySearchForm = {
  operation: "alquilar",
  searchDetail: "",
  zone: "",
  budget: "",
  rooms: "",
  preferences: "",
  mustHaves: ""
};

const uploadTargetOptions = [
  {
    value: "profile",
    label: "Perfil",
    description: "DNI, constancias y documentacion personal.",
    visual: "profile"
  },
  {
    value: "property_submission",
    label: "Propiedad",
    description: "Fotos, planos, escrituras o datos del inmueble.",
    visual: "property"
  },
  {
    value: "search_request",
    label: "Busqueda",
    description: "Referencias, requisitos y archivos de respaldo.",
    visual: "search"
  }
];

const portalNav = [
  { id: "panel", label: "Panel", path: "/clientes" },
  { id: "perfil", label: "Perfil", path: "/clientes/perfil" },
  { id: "propiedades", label: "Mis propiedades", path: "/clientes/propiedades" },
  { id: "busquedas", label: "Busquedas", path: "/clientes/busquedas" },
  { id: "documentos", label: "Archivos", path: "/clientes/documentos" }
];

const statusLabels = {
  borrador: "Borrador",
  en_revision: "En revision",
  contactado: "Contactado",
  convertido: "Convertido",
  archivado: "Archivado"
};

function formatDate(value) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function activeViewFromPath() {
  if (typeof window === "undefined") return "panel";
  const pathname = window.location.pathname;
  if (pathname.includes("/clientes/perfil")) return "perfil";
  if (pathname.includes("/clientes/propiedades")) return "propiedades";
  if (pathname.includes("/clientes/busquedas")) return "busquedas";
  if (pathname.includes("/clientes/documentos")) return "documentos";
  return "panel";
}

function passwordResetRouteFromPath() {
  if (typeof window === "undefined") return false;
  return window.location.pathname.includes("/clientes/restablecer");
}

function fieldSetter(setter) {
  return (event) => {
    const { name, value } = event.target;
    setter((current) => ({
      ...current,
      [name]: value
    }));
  };
}

function StatusPill({ status }) {
  return <span className={`client-status client-status--${status || "borrador"}`}>{statusLabels[status] || statusLabels.borrador}</span>;
}

function MetricCard({ label, value }) {
  return (
    <article className="client-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="client-empty-state">
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function SubmissionList({ items, type }) {
  if (!items.length) {
    return (
      <EmptyState
        title={type === "property" ? "Todavia no cargaste propiedades" : "Todavia no cargaste busquedas"}
        text="Cuando envies una solicitud, queda visible aca para seguimiento."
      />
    );
  }

  return (
    <div className="client-record-list">
      {items.map((item) => (
        <article className="client-record" key={item.id}>
          <div>
            <div className="client-record-title">
              <strong>{item.title || item.searchDetail || "Solicitud"}</strong>
              <StatusPill status={item.status} />
            </div>
            <p>
              {[item.operation, item.zone || item.location, item.price || item.budget, item.rooms]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          {item.adminMessage ? <small>{item.adminMessage}</small> : <small>Actualizado {formatDate(item.updatedAt)}</small>}
        </article>
      ))}
    </div>
  );
}

function FileList({ files }) {
  if (!files.length) {
    return <EmptyState title="Sin archivos cargados" text="Las fotos y documentos que subas quedan privados y asociados a tu usuario." />;
  }

  return (
    <div className="client-file-list">
      {files.map((file) => (
        <article className="client-file-item" key={file.id}>
          {file.isImage && file.signedUrl ? (
            <img src={file.signedUrl} alt={file.fileName} loading="lazy" />
          ) : (
            <span className="client-file-icon">{file.kind === "photo" ? "IMG" : "DOC"}</span>
          )}
          <div>
            {file.signedUrl ? (
              <a href={file.signedUrl} target="_blank" rel="noreferrer">
                {file.fileName}
              </a>
            ) : (
              <strong>{file.fileName}</strong>
            )}
            <small>
              {file.entityType.replaceAll("_", " ")} · {formatDate(file.createdAt)}
            </small>
          </div>
        </article>
      ))}
    </div>
  );
}

function UploadTargetVisual({ type }) {
  return (
    <span className={`client-upload-target-visual client-upload-target-visual--${type}`} aria-hidden="true">
      {type === "profile" ? (
        <svg viewBox="0 0 72 56" focusable="false">
          <rect x="11" y="10" width="50" height="36" rx="8" />
          <circle cx="28" cy="26" r="6" />
          <path d="M18.5 39c1.8-6 5.4-9 9.5-9s7.7 3 9.5 9" />
          <path d="M42 22h10" />
          <path d="M42 30h8" />
          <path d="M42 38h6" />
        </svg>
      ) : null}
      {type === "property" ? (
        <svg viewBox="0 0 72 56" focusable="false">
          <path d="M14 31 36 13l22 18" />
          <path d="M20 28v18h32V28" />
          <path d="M30 46V34h12v12" />
          <path d="M49 20v-7h7v13" />
          <path d="M13 46h46" />
        </svg>
      ) : null}
      {type === "search" ? (
        <svg viewBox="0 0 72 56" focusable="false">
          <path d="M18 14v31l13-5 13 5 10-4V10L44 14l-13-5-13 5Z" />
          <path d="M31 9v31" />
          <path d="M44 14v31" />
          <circle cx="42" cy="27" r="7" />
          <path d="m47 32 7 7" />
        </svg>
      ) : null}
    </span>
  );
}

function ClientPortalNavbar({ session, activeView, authMode, onAuthMode, onNavigate, onSignOut }) {
  const isAuthenticated = Boolean(session?.user);

  function handleItemSelect(item) {
    if (item.action === "login" || item.action === "signup") {
      onAuthMode(item.action);
      return;
    }

    if (item.action === "signout") {
      onSignOut();
      return;
    }

    if (item.path) {
      onNavigate(item.path, item.viewId);
    }
  }

  return (
    <AppNavbar
      ariaLabel="Navegacion del portal de clientes"
      brandHref="/"
      brandLabel="Portal de clientes"
      logoAlt="Denise Catalan"
      logoUrl={logoMarkUrl}
      items={clientNavbarItems({ isAuthenticated, activeView, authMode })}
      onItemSelect={handleItemSelect}
    />
  );
}

function ClientAuthLayout({ children }) {
  return (
    <main className="client-login-content">
      <section className="client-auth-layout" aria-label="Acceso al portal de clientes">
        <aside className="client-auth-visual">
          <div className="client-auth-visual-copy">
            <p>Portal privado</p>
            <h2>Propiedades, busquedas y archivos en un solo lugar.</h2>
            <span>San Martin de los Andes</span>
          </div>
        </aside>
        {children}
      </section>
    </main>
  );
}

function GoogleIcon() {
  return (
    <span className="client-google-mark" aria-hidden="true">
      <svg className="client-google-icon" viewBox="0 0 533.5 544.3" focusable="false">
        <path
          fill="#4285f4"
          d="M533.5 278.4c0-18.5-1.5-37.1-4.7-55.3H272.1v104.8h147c-6.1 33.8-25.7 63.7-54.4 82.7v68h87.7c51.5-47.4 81.1-117.4 81.1-200.2z"
        />
        <path
          fill="#34a853"
          d="M272.1 544.3c73.4 0 135.3-24.1 180.4-65.7l-87.7-68c-24.4 16.6-55.9 26-92.6 26-71 0-131.2-47.9-152.7-112.3H28.9v70.1c46.2 91.9 140.3 149.9 243.2 149.9z"
        />
        <path
          fill="#fbbc04"
          d="M119.5 324.3c-11.4-33.8-11.4-70.4 0-104.2V150H28.9c-38.6 76.9-38.6 167.5 0 244.4l90.6-70.1z"
        />
        <path
          fill="#ea4335"
          d="M272.1 107.7c38.8-.6 76.3 14 104.4 40.8l77.7-77.7C405.6 24.6 340.5-.8 272.1 0 169.2 0 75.1 58 28.9 150l90.6 70.1c21.5-64.5 81.7-112.4 152.6-112.4z"
        />
      </svg>
    </span>
  );
}

export default function ClientPortalApp() {
  const [activeView, setActiveView] = useState(activeViewFromPath);
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [propertySubmissions, setPropertySubmissions] = useState([]);
  const [searchRequests, setSearchRequests] = useState([]);
  const [files, setFiles] = useState([]);
  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [propertyForm, setPropertyForm] = useState(emptyPropertyForm);
  const [searchForm, setSearchForm] = useState(emptySearchForm);
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [authMode, setAuthMode] = useState(() => (passwordResetRouteFromPath() ? "recover" : "login"));
  const [passwordUpdateForm, setPasswordUpdateForm] = useState(emptyPasswordUpdateForm);
  const [isPasswordResetRoute, setIsPasswordResetRoute] = useState(passwordResetRouteFromPath);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTarget, setUploadTarget] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const user = session?.user || null;

  const loadDashboard = useCallback(
    async (nextSession) => {
      if (!nextSession?.user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const dashboard = await fetchClientPortalDashboard(nextSession.user);
        setProfile(dashboard.profile);
        setPropertySubmissions(dashboard.propertySubmissions);
        setSearchRequests(dashboard.searchRequests);
        setFiles(dashboard.files);
        setProfileForm({
          fullName: dashboard.profile.fullName || "",
          phone: dashboard.profile.phone || ""
        });
      } catch (loadError) {
        setError(loadError.message || "No se pudo cargar el portal.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    let mounted = true;

    getClientPortalSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session || null);
        return loadDashboard(data.session || null);
      })
      .catch((sessionError) => {
        if (!mounted) return;
        setSession(null);
        setError(sessionError.message || "No se pudo leer la sesion.");
        setLoading(false);
      });

    const { data } = onClientPortalAuthStateChange((nextSession, event) => {
      if (!mounted) return;
      setSession(nextSession || null);
      if (event === "PASSWORD_RECOVERY") {
        setIsPasswordResetRoute(true);
      }
      loadDashboard(nextSession || null);
    });

    const handlePopState = () => {
      setActiveView(activeViewFromPath());
      setIsPasswordResetRoute(passwordResetRouteFromPath());
    };
    window.addEventListener("popstate", handlePopState);

    return () => {
      mounted = false;
      data?.subscription?.unsubscribe?.();
      window.removeEventListener("popstate", handlePopState);
    };
  }, [loadDashboard]);

  const summary = useMemo(
    () => ({
      inReview: propertySubmissions.filter((item) => item.status === "en_revision").length +
        searchRequests.filter((item) => item.status === "en_revision").length,
      contacted: propertySubmissions.filter((item) => item.status === "contactado").length +
        searchRequests.filter((item) => item.status === "contactado").length,
      totalFiles: files.length
    }),
    [files.length, propertySubmissions, searchRequests]
  );

  function navigate(path, viewId) {
    window.history.pushState({}, "", path);
    setActiveView(viewId);
    setIsPasswordResetRoute(passwordResetRouteFromPath());
  }

  function showAuthMode(mode) {
    window.history.pushState({}, "", "/clientes");
    setAuthMode(mode);
    setError("");
    setNotice("");
    setIsPasswordResetRoute(false);
  }

  async function handleGoogleLogin() {
    setError("");
    const { error: loginError } = await signInWithGoogleClient();
    if (loginError) setError(loginError.message);
  }

  async function handleEmailAuth(event) {
    event.preventDefault();
    setSaving("auth");
    setError("");
    setNotice("");

    try {
      if (authMode === "recover") {
        const { error: recoverError } = await sendClientPortalPasswordResetEmail(authForm);
        if (recoverError) throw recoverError;
        setNotice("Te enviamos un email para recuperar tu contrasenia.");
        return;
      }

      if (authMode === "signup") {
        const { data, error: signupError } = await signUpWithEmailClient(authForm);
        if (signupError) throw signupError;

        setAuthForm(emptyAuthForm);
        if (data?.session) {
          setSession(data.session);
          await loadDashboard(data.session);
        } else {
          setAuthMode("login");
          setNotice("Cuenta creada. Revisa tu email para confirmar el acceso.");
        }
        return;
      }

      const { error: signinError } = await signInWithEmailClient(authForm);
      if (signinError) throw signinError;
    } catch (authError) {
      setError(authError.message || "No se pudo completar el acceso.");
    } finally {
      setSaving("");
    }
  }

  async function handlePasswordUpdate(event) {
    event.preventDefault();
    setSaving("password");
    setError("");
    setNotice("");

    try {
      const { error: updateError } = await updateClientPortalPassword(passwordUpdateForm);
      if (updateError) throw updateError;

      setPasswordUpdateForm(emptyPasswordUpdateForm);
      setNotice("Contrasenia actualizada.");
      navigate("/clientes", "panel");
    } catch (updateError) {
      setError(updateError.message || "No se pudo actualizar la contrasenia.");
    } finally {
      setSaving("");
    }
  }

  async function handleSignOut() {
    await signOutClientPortal();
    setSession(null);
    setProfile(null);
    setActiveView("panel");
    setAuthMode("login");
    window.history.pushState({}, "", "/clientes");
    setIsPasswordResetRoute(false);
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving("profile");
    setError("");
    setNotice("");

    try {
      const savedProfile = await saveClientPortalProfile(profileForm, user);
      setProfile(savedProfile);
      setNotice("Perfil guardado.");
    } catch (saveError) {
      setError(saveError.message || "No se pudo guardar el perfil.");
    } finally {
      setSaving("");
    }
  }

  async function submitProperty(event) {
    event.preventDefault();
    setSaving("property");
    setError("");
    setNotice("");

    try {
      const saved = await savePropertySubmission(propertyForm, user.id);
      setPropertySubmissions((current) => [saved, ...current]);
      setPropertyForm(emptyPropertyForm);
      setNotice("Propiedad enviada para revision.");
    } catch (saveError) {
      setError(saveError.message || "No se pudo enviar la propiedad.");
    } finally {
      setSaving("");
    }
  }

  async function submitSearch(event) {
    event.preventDefault();
    setSaving("search");
    setError("");
    setNotice("");

    try {
      const saved = await saveSearchRequest(searchForm, user.id);
      setSearchRequests((current) => [saved, ...current]);
      setSearchForm(emptySearchForm);
      setNotice("Busqueda guardada.");
    } catch (saveError) {
      setError(saveError.message || "No se pudo guardar la busqueda.");
    } finally {
      setSaving("");
    }
  }

  async function submitFile(event) {
    const uploadForm = event.currentTarget;
    event.preventDefault();
    setSaving("file");
    setError("");
    setNotice("");

    try {
      const uploaded = await uploadClientPortalFile({
        file: uploadFile,
        userId: user.id,
        entityType: uploadTarget,
        entityId: user.id
      });
      setFiles((current) => [uploaded, ...current]);
      setUploadFile(null);
      uploadForm.reset();
      setNotice("Archivo cargado en privado.");
    } catch (saveError) {
      setError(saveError.message || "No se pudo cargar el archivo.");
    } finally {
      setSaving("");
    }
  }

  if (session === undefined || loading) {
    return (
      <main className="client-portal-shell client-portal-loading">
        <img src={logoMarkUrl} alt="Denise Catalan" />
        <p>Cargando portal...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <div className="client-portal-shell client-login-shell">
        <ClientPortalNavbar
          session={session}
          activeView={activeView}
          authMode={authMode}
          onAuthMode={showAuthMode}
          onNavigate={navigate}
          onSignOut={handleSignOut}
        />
        <ClientAuthLayout>
          <section className="client-login-panel">
            <div>
              <h1>{authMode === "recover" ? "Recuperar acceso" : "Portal de clientes"}</h1>
              <p>
                {authMode === "recover"
                  ? "Te enviamos un link seguro para crear una nueva contrasenia."
                  : "Ingresa con Google o con email para cargar propiedades, busquedas y archivos privados."}
              </p>
            </div>
            {error ? <p className="client-alert client-alert--error">{error}</p> : null}
            {notice ? <p className="client-alert client-alert--success">{notice}</p> : null}

            {authMode !== "recover" ? (
              <div className="client-auth-tabs" role="tablist" aria-label="Acceso por email">
                <button type="button" className={authMode === "login" ? "is-active" : ""} onClick={() => setAuthMode("login")}>
                  Ingresar
                </button>
                <button type="button" className={authMode === "signup" ? "is-active" : ""} onClick={() => setAuthMode("signup")}>
                  Crear cuenta
                </button>
              </div>
            ) : null}

            <form className="client-form client-auth-form" onSubmit={handleEmailAuth}>
              {authMode === "signup" ? (
                <label>
                  Nombre
                  <input
                    name="fullName"
                    value={authForm.fullName}
                    onChange={fieldSetter(setAuthForm)}
                    autoComplete="name"
                  />
                </label>
              ) : null}
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={authForm.email}
                  onChange={fieldSetter(setAuthForm)}
                  autoComplete="email"
                  required
                />
              </label>
              {authMode !== "recover" ? (
                <label>
                  Contrasenia
                  <input
                    type="password"
                    name="password"
                    value={authForm.password}
                    onChange={fieldSetter(setAuthForm)}
                    autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                    required
                  />
                </label>
              ) : null}
              <button type="submit" className="wa-btn" disabled={saving === "auth"}>
                {saving === "auth"
                  ? "Procesando..."
                  : authMode === "recover"
                    ? "Enviar recuperacion"
                    : authMode === "signup"
                      ? "Crear cuenta"
                      : "Ingresar"}
              </button>
            </form>

            {authMode === "login" ? (
              <button type="button" className="client-auth-switch" onClick={() => setAuthMode("recover")}>
                Olvide mi contrasenia
              </button>
            ) : null}
            {authMode !== "login" ? (
              <button type="button" className="client-auth-switch" onClick={() => setAuthMode("login")}>
                Volver a ingresar
              </button>
            ) : null}

            {authMode !== "recover" ? (
              <>
                <div className="client-login-divider"><span>o</span></div>
                <button type="button" className="wa-btn client-google-button" onClick={handleGoogleLogin}>
                  <GoogleIcon />
                  <span>Ingresar con Google</span>
                </button>
              </>
            ) : null}
            <a className="map-btn client-back-link" href="/">
              Volver al sitio
            </a>
          </section>
        </ClientAuthLayout>
      </div>
    );
  }

  if (isPasswordResetRoute) {
    return (
      <div className="client-portal-shell client-login-shell">
        <ClientPortalNavbar
          session={session}
          activeView={activeView}
          authMode={authMode}
          onAuthMode={showAuthMode}
          onNavigate={navigate}
          onSignOut={handleSignOut}
        />
        <ClientAuthLayout>
          <section className="client-login-panel client-password-panel">
            <div>
              <h1>Nueva contrasenia</h1>
              <p>Elegir una contrasenia nueva para volver al panel de clientes.</p>
            </div>
            {error ? <p className="client-alert client-alert--error">{error}</p> : null}
            {notice ? <p className="client-alert client-alert--success">{notice}</p> : null}
            <form className="client-form client-auth-form" onSubmit={handlePasswordUpdate}>
              <label>
                Nueva contrasenia
                <input
                  type="password"
                  name="password"
                  value={passwordUpdateForm.password}
                  onChange={fieldSetter(setPasswordUpdateForm)}
                  autoComplete="new-password"
                  required
                />
              </label>
              <label>
                Repetir contrasenia
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordUpdateForm.confirmPassword}
                  onChange={fieldSetter(setPasswordUpdateForm)}
                  autoComplete="new-password"
                  required
                />
              </label>
              <button type="submit" className="wa-btn" disabled={saving === "password"}>
                {saving === "password" ? "Guardando..." : "Actualizar contrasenia"}
              </button>
            </form>
          </section>
        </ClientAuthLayout>
      </div>
    );
  }

  const profilePanel = (
    <form className="client-panel client-form" onSubmit={saveProfile}>
      <div className="client-panel-heading">
        <p>Datos de contacto</p>
        <h2>Perfil</h2>
      </div>
      <label>
        Nombre
        <input name="fullName" value={profileForm.fullName} onChange={fieldSetter(setProfileForm)} />
      </label>
      <label>
        Telefono
        <input name="phone" value={profileForm.phone} onChange={fieldSetter(setProfileForm)} />
      </label>
      <label>
        Email
        <input value={user.email || ""} disabled />
      </label>
      <button type="submit" className="wa-btn" disabled={saving === "profile"}>
        {saving === "profile" ? "Guardando..." : "Guardar perfil"}
      </button>
    </form>
  );

  return (
    <div className="client-portal-shell">
      <ClientPortalNavbar
        session={session}
        activeView={activeView}
        authMode={authMode}
        onAuthMode={showAuthMode}
        onNavigate={navigate}
        onSignOut={handleSignOut}
      />
      <header className="client-portal-header">
        <div>
          <p>Portal de clientes</p>
          <h1>{profile?.fullName || user.email}</h1>
        </div>
        <span className="client-portal-user-email">{user.email}</span>
      </header>

      <div className="client-portal-layout">
        <aside className="client-portal-sidebar">
          {portalNav.map((item) => (
            <button
              type="button"
              key={item.id}
              className={activeView === item.id ? "is-active" : ""}
              onClick={() => navigate(item.path, item.id)}
            >
              {item.label}
            </button>
          ))}
        </aside>

        <main className="client-portal-main">
          {error ? <p className="client-alert client-alert--error">{error}</p> : null}
          {notice ? <p className="client-alert client-alert--success">{notice}</p> : null}

          {activeView === "panel" ? (
            <section className="client-dashboard-grid">
              <div className="client-metrics">
                <MetricCard label="En revision" value={summary.inReview} />
                <MetricCard label="Contactadas" value={summary.contacted} />
                <MetricCard label="Archivos" value={summary.totalFiles} />
              </div>

              <section className="client-panel client-profile-summary">
                <div className="client-panel-heading">
                  <p>Datos de contacto</p>
                  <h2>{profile?.fullName || "Completa tu perfil"}</h2>
                </div>
                <p>{profile?.phone || "Agrega tu telefono para que podamos contactarte mas rapido."}</p>
                <button type="button" className="map-btn" onClick={() => navigate("/clientes/perfil", "perfil")}>
                  Editar perfil
                </button>
              </section>

              <section className="client-panel">
                <div className="client-panel-heading">
                  <p>Ultimos movimientos</p>
                  <h2>Seguimiento</h2>
                </div>
                <SubmissionList items={[...propertySubmissions, ...searchRequests].slice(0, 4)} type="property" />
              </section>
            </section>
          ) : null}

          {activeView === "perfil" ? (
            <section className="client-profile-grid">
              {profilePanel}
              <section className="client-panel client-account-panel">
                <div className="client-panel-heading">
                  <p>Cuenta</p>
                  <h2>Acceso al portal</h2>
                </div>
                <p>{user.email}</p>
                <p>Desde este panel podes actualizar tus datos, cargar propiedades, guardar busquedas y subir archivos privados.</p>
              </section>
            </section>
          ) : null}

          {activeView === "propiedades" ? (
            <section className="client-workspace-grid">
              <form className="client-panel client-form" onSubmit={submitProperty}>
                <div className="client-panel-heading">
                  <p>Alta de propiedad</p>
                  <h2>Cargar propiedad</h2>
                </div>
                <label>
                  Titulo
                  <input name="title" value={propertyForm.title} onChange={fieldSetter(setPropertyForm)} required />
                </label>
                <div className="client-form-row">
                  <label>
                    Operacion
                    <select name="operation" value={propertyForm.operation} onChange={fieldSetter(setPropertyForm)}>
                      <option value="venta">Venta</option>
                      <option value="alquiler">Alquiler</option>
                      <option value="alquiler_permanente">Alquiler permanente</option>
                      <option value="alquiler_turistico">Alquiler turistico</option>
                    </select>
                  </label>
                  <label>
                    Tipo
                    <input name="propertyType" value={propertyForm.propertyType} onChange={fieldSetter(setPropertyForm)} />
                  </label>
                </div>
                <label>
                  Direccion
                  <input name="address" value={propertyForm.address} onChange={fieldSetter(setPropertyForm)} />
                </label>
                <LocationPicker
                  latitude={propertyForm.latitude}
                  longitude={propertyForm.longitude}
                  location={propertyForm.address}
                  onCoordinatesChange={(nextLatitude, nextLongitude) =>
                    setPropertyForm((current) => ({
                      ...current,
                      latitude: nextLatitude,
                      longitude: nextLongitude
                    }))
                  }
                  onPlaceSelect={(place) =>
                    setPropertyForm((current) => ({
                      ...current,
                      address: place.display_name || current.address
                    }))
                  }
                />
                <div className="client-form-row">
                  <label>
                    Zona
                    <input name="zone" value={propertyForm.zone} onChange={fieldSetter(setPropertyForm)} />
                  </label>
                  <label>
                    Valor
                    <input name="price" value={propertyForm.price} onChange={fieldSetter(setPropertyForm)} />
                  </label>
                </div>
                <div className="client-form-row">
                  <label>
                    Superficie
                    <input name="area" value={propertyForm.area} onChange={fieldSetter(setPropertyForm)} />
                  </label>
                  <label>
                    Ambientes
                    <input name="rooms" value={propertyForm.rooms} onChange={fieldSetter(setPropertyForm)} />
                  </label>
                </div>
                <label>
                  Descripcion
                  <textarea name="description" value={propertyForm.description} onChange={fieldSetter(setPropertyForm)} rows={5} />
                </label>
                <button type="submit" className="wa-btn" disabled={saving === "property"}>
                  {saving === "property" ? "Enviando..." : "Enviar a revision"}
                </button>
              </form>

              <section className="client-panel">
                <div className="client-panel-heading">
                  <p>Historial</p>
                  <h2>Propiedades enviadas</h2>
                </div>
                <SubmissionList items={propertySubmissions} type="property" />
              </section>
            </section>
          ) : null}

          {activeView === "busquedas" ? (
            <section className="client-workspace-grid">
              <form className="client-panel client-form" onSubmit={submitSearch}>
                <div className="client-panel-heading">
                  <p>Solicitud de busqueda</p>
                  <h2>Que estas buscando</h2>
                </div>
                <label>
                  Detalle
                  <textarea name="searchDetail" value={searchForm.searchDetail} onChange={fieldSetter(setSearchForm)} rows={4} required />
                </label>
                <div className="client-form-row">
                  <label>
                    Operacion
                    <select name="operation" value={searchForm.operation} onChange={fieldSetter(setSearchForm)}>
                      <option value="alquilar">Alquilar</option>
                      <option value="comprar">Comprar</option>
                      <option value="temporada">Temporada</option>
                    </select>
                  </label>
                  <label>
                    Zona
                    <input name="zone" value={searchForm.zone} onChange={fieldSetter(setSearchForm)} />
                  </label>
                </div>
                <div className="client-form-row">
                  <label>
                    Presupuesto
                    <input name="budget" value={searchForm.budget} onChange={fieldSetter(setSearchForm)} />
                  </label>
                  <label>
                    Ambientes
                    <input name="rooms" value={searchForm.rooms} onChange={fieldSetter(setSearchForm)} />
                  </label>
                </div>
                <label>
                  Preferencias
                  <input name="preferences" value={searchForm.preferences} onChange={fieldSetter(setSearchForm)} />
                </label>
                <label>
                  Imprescindibles
                  <input name="mustHaves" value={searchForm.mustHaves} onChange={fieldSetter(setSearchForm)} />
                </label>
                <button type="submit" className="wa-btn" disabled={saving === "search"}>
                  {saving === "search" ? "Guardando..." : "Guardar busqueda"}
                </button>
              </form>

              <section className="client-panel">
                <div className="client-panel-heading">
                  <p>Historial</p>
                  <h2>Busquedas guardadas</h2>
                </div>
                <SubmissionList items={searchRequests} type="search" />
              </section>
            </section>
          ) : null}

          {activeView === "documentos" ? (
            <section className="client-workspace-grid">
              <form className="client-panel client-form" onSubmit={submitFile}>
                <div className="client-panel-heading">
                  <p>Bucket privado</p>
                  <h2>Subir archivo</h2>
                </div>
                <fieldset className="client-upload-targets">
                  <legend>Asociar archivo a</legend>
                  <div className="client-upload-target-grid">
                    {uploadTargetOptions.map((option) => {
                      const isSelected = uploadTarget === option.value;

                      return (
                        <button
                          type="button"
                          key={option.value}
                          className={`client-upload-target-card ${isSelected ? "is-selected" : ""}`}
                          aria-pressed={isSelected}
                          onClick={() => setUploadTarget(option.value)}
                        >
                          <UploadTargetVisual type={option.visual} />
                          <span className="client-upload-target-copy">
                            <strong>{option.label}</strong>
                            <small>{option.description}</small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                <label>
                  Archivo
                  <input type="file" onChange={(event) => setUploadFile(event.target.files?.[0] || null)} required />
                </label>
                <button type="submit" className="wa-btn" disabled={saving === "file"}>
                  {saving === "file" ? "Subiendo..." : "Subir privado"}
                </button>
              </form>

              <section className="client-panel">
                <div className="client-panel-heading">
                  <p>Privados</p>
                  <h2>Mis archivos</h2>
                </div>
                <FileList files={files} />
              </section>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
