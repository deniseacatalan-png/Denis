import { Suspense, lazy, useEffect, useRef, useState } from "react";
import {
  MapContainer,
  CircleMarker,
  Popup,
  TileLayer,
  useMap
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

const AdminApp = lazy(() => import("./admin/AdminApp"));

const officeWhatsApp = "5492944688613";

const PROPERTY_SLIDER_GROUPS = [
  {
    category: "venta",
    eyebrow: "Propiedades en venta",
    title: "En venta",
    emptyMessage: "No hay propiedades en venta disponibles por el momento."
  },
  {
    category: "alquiler_turistico",
    eyebrow: "Estadías y escapadas",
    title: "Alquiler turístico",
    emptyMessage: "No hay alquileres turísticos disponibles por el momento."
  },
  {
    category: "alquiler_permanente",
    eyebrow: "Hogares para vivir la Patagonia",
    title: "Alquiler permanente",
    emptyMessage: "No hay alquileres permanentes disponibles por el momento."
  }
];

const CATEGORY_META = {
  venta: {
    label: "En venta",
    color: "#a65774",
    mapColor: "#a65774"
  },
  alquiler_turistico: {
    label: "Alquiler turistico",
    color: "#e45858",
    mapColor: "#e45858"
  },
  alquiler_permanente: {
    label: "Alquiler permanente",
    color: "#7b8061",
    mapColor: "#7b8061"
  },
  vendido: {
    label: "Vendido",
    color: "#161616",
    mapColor: "#161616"
  },
  proceso: {
    label: "En proceso / sin valor",
    color: "#c9a227",
    mapColor: "#c9a227"
  }
};

function formatCoords(coords) {
  const [lat, lng] = coords;
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function resolvePropertyCoverImage(property) {
  return property.images?.[0] || "";
}

function MapFocus({ coords }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(coords, 13, { duration: 1.1 });
  }, [coords, map]);

  return null;
}

