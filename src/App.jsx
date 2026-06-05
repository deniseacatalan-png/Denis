import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  CircleMarker,
  Tooltip,
  TileLayer,
  useMap
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import logoMark from "../ISO GRAFITO.png";
import {
  CATEGORY_META,
  findPropertyByPublicPath,
  getPublicSelectedPropertyId,
  getVisiblePublicProperties,
  propertyPublicPath
} from "./utils/properties";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

const AdminApp = lazy(() => import("./admin/AdminApp"));
const SellerApp = lazy(() => import("./seller/SellerApp"));

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


const INITIAL_RENTAL_SEARCH = {
  type: "permanente",
  searchDetail: "",
  zone: "",
  budget: "",
  rooms: "",
  preferences: "",
  mustHaves: ""
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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [serviceNeed, setServiceNeed] = useState("vender");
  const [rentalSearch, setRentalSearch] = useState(INITIAL_RENTAL_SEARCH);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [currentPathname, setCurrentPathname] = useState(() => window.location.pathname);
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
        setSelectedId((currentId) => getPublicSelectedPropertyId(parsed, currentId));
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
    const syncPathname = () => setCurrentPathname(window.location.pathname);
    window.addEventListener("popstate", syncPathname);
    return () => window.removeEventListener("popstate", syncPathname);
  }, []);

  useEffect(() => {
    if (!properties.length) return;
    const currentExists = properties.some((property) => property.id === selectedId);
    if (!currentExists) {
      setSelectedId(properties[0].id);
    }
  }, [properties, selectedId]);

  const visibleProperties = useMemo(() => getVisiblePublicProperties(properties), [properties]);

  useEffect(() => {
    if (!visibleProperties.length) return;
    const currentVisible = visibleProperties.some((property) => property.id === selectedId);
    if (!currentVisible) {
      setSelectedId(visibleProperties[0].id);
    }
  }, [visibleProperties, selectedId]);

  const isPropertyRoute = currentPathname.startsWith("/propiedades/");
  const routedProperty = useMemo(
    () => findPropertyByPublicPath(visibleProperties, currentPathname),
    [visibleProperties, currentPathname]
  );
  const selectedProperty =
    routedProperty || visibleProperties.find((property) => property.id === selectedId) || visibleProperties[0] || null;

  useEffect(() => {
    if (routedProperty && routedProperty.id !== selectedId) {
      setSelectedId(routedProperty.id);
    }
  }, [routedProperty, selectedId]);

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
    navigateToPath("/");
  };

  const navigateToPath = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
    setCurrentPathname(path);
    window.scrollTo({ left: 0, top: 0, behavior: "auto" });
  };

  const openPropertyPage = (property) => {
    setSelectedId(property.id);
    navigateToPath(propertyPublicPath(property));
  };

  const selectPropertySlide = (property) => {
    if (property.id === selectedProperty?.id) {
      openPropertyPage(property);
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

  const updateRentalSearch = (field, value) => {
    setRentalSearch((currentSearch) => ({
      ...currentSearch,
      [field]: value
    }));
  };

  const createRentalSearchWhatsAppLink = () => {
    const rentalTypeLabel =
      rentalSearch.type === "turistico" ? "alquiler turístico" : "alquiler permanente";
    const details = [
      `Tipo: ${rentalTypeLabel}`,
      `Búsqueda: ${rentalSearch.searchDetail || "A conversar"}`,
      `Zona: ${rentalSearch.zone || "Flexible"}`,
      `Presupuesto: ${rentalSearch.budget || "A definir"}`,
      `Ambientes: ${rentalSearch.rooms || "A definir"}`,
      `Preferencias: ${rentalSearch.preferences || "Sin detalle"}`,
      `No negociables: ${rentalSearch.mustHaves || "Sin detalle"}`
    ].join("\n");
    const message = `Hola Denise, busco alquiler en San Martín de los Andes.\n${details}`;

    return `https://wa.me/${officeWhatsApp}?text=${encodeURIComponent(message)}`;
  };

  const serviceModal = isServiceModalOpen ? (
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
  ) : null;

  if (isPropertyRoute) {
    return (
      <div className="page-shell property-page-shell">
        <header className="property-page-header">
          <nav className="top-nav property-page-nav">
            <button
              type="button"
              className="brand-home-button"
              onClick={() => navigateToPath("/")}
              aria-label="Volver al inicio"
            >
              <img className="brand-logo" src={logoMark} alt="Logo Denise Catalán" />
            </button>
            <div className="links">
              <button type="button" className="map-btn" onClick={() => navigateToPath("/")}>
                Volver al inicio
              </button>
              <button
                type="button"
                className="status-pill status-pill--venta nav-service-link nav-service-button"
                onClick={() => setIsServiceModalOpen(true)}
              >
                Solicitar servicios
              </button>
            </div>
          </nav>
        </header>

        <main className="property-page-main">
          {loading ? (
            <p className="loading-state">Leyendo la propiedad...</p>
          ) : loadError ? (
            <p className="loading-state">{loadError}</p>
          ) : routedProperty ? (
            <article className="property-page-detail">
              <div className="property-detail-hero property-page-hero">
                {routedProperty.images?.length ? (
                  <img
                    src={resolvePropertyCoverImage(routedProperty)}
                    alt={`Foto principal de ${routedProperty.title}`}
                  />
                ) : null}
                <div className="property-detail-hero-text">
                  <p className={`status-pill status-pill--${routedProperty.category}`}>
                    {CATEGORY_META[routedProperty.category]?.label || "En venta"}
                  </p>
                  <h1 id="property-detail-title">{routedProperty.title}</h1>
                  <p>{routedProperty.location}</p>
                </div>
              </div>

              <div className="property-detail-content property-page-content">
                <div className="detail-stats property-detail-stats">
                  <div>
                    <span>Valor</span>
                    <strong>{formatDisplayedPrice(routedProperty)}</strong>
                  </div>
                  <div>
                    <span>Superficie</span>
                    <strong>{routedProperty.area}</strong>
                  </div>
                  <div>
                    <span>Geo</span>
                    <strong>{formatCoords(routedProperty.coords)}</strong>
                  </div>
                </div>

                <div
                  className="rich-text property-detail-description"
                  dangerouslySetInnerHTML={{
                    __html: routedProperty.descriptionHtml || "<p>Sin descripcion disponible.</p>"
                  }}
                />

                {routedProperty.images?.length ? (
                  <div className="property-gallery property-detail-gallery">
                    {routedProperty.images.map((imageUrl) => (
                      <a href={imageUrl} target="_blank" rel="noreferrer" key={imageUrl}>
                        <img src={imageUrl} alt={`Foto de ${routedProperty.title}`} loading="lazy" />
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
                    onClick={() => selectPropertyOnMap(routedProperty)}
                  >
                    Ver en el mapa
                  </button>
                  <a
                    href={createWhatsAppLink(routedProperty)}
                    target="_blank"
                    rel="noreferrer"
                    className="wa-btn"
                  >
                    Consultar por WhatsApp
                  </a>
                </div>
              </div>
            </article>
          ) : (
            <section className="property-page-empty">
              <p className="chip">Propiedad no encontrada</p>
              <h1>No encontramos esta propiedad publicada.</h1>
              <p>Puede haber cambiado de estado o no estar disponible en este momento.</p>
              <button type="button" className="wa-btn" onClick={() => navigateToPath("/")}>
                Ver propiedades disponibles
              </button>
            </section>
          )}
        </main>
        {serviceModal}
      </div>
    );
  }


  return (
    <div className="page-shell">
      <header className="hero" id="inicio">
        <nav className="top-nav">
          <img className="brand-logo" src={logoMark} alt="Logo Denise Catalán" />
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
            <p className="contact-line">
              San Martín de los Andes · Patagonia Argentina · WhatsApp: <strong>+54 9 2944 68-8613</strong>
            </p>
          </div>

          <section className="map-section hero-map-section" id="mapa">
            <div className="section-title map-section-header">
              <div>
                <p>Geolocalizacion</p>
                <h2>Plano de ubicaciones</h2>
              </div>
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
                          color: property.markerColor || CATEGORY_META[property.category]?.mapColor || CATEGORY_META.venta.mapColor,
                          fillColor:
                            property.markerColor || CATEGORY_META[property.category]?.mapColor || CATEGORY_META.venta.mapColor,
                          fillOpacity: 0.9,
                          weight: property.id === selectedProperty.id ? 4 : 2
                        }}
                        eventHandlers={{
                          click: () => openPropertyPage(property)
                        }}
                      >
                        <Tooltip
                          direction="top"
                          offset={[0, -10]}
                          opacity={1}
                          className="property-map-tooltip"
                          permanent={property.id === selectedProperty.id}
                          sticky
                        >
                          <article className="map-property-preview">
                            {property.images?.length ? (
                              <img
                                src={resolvePropertyCoverImage(property)}
                                alt={`Vista de ${property.title}`}
                                loading="lazy"
                              />
                            ) : null}
                            <span className={`status-pill status-pill--${property.category}`}>
                              {CATEGORY_META[property.category]?.label || "En venta"}
                            </span>
                            <strong>{property.title}</strong>
                            <span>{property.location}</span>
                            <dl>
                              <div>
                                <dt>Valor</dt>
                                <dd>{formatDisplayedPrice(property)}</dd>
                              </div>
                              <div>
                                <dt>Superficie</dt>
                                <dd>{property.area}</dd>
                              </div>
                            </dl>
                            <small>Click para ver la propiedad</small>
                          </article>
                        </Tooltip>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                ) : (
                  <div className="map-empty">
                    <p>No hay propiedades cargadas todavia.</p>
                  </div>
                )}
              </div>
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
                                          backgroundImage: `linear-gradient(180deg, rgba(77,54,97,0.2), rgba(35,35,31,0.66)), url(${resolvePropertyCoverImage(property)})`
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
                                        openPropertyPage(property);
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

        <section className="rental-search-section" aria-labelledby="rental-search-title">
          <div className="property-slider-shell rental-search-shell">
            <div className="property-slider-copy">
              <p>Solicitud personalizada</p>
              <h3 id="rental-search-title">Busco alquiler en San Martín de los Andes</h3>
              <span>
                Compartinos el detalle de tu búsqueda para curar opciones permanentes o turísticas
                con zona, presupuesto, preferencias y no negociables claros.
              </span>
            </div>

            <div className="rental-search-card">
              <div className="rental-type-toggle" role="group" aria-label="Tipo de alquiler buscado">
                <label>
                  <input
                    type="radio"
                    name="rental-type"
                    value="permanente"
                    checked={rentalSearch.type === "permanente"}
                    onChange={(event) => updateRentalSearch("type", event.target.value)}
                  />
                  Permanente
                </label>
                <label>
                  <input
                    type="radio"
                    name="rental-type"
                    value="turistico"
                    checked={rentalSearch.type === "turistico"}
                    onChange={(event) => updateRentalSearch("type", event.target.value)}
                  />
                  Turístico
                </label>
              </div>

              <div className="rental-search-grid">
                <label className="rental-search-field rental-search-field--wide">
                  <span>Pequeño detalle de búsqueda</span>
                  <textarea
                    value={rentalSearch.searchDetail}
                    onChange={(event) => updateRentalSearch("searchDetail", event.target.value)}
                    placeholder="Ej: casa luminosa para familia, estadía de verano, cerca de colegio o con jardín"
                    rows={3}
                  />
                </label>
                <label className="rental-search-field">
                  <span>Zona</span>
                  <input
                    type="text"
                    value={rentalSearch.zone}
                    onChange={(event) => updateRentalSearch("zone", event.target.value)}
                    placeholder="Centro, Vega, Chapelco, flexible..."
                  />
                </label>
                <label className="rental-search-field">
                  <span>Presupuesto</span>
                  <input
                    type="text"
                    value={rentalSearch.budget}
                    onChange={(event) => updateRentalSearch("budget", event.target.value)}
                    placeholder="Monto estimado / moneda"
                  />
                </label>
                <label className="rental-search-field">
                  <span>Ambientes</span>
                  <input
                    type="text"
                    value={rentalSearch.rooms}
                    onChange={(event) => updateRentalSearch("rooms", event.target.value)}
                    placeholder="Monoambiente, 2 dorm., 3 ambientes..."
                  />
                </label>
                <label className="rental-search-field">
                  <span>Preferencias</span>
                  <input
                    type="text"
                    value={rentalSearch.preferences}
                    onChange={(event) => updateRentalSearch("preferences", event.target.value)}
                    placeholder="Amoblado, patio, vista, mascotas..."
                  />
                </label>
                <label className="rental-search-field rental-search-field--wide">
                  <span>No negociables</span>
                  <input
                    type="text"
                    value={rentalSearch.mustHaves}
                    onChange={(event) => updateRentalSearch("mustHaves", event.target.value)}
                    placeholder="Ej: cochera, internet, calefacción, contrato anual, fechas exactas"
                  />
                </label>
              </div>

              <div className="rental-search-actions">
                <button
                  type="button"
                  className="map-btn"
                  onClick={() => setRentalSearch(INITIAL_RENTAL_SEARCH)}
                >
                  Limpiar búsqueda
                </button>
                <a
                  href={createRentalSearchWhatsAppLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="wa-btn"
                >
                  Enviar búsqueda por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="local-seo-section" aria-labelledby="local-seo-title">
          <div className="local-seo-copy">
            <p>Inmobiliaria local en Neuquén</p>
            <h2 id="local-seo-title">Bienes raíces en San Martín de los Andes</h2>
            <span>
              Acompañamos búsquedas de compra, venta, alquiler e inversión con foco en propiedades
              reales de la Patagonia: casas, departamentos, lotes, terrenos, chacras y espacios para
              proyectos turísticos o residenciales.
            </span>
          </div>

          <div className="local-seo-grid">
            <article>
              <h3>Compra y venta de propiedades</h3>
              <p>
                Publicamos casas, departamentos y oportunidades seleccionadas para quienes buscan
                comprar o vender en San Martín de los Andes y zonas cercanas.
              </p>
            </article>
            <article>
              <h3>Lotes y terrenos</h3>
              <p>
                Relevamos lotes, terrenos y fracciones con ubicación, superficie, entorno y
                documentación para evaluar cada inversión con claridad.
              </p>
            </article>
            <article>
              <h3>Alquiler permanente y turístico</h3>
              <p>
                Recibimos consultas para alquileres permanentes, estadías turísticas y propiedades
                amobladas según zona, presupuesto, fechas y preferencias.
              </p>
            </article>
          </div>
        </section>

      </main>
      {serviceModal}
    </div>
  );
}

function App() {
  const isAdminRoute =
    window.location.pathname === "/admin" ||
    window.location.pathname.startsWith("/admin/") ||
    window.location.hash === "#admin";
  const isSellerRoute = window.location.pathname === "/vendedor" || window.location.hash === "#vendedor";

  if (isAdminRoute) {
    return (
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
    );
  }

  return isSellerRoute ? (
    <Suspense
      fallback={
        <main className="admin-shell admin-shell--login">
          <section className="admin-login-panel">
            <p>Cargando vendedor...</p>
          </section>
        </main>
      }
    >
      <SellerApp />
    </Suspense>
  ) : (
    <PublicApp />
  );
}

export default App;
