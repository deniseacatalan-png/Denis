import { upload } from "@vercel/blob/client";
import { useEffect, useMemo, useState } from "react";
import { CATEGORY_META, slugify } from "../utils/properties";
import {
  deleteAdminProperty,
  fetchAdminProperties,
  getCurrentSession,
  onAuthStateChange,
  saveAdminProperty,
  signInAdmin,
  signOutAdmin
} from "../utils/supabase/properties";

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
  styleColor: "",
  markerColor: "#a65774",
  summary: "",
  descriptionHtml: "",
  rawDescription: "",
  isPublished: true,
  displayOrder: 0,
  images: []
};

const imageContentTypes = ["image/avif", "image/jpeg", "image/png", "image/webp"];
const imageAccept = imageContentTypes.join(",");

const mimeExtensions = {
  "image/avif": ".avif",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};

function imagePathForFile(file, propertySlug, index) {
  const extension = file.name.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase() || mimeExtensions[file.type] || "";
  const baseName = extension ? file.name.slice(0, -extension.length) : file.name;
  const safeBaseName = slugify(baseName, 72) || "imagen";
  return `properties/${propertySlug}/${Date.now()}-${index}-${safeBaseName}${extension}`;
}

function propertyToForm(property) {
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
    styleColor: property.styleColor || "",
    markerColor: property.markerColor || CATEGORY_META[property.category]?.mapColor || "#a65774",
    summary: property.summary || "",
    descriptionHtml: property.descriptionHtml || "",
    rawDescription: property.rawDescription || "",
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

function AdminApp() {
  const [session, setSession] = useState(undefined);
  const [properties, setProperties] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(emptyPropertyForm);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [descriptionView, setDescriptionView] = useState("preview");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === selectedId) || null,
    [properties, selectedId]
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

  useEffect(() => {
    loadProperties();
  }, [session]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const startNewProperty = () => {
    setSelectedId("");
    setForm(emptyPropertyForm);
    setMessage("");
    setError("");
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
          <a href="/" className="map-btn">
            Ver web
          </a>
          <button type="button" className="map-btn" onClick={signOutAdmin}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <section className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-header">
            <h2>Propiedades</h2>
            <button type="button" className="wa-btn" onClick={startNewProperty}>
              Nueva
            </button>
          </div>
          {isLoading && !properties.length ? <p>Cargando...</p> : null}
          <div className="admin-property-list">
            {properties.map((property) => (
              <button
                type="button"
                key={property.id}
                className={`admin-property-row ${property.id === selectedId ? "active" : ""}`}
                onClick={() => setSelectedId(property.id)}
              >
                <span>{property.title}</span>
                <small>{CATEGORY_META[property.category]?.label || property.category}</small>
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
                onChange={(event) => updateField("title", event.target.value)}
                required
              />
            </label>
            <label>
              Slug
              <input
                value={form.slug}
                onChange={(event) => updateField("slug", event.target.value)}
                placeholder={slugify(form.title)}
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
              Orden
              <input
                type="number"
                value={form.displayOrder}
                onChange={(event) => updateField("displayOrder", event.target.value)}
              />
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
            <label>
              Latitud
              <input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(event) => updateField("latitude", event.target.value)}
                required
              />
            </label>
            <label>
              Longitud
              <input
                type="number"
                step="any"
                value={form.longitude}
                onChange={(event) => updateField("longitude", event.target.value)}
                required
              />
            </label>
            <label>
              Color KML
              <input value={form.styleColor} onChange={(event) => updateField("styleColor", event.target.value)} />
            </label>
            <label>
              Color marcador
              <input value={form.markerColor} onChange={(event) => updateField("markerColor", event.target.value)} />
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
                  onChange={(event) => updateField("descriptionHtml", event.target.value)}
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
    </main>
  );
}

export default AdminApp;