function PublicApp() {
  const [properties, setProperties] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [detailPropertyId, setDetailPropertyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [serviceNeed, setServiceNeed] = useState("vender");
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const detailScrollPositionRef = useRef({ x: 0, y: 0 });
  const propertySliderRefs = useRef({});

  useEffect(() => {
    let active = true;

    async function loadProperties() {
      try {
        const { fetchPublishedProperties } = await import("./utils/supabase/properties");
        const supabaseProperties = await fetchPublishedProperties();

        const parsed = supabaseProperties.map((property) => ({
          ...property,
          images: property.images || []
        }));

        if (!active) return;

        setProperties(parsed);
        setSelectedId((currentId) =>
          parsed.some((property) => property.id === currentId) ? currentId : parsed[0]?.id || ""
        );
        setLoadError("");
      } catch (error) {
        if (!active) return;
        setProperties([]);
        setSelectedId("");
        setLoadError("No pudimos cargar las propiedades desde la base de datos.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProperties();
    const refreshIntervalId = window.setInterval(loadProperties, 60000);

    return () => {
      active = false;
      window.clearInterval(refreshIntervalId);
    };
  }, []);

  useEffect(() => {
    if (!properties.length) return;
    const currentExists = properties.some((property) => property.id === selectedId);
    if (!currentExists) {
      setSelectedId(properties[0].id);
    }
  }, [properties, selectedId]);

  const visibleProperties = properties.filter(
    (property) =>
      property.category === "venta" ||
      property.category === "alquiler_turistico" ||
      property.category === "alquiler_permanente"
  );

  useEffect(() => {
    if (!visibleProperties.length) return;
    const currentVisible = visibleProperties.some((property) => property.id === selectedId);
    if (!currentVisible) {
      setSelectedId(visibleProperties[0].id);
    }
  }, [visibleProperties, selectedId]);

  const selectedProperty =
    visibleProperties.find((property) => property.id === selectedId) || visibleProperties[0] || null;
  const detailProperty =
    visibleProperties.find((property) => property.id === detailPropertyId) || null;
  useEffect(() => {
    if (!detailPropertyId) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closePropertyDetail();
      }
    };
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [detailPropertyId]);

  const formatDisplayedPrice = (property) =>
    property?.category === "proceso" ? "Sin valor" : property?.price || "Consultar";

  const getPropertyIntro = (property) =>
    property.summary || property.location || "Conoce todos los detalles de esta propiedad.";

  const getPropertiesByCategory = (category) =>
    visibleProperties.filter((property) => property.category === category);

  const getActiveSlideIndex = (categoryProperties) => {
    const activeIndex = categoryProperties.findIndex(
      (property) => property.id === selectedProperty?.id
    );

    return activeIndex === -1 ? 0 : activeIndex;
  };

  const scrollPropertySlider = (category, direction) => {
    const sliderTrack = propertySliderRefs.current[category];
    if (!sliderTrack) return;

    sliderTrack.scrollBy({
      left: direction * Math.max(sliderTrack.clientWidth * 0.82, 320),
      behavior: "smooth"
    });
  };

  const selectPropertyOnMap = (property) => {
    setSelectedId(property.id);
  };

  const closePropertyDetail = () => {
    setDetailPropertyId("");

    window.requestAnimationFrame(() => {
      window.scrollTo({
        left: detailScrollPositionRef.current.x,
        top: detailScrollPositionRef.current.y,
        behavior: "auto"
      });
    });
  };

  const openPropertyDetail = (property) => {
    detailScrollPositionRef.current = { x: window.scrollX, y: window.scrollY };
    setSelectedId(property.id);
    setDetailPropertyId(property.id);
  };

  const selectPropertySlide = (property) => {
    if (property.id === selectedProperty?.id) {
      openPropertyDetail(property);
      return;
    }

    setSelectedId(property.id);
  };

  const createWhatsAppLink = (property) => {
    const message = `Hola Denise, quiero informacion sobre: ${property.title} (${property.price}) en ${property.location}.`;
    return `https://wa.me/${officeWhatsApp}?text=${encodeURIComponent(message)}`;
  };

  const createServiceWhatsAppLink = (need = serviceNeed) => {
    const message = `Hola Denise, quiero solicitar el servicio de ${need}.`;
    return `https://wa.me/${officeWhatsApp}?text=${encodeURIComponent(message)}`;
  };


  return (
    <div className="page-shell">
      <header className="hero" id="inicio">
        <nav className="top-nav">
          <img className="brand-logo" src="/isodc.svg" alt="Logo Denise Catalán" />
          <div className="links">
            <button
              type="button"
              className="status-pill status-pill--venta nav-service-link nav-service-button"
              onClick={() => setIsServiceModalOpen(true)}
            >
              Solicitar servicios
            </button>
          </div>
        </nav>

        <div className="hero-layout">
          <div className="hero-content">
            <p className="overline">Inmobiliaria boutique en Patagonia</p>
            <h1>Denise Catalán Bienes Raíces</h1>
            <p>Invertí en naturaleza con una mirada cercana, profesional y personalizada.</p>
            <p className="brand-value">
              Acompañamos cada decisión inmobiliaria con curaduría, escucha y conocimiento local para que encuentres el lugar donde querés estar.
            </p>
            <p className="contact-line">
              San Martín de los Andes · Patagonia Argentina · WhatsApp: <strong>+54 9 2944 68-8613</strong>
            </p>
            <ul className="brand-pillars" aria-label="Propuesta de valor">
              <li>Curaduría boutique</li>
              <li>Acompañamiento personalizado</li>
              <li>Conocimiento local</li>
            </ul>
          </div>

          <section className="map-section hero-map-section" id="mapa">
            <div className="section-title map-section-header">
              <div>
                <p>Geolocalizacion</p>
                <h2>Plano de ubicaciones</h2>
              </div>
              <button type="button" className="map-btn header-map-btn" onClick={() => setIsServiceModalOpen(true)}>Hablar con Denise</button>
            </div>

            <div className="map-layout">
              <div className="map-frame">
                {selectedProperty ? (
                  <MapContainer
                    center={selectedProperty.coords}
                    zoom={12}
                    scrollWheelZoom={true}
                    className="map-view"
                  >
                    <MapFocus coords={selectedProperty.coords} />
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {visibleProperties.map((property) => (
                      <CircleMarker
                        key={property.id}
                        center={property.coords}
                        radius={property.id === selectedProperty.id ? 11 : 8}
                        pathOptions={{
                          color: property.markerColor || CATEGORY_META[property.category]?.mapColor || "#a65774",
                          fillColor:
                            property.markerColor || CATEGORY_META[property.category]?.mapColor || "#a65774",
                          fillOpacity: 0.9,
                          weight: property.id === selectedProperty.id ? 4 : 2
                        }}
                        eventHandlers={{
                          click: () => setSelectedId(property.id)
                        }}
                      >
                        <Popup>
                          <strong>{property.title}</strong>
                          <br />
                          {property.price}
                        </Popup>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                ) : (
                  <div className="map-empty">
                    <p>No hay propiedades cargadas todavia.</p>
                  </div>
                )}
              </div>

              <aside className="map-highlight details-panel" id="contacto">
                <p className="chip">Ficha completa</p>
                {selectedProperty?.images?.length ? (
                  <div className="details-cover">
                    <img
                      src={resolvePropertyCoverImage(selectedProperty)}
                      alt={`Portada de ${selectedProperty.title}`}
                      loading="lazy"
                    />
                    <h3>{selectedProperty.title}</h3>
                  </div>
                ) : (
                  <h3>{selectedProperty?.title || "Selecciona una propiedad"}</h3>
                )}
                <p>{selectedProperty?.location}</p>
                <p className={`status-pill status-pill--${selectedProperty?.category || "venta"}`}>
                  {selectedProperty ? CATEGORY_META[selectedProperty.category]?.label : "En venta"}
                </p>
                <div className="detail-stats">
                  <div>
                    <span>Valor</span>
                    <strong>{formatDisplayedPrice(selectedProperty)}</strong>
                  </div>
                  <div>
                    <span>Superficie</span>
                    <strong>{selectedProperty?.area}</strong>
                  </div>
                  <div>
                    <span>Geo</span>
                    <strong>{selectedProperty ? formatCoords(selectedProperty.coords) : "-"}</strong>
                  </div>
                </div>
                <details className="tech-sheet">
                  <summary className="map-btn">Ver ficha tecnica</summary>
                  <div
                    className="rich-text"
                    dangerouslySetInnerHTML={{
                      __html: selectedProperty?.descriptionHtml || "<p>Sin descripcion disponible.</p>"
                    }}
                  />
                </details>
                {selectedProperty?.images?.length ? (
                  <div className="property-gallery">
                    {selectedProperty.images.map((imageUrl) => (
                      <a href={imageUrl} target="_blank" rel="noreferrer" key={imageUrl}>
                        <img src={imageUrl} alt={`Foto de ${selectedProperty.title}`} loading="lazy" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="gallery-empty">Esta propiedad todavia no tiene fotos cargadas.</p>
                )}
                {selectedProperty ? (
                  <a
                    href={createWhatsAppLink(selectedProperty)}
                    target="_blank"
                    rel="noreferrer"
                    className="wa-btn"
                  >
                    Hablar por WhatsApp
                  </a>
                ) : null}
              </aside>
            </div>
          </section>
        </div>
      </header>

      <main className="content-wrap">
        <section className="properties" aria-labelledby="properties-title">
          <div className="section-title">
            <p>Una selección dentro de nuestra propuesta integral</p>
            <h2 id="properties-title">Propiedades disponibles</h2>
          </div>

          {loading ? (
            <p className="loading-state">Leyendo las propiedades reales...</p>
          ) : loadError ? (
            <p className="loading-state">{loadError}</p>
          ) : (
            <div className="property-slider-stack">
              {PROPERTY_SLIDER_GROUPS.map((group) => {
                const categoryProperties = getPropertiesByCategory(group.category);
                const activeSlideIndex = getActiveSlideIndex(categoryProperties);

                return (
                  <section
                    className="property-slider-section"
                    aria-labelledby={`property-slider-${group.category}`}
                    key={group.category}
                  >
                    <div className="property-slider-shell">
                      <div className="property-slider-copy">
                        <p>{group.eyebrow}</p>
                        <h3 id={`property-slider-${group.category}`}>{group.title}</h3>
                        <span>
                          Explorá esta categoría manualmente con los botones o deslizando el carril.
                        </span>
                      </div>
                      <div className="property-slider-counter" aria-label={`${group.title}: propiedad actual`}>
                        {categoryProperties.length ? activeSlideIndex + 1 : 0} / {categoryProperties.length}
                      </div>

                      <div className="property-slider-viewport">
                        <button
                          type="button"
                          className="property-slider-nav property-slider-nav--prev"
                          onClick={() => scrollPropertySlider(group.category, -1)}
                          disabled={categoryProperties.length <= 1}
                          aria-label={`Deslizar ${group.title} hacia la izquierda`}
                        >
                          ‹
                        </button>
                        <div
                          className="property-slider-track"
                          ref={(element) => {
                            if (element) {
                              propertySliderRefs.current[group.category] = element;
                            } else {
                              delete propertySliderRefs.current[group.category];
                            }
                          }}
                        >
                          {categoryProperties.length ? (
                            categoryProperties.map((property) => (
                              <article
                                className={`property-slide ${property.id === selectedProperty?.id ? "active" : ""}`}
                                data-property-id={property.id}
                                key={property.id}
                              >
                                <div
                                  className="property-slide-card"
                                  role={property.id === selectedProperty?.id ? undefined : "button"}
                                  tabIndex={property.id === selectedProperty?.id ? undefined : 0}
                                  style={
                                    property.images.length
                                      ? {
                                          backgroundImage: `linear-gradient(180deg, rgba(17,17,17,0.2), rgba(17,17,17,0.82)), url(${resolvePropertyCoverImage(property)})`
                                        }
                                      : undefined
                                  }
                                  onClick={() => selectPropertySlide(property)}
                                  onKeyDown={(event) => {
                                    if (
                                      property.id !== selectedProperty?.id &&
                                      (event.key === "Enter" || event.key === " ")
                                    ) {
                                      event.preventDefault();
                                      selectPropertySlide(property);
                                    }
                                  }}
                                >
                                  <span className={`status-pill status-pill--${property.category}`}>
                                    {CATEGORY_META[property.category]?.label || "En venta"}
                                  </span>
                                  <span className="property-slide-text">
                                    <span className="property-slide-kicker">{formatDisplayedPrice(property)}</span>
                                    <span className="property-slide-title">{property.title}</span>
                                    <span className="property-slide-intro">{getPropertyIntro(property)}</span>
                                  </span>
                                  <span className="property-slide-footer">
                                    <span>{property.location}</span>
                                    <button
                                      type="button"
                                      className="property-slide-detail-btn"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        openPropertyDetail(property);
                                      }}
                                    >
                                      Ver descripcion completa
                                    </button>
                                  </span>
                                </div>
                              </article>
                            ))
                          ) : (
                            <div className="property-slider-empty" role="status">
                              {group.emptyMessage}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          className="property-slider-nav property-slider-nav--next"
                          onClick={() => scrollPropertySlider(group.category, 1)}
                          disabled={categoryProperties.length <= 1}
                          aria-label={`Deslizar ${group.title} hacia la derecha`}
                        >
                          ›
                        </button>
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </section>

      </main>
      {detailProperty ? (
        <div
          className="property-detail-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="property-detail-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePropertyDetail();
            }
          }}
        >
          <section className="property-detail-screen">
            <button
              type="button"
              className="property-detail-close"
              onClick={closePropertyDetail}
              aria-label="Cerrar detalle"
            >
              ×
            </button>
            <div className="property-detail-hero">
              {detailProperty.images?.length ? (
                <img
                  src={resolvePropertyCoverImage(detailProperty)}
                  alt={`Foto principal de ${detailProperty.title}`}
                />
              ) : null}
              <div className="property-detail-hero-text">
                <p className={`status-pill status-pill--${detailProperty.category}`}>
                  {CATEGORY_META[detailProperty.category]?.label || "En venta"}
                </p>
                <h2 id="property-detail-title">{detailProperty.title}</h2>
                <p>{detailProperty.location}</p>
              </div>
            </div>

            <div className="property-detail-content">
              <div className="detail-stats property-detail-stats">
                <div>
                  <span>Valor</span>
                  <strong>{formatDisplayedPrice(detailProperty)}</strong>
                </div>
                <div>
                  <span>Superficie</span>
                  <strong>{detailProperty.area}</strong>
                </div>
                <div>
                  <span>Geo</span>
                  <strong>{formatCoords(detailProperty.coords)}</strong>
                </div>
              </div>

              <div
                className="rich-text property-detail-description"
                dangerouslySetInnerHTML={{
                  __html: detailProperty.descriptionHtml || "<p>Sin descripcion disponible.</p>"
                }}
              />

              {detailProperty.images?.length ? (
                <div className="property-gallery property-detail-gallery">
                  {detailProperty.images.map((imageUrl) => (
                    <a href={imageUrl} target="_blank" rel="noreferrer" key={imageUrl}>
                      <img src={imageUrl} alt={`Foto de ${detailProperty.title}`} loading="lazy" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="gallery-empty">Esta propiedad todavia no tiene fotos cargadas.</p>
              )}

              <div className="property-detail-actions">
                <button
                  type="button"
                  className="map-btn"
                  onClick={() => {
                    closePropertyDetail();
                    selectPropertyOnMap(detailProperty);
                  }}
                >
                  Seleccionar en mapa
                </button>
                <a
                  href={createWhatsAppLink(detailProperty)}
                  target="_blank"
                  rel="noreferrer"
                  className="wa-btn"
                >
                  Consultar por WhatsApp
                </a>
              </div>
            </div>
          </section>
        </div>
      ) : null}
      {isServiceModalOpen ? (
        <div className="service-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="service-modal-title">
          <div className="service-modal">
            <label id="service-modal-title" htmlFor="service-need" className="services-label">Quiero solicitar el servicio de:</label>
            <select
              id="service-need"
              value={serviceNeed}
              onChange={(event) => setServiceNeed(event.target.value)}
            >
              <option value="vender">Vender</option>
              <option value="alquilar">Alquilar</option>
              <option value="invertir">Invertir</option>
              <option value="otros">Otros</option>
            </select>
            <div className="service-modal-actions">
              <button type="button" className="map-btn" onClick={() => setIsServiceModalOpen(false)}>
                Cerrar
              </button>
              <a
                href={createServiceWhatsAppLink(serviceNeed)}
                target="_blank"
                rel="noreferrer"
                className="wa-btn"
                onClick={() => setIsServiceModalOpen(false)}
              >
                Ir a WhatsApp
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function App() {
  const isAdminRoute = window.location.pathname === "/admin" || window.location.hash === "#admin";
  return isAdminRoute ? (
    <Suspense
      fallback={
        <main className="admin-shell admin-shell--login">
          <section className="admin-login-panel">
            <p>Cargando administrador...</p>
          </section>
        </main>
      }
    >
      <AdminApp />
    </Suspense>
  ) : (
    <PublicApp />
  );
}

export default App;
