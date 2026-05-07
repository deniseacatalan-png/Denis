import { useEffect, useRef, useState } from "react";
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

const KML_URL = "/PROPIEDADESVENTA.kml";
const officeWhatsApp = "5492944688613";
const PROPERTY_IMAGE_LIBRARY = {
  "terreno-alihuen-alto": [
    "/images/TERRENO ALIHUEN ALTO/alihuen.JPG",
    "/images/TERRENO ALIHUEN ALTO/aa2.jpg",
    "/images/TERRENO ALIHUEN ALTO/aa3.jpg"
  ],
  "has-orillas-de-caleufu": [
    "/images/HAS ORILLAS DE CALEUFU/DJI_0055.JPG",
    "/images/HAS ORILLAS DE CALEUFU/DJI_0051.JPG",
    "/images/HAS ORILLAS DE CALEUFU/DJI_0054.JPG",
    "/images/HAS ORILLAS DE CALEUFU/DJI_0056.JPG",
    "/images/HAS ORILLAS DE CALEUFU/DJI_0059.JPG",
    "/images/HAS ORILLAS DE CALEUFU/DJI_0061.JPG",
    "/images/HAS ORILLAS DE CALEUFU/DJI_0062.JPG"
  ]
};
const PROPERTY_COVER_IMAGE_LIBRARY = {
  "has-orillas-de-caleufu": "/images/HAS ORILLAS DE CALEUFU/DJI_0055.JPG"
};

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
  vendido: {
    label: "Vendido",
    color: "#161616",
    mapColor: "#161616"
  },
  proceso: {
    label: "En proceso / sin precio",
    color: "#c9a227",
    mapColor: "#c9a227"
  }
};

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function htmlToText(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html || "", "text/html");
  const text = doc.body.innerText || doc.body.textContent || "";
  return text.replace(/\s+/g, " ").trim();
}

function truncateText(text, maxLength = 180) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}...`;
}

function extractPrice(text) {
  const normalizeCurrency = (value) =>
    value
      .replace(/U\$S/gi, "USD")
      .replace(/U\$D/gi, "USD")
      .replace(/u\$s/gi, "USD")
      .replace(/u\$d/gi, "USD")
      .replace(/\s+/g, " ")
      .trim();

  const pricePatterns = [
    /(?:U\$D|USD|U\$S)\s*[0-9][0-9.,]*(?:\s*(?:mil|millones?))?/i,
    /valor[:\s]*((?:U\$D|USD|U\$S)\s*[0-9][0-9.,]*(?:\s*(?:mil|millones?))?)/i
  ];

  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match) {
      return normalizeCurrency(match[1] || match[0]);
    }
  }

  const fallback = text.match(/\b(?:U\$D|USD|U\$S)\b[\s:]*[0-9][0-9.,]*(?:\s*(?:mil|millones?))?/i);
  return fallback ? normalizeCurrency(fallback[0]) : "Consultar";
}

function extractArea(text) {
  const patterns = [
    /\b[0-9][0-9.,]*\s?(?:m²|m2)\b(?:\s*cubiertos?)?/i,
    /\b[0-9][0-9.,]*\s?ha\b/i,
    /\b[0-9][0-9.,]*\s?hect[aá]reas?\b/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0].replace(/\s+/g, " ").trim();
  }

  return "Superficie a confirmar";
}

function extractLocation(text, title) {
  const locationMatch = text.match(
    /Ubicaci[oó]n:\s*(.*?)(?=\s*(?:Superficie|Servicios|Caracter[ií]sticas|Valor|Frente|Distribuci[oó]n|Acceso|Amenities|Usos|FOS|FOT|Opcion|Opción|Capacidad|Terreno|Lote|Casa|Departamento|$))/i
  );
  if (locationMatch) {
    return locationMatch[1].replace(/\s+/g, " ").trim();
  }

  if (/miralejos/i.test(title)) return "Estancia Miralejos, San Martin de los Andes";
  if (/kaleuche/i.test(title)) return "Kaleuche, San Martin de los Andes";
  if (/vega/i.test(title)) return "Vega Maipu, San Martin de los Andes";

  return "San Martin de los Andes, Neuquen";
}

function buildCategory(text, styleColor) {
  if (styleColor === "ef5350") {
    return "alquiler_turistico";
  }

  if (styleColor === "000000") {
    return "vendido";
  }

  if (styleColor === "ab47bc") {
    return "venta";
  }

  if (styleColor === "ffee58") {
    return "proceso";
  }

  if (/tur[ií]stic|temporada|pax/i.test(text)) {
    return "alquiler_turistico";
  }

  if (/no se vende/i.test(text) || /ya se vend/i.test(text)) {
    return "vendido";
  }

  if (/antes del .*ingresa a la venta/i.test(text) || /valor cerrado/i.test(text)) {
    return "proceso";
  }

  return "venta";
}

function formatCoords(coords) {
  const [lat, lng] = coords;
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function parseKml(kmlText) {
  const styleColorMap = {};
  for (const match of kmlText.matchAll(
    /<gx:CascadingStyle kml:id="(__managed_style_[^"]+)_normal">[\s\S]*?<href>https:\/\/earth\.google\.com\/earth\/document\/icon\?color=([a-z0-9]+)/gi
  )) {
    const styleId = match[1];
    const color = match[2].toLowerCase();
    styleColorMap[styleId] = color;
  }

  const parser = new DOMParser();
  const xml = parser.parseFromString(kmlText, "application/xml");

  const placemarks = [...xml.querySelectorAll("Placemark")];

  return placemarks
    .map((placemark, index) => {
      const name = placemark.querySelector("name")?.textContent?.trim() || `Propiedad ${index + 1}`;
      const descriptionHtml = placemark.querySelector("description")?.textContent?.trim() || "";
      const coordinatesText = placemark.querySelector("coordinates")?.textContent?.trim() || "";
      const styleUrl = placemark.querySelector("styleUrl")?.textContent?.trim() || "";
      const styleColor = styleColorMap[styleUrl.replace(/^#/, "")] || "";
      const [lngText, latText] = coordinatesText.split(",");
      const lat = Number.parseFloat(latText);
      const lng = Number.parseFloat(lngText);
      const plainText = htmlToText(descriptionHtml);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
      }

      return {
        id: `${slugify(name)}-${index + 1}`,
        title: name,
        location: extractLocation(plainText, name),
        price: extractPrice(plainText),
        area: extractArea(plainText),
        category: buildCategory(plainText, styleColor),
        styleColor,
        coords: [lat, lng],
        descriptionHtml,
        summary: truncateText(plainText, 210),
        rawDescription: plainText
      };
    })
    .filter(Boolean);
}

function resolvePropertyImages(property) {
  const searchableText = `${property.title} ${property.location}`;
  const normalized = slugify(searchableText);

  const bestMatch = Object.entries(PROPERTY_IMAGE_LIBRARY).find(([folderSlug]) => {
    const tokens = folderSlug.split("-").filter((token) => token.length > 2);
    return tokens.every((token) => normalized.includes(token));
  });

  return bestMatch ? bestMatch[1] : [];
}

function resolvePropertyCoverImage(property) {
  const searchableText = `${property.title} ${property.location}`;
  const normalized = slugify(searchableText);

  const bestMatch = Object.entries(PROPERTY_COVER_IMAGE_LIBRARY).find(([folderSlug]) => {
    const tokens = folderSlug.split("-").filter((token) => token.length > 2);
    return tokens.every((token) => normalized.includes(token));
  });

  if (bestMatch) return bestMatch[1];
  return property.images?.[0] || "";
}

function MapFocus({ coords }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(coords, 13, { duration: 1.1 });
  }, [coords, map]);

  return null;
}

function App() {
  const [properties, setProperties] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [expandedGalleryId, setExpandedGalleryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const mapSectionRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function loadKml() {
      try {
        const response = await fetch(KML_URL);
        const text = await response.text();
      const parsed = parseKml(text).map((property) => ({
        ...property,
        images: resolvePropertyImages(property)
      }));

        if (!active) return;

        setProperties(parsed);
        setSelectedId(parsed[0]?.id || "");
      } catch (error) {
        if (!active) return;
        setProperties([]);
        setSelectedId("");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadKml();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!properties.length) return;
    const currentExists = properties.some((property) => property.id === selectedId);
    if (!currentExists) {
      setSelectedId(properties[0].id);
    }
  }, [properties, selectedId]);

  const visibleProperties = properties.filter((property) =>
    property.category === "venta" || property.category === "alquiler_turistico"
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

  const formatDisplayedPrice = (property) =>
    property?.category === "proceso" ? "Sin precio" : property?.price || "Consultar";

  const focusPropertyOnMap = (property) => {
    setSelectedId(property.id);
    mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const createWhatsAppLink = (property) => {
    const message = `Hola Denise, quiero informacion sobre: ${property.title} (${property.price}) en ${property.location}.`;
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
              className="status-pill status-pill--venta nav-service-link"
              onClick={() => setIsServicesModalOpen(true)}
            >
              Solicitar servicios
            </button>
          </div>
        </nav>

        <div className="hero-layout">
          <div className="hero-content">
            <p className="overline">
              {loading
                ? "Cargando archivo KML..."
                : `${visibleProperties.length} propiedades visibles`}
            </p>
            <h1>Propiedades reales en San Martin de los Andes, Patagonia.</h1>
            <p>
              Datos leidos desde <strong>PROPIEDADESVENTA.kml</strong> para mostrar ubicacion, precio y descripcion completa.
            </p>
            <p className="contact-line">
              WhatsApp: <strong>+54 9 2944 68-8613</strong>
            </p>
            <div className="legend">
              {["venta", "alquiler_turistico"].map((key) => {
                const meta = CATEGORY_META[key];
                return (
                  <span key={key} className={`legend-pill legend-pill--${key}`}>
                    {meta.label}
                  </span>
                );
              })}
            </div>
            <a className="cta" href="#propiedades">
              Explorar propiedades
            </a>
          </div>

          <section className="map-section hero-map-section" id="mapa" ref={mapSectionRef}>
            <div className="section-title map-section-header">
              <div>
                <p>Geolocalizacion</p>
                <h2>Plano de ubicaciones</h2>
              </div>
              <a className="map-btn header-map-btn" href="#propiedades">Ver propiedades</a>
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
                          color: CATEGORY_META[property.category]?.mapColor || "#a65774",
                          fillColor: CATEGORY_META[property.category]?.mapColor || "#a65774",
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
                    <span>Precio</span>
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
        <section className="properties" id="propiedades">
          <div className="section-title">
            <p>Coleccion real</p>
            <h2>Propiedades desde el KML</h2>
          </div>

          {loading ? (
            <p className="loading-state">Leyendo las propiedades reales...</p>
          ) : (
            <div className="property-grid">
              {visibleProperties.map((property) => (
                <article
                  className={`property-card ${property.id === selectedProperty?.id ? "active" : ""}`}
                  key={property.id}
                >
                  <button
                    type="button"
                    className="property-cover"
                    style={
                      property.images.length
                        ? {
                            backgroundImage: `linear-gradient(180deg, rgba(22,22,22,0.15), rgba(22,22,22,0.75)), url(${resolvePropertyCoverImage(property)})`
                          }
                        : undefined
                    }
                    onClick={() =>
                      setExpandedGalleryId((currentId) =>
                        currentId === property.id ? "" : property.id
                      )
                    }
                  >
                    <p className={`status-pill status-pill--${property.category}`}>
                      {CATEGORY_META[property.category]?.label || "En venta"}
                    </p>
                    <h3>{property.title}</h3>
                    <p className="cover-location">{property.location}</p>
                  </button>

                  <div className="property-body">
                    <div className="cover-metrics cover-metrics--card">
                      <div>
                        <span>Precio</span>
                        <strong>{formatDisplayedPrice(property)}</strong>
                      </div>
                      <div>
                        <span>Superficie</span>
                        <strong>{property.area}</strong>
                      </div>
                      <div>
                        <span>Geo</span>
                        <strong>{formatCoords(property.coords)}</strong>
                      </div>
                    </div>
                    {property.images.length > 1 && expandedGalleryId === property.id ? (
                      <div className="property-gallery property-gallery--card">
                        {property.images.slice(1).map((imageUrl) => (
                          <a href={imageUrl} target="_blank" rel="noreferrer" key={imageUrl}>
                            <img src={imageUrl} alt={`Foto de ${property.title}`} loading="lazy" />
                          </a>
                        ))}
                      </div>
                    ) : null}
                    <div className="card-actions">
                      <button
                        type="button"
                        onClick={() => focusPropertyOnMap(property)}
                        className="map-btn"
                      >
                        Ver en mapa
                      </button>
                      <a
                        href={createWhatsAppLink(property)}
                        target="_blank"
                        rel="noreferrer"
                        className="wa-btn"
                      >
                        Contactar por WhatsApp
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

      </main>
      {isServicesModalOpen ? (
        <div className="services-modal-backdrop" onClick={() => setIsServicesModalOpen(false)}>
          <section
            className="services-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="services-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="services-modal-close"
              onClick={() => setIsServicesModalOpen(false)}
              aria-label="Cerrar modal de servicios"
            >
              ×
            </button>
            <div className="section-title">
              <p>Carta de presentación</p>
              <h2 id="services-modal-title">Servicios inmobiliarios para tu próximo paso</h2>
            </div>
            <p className="services-intro">
              Te acompañamos con estrategia comercial, tasación y difusión para que puedas vender,
              alquilar o invertir con respaldo profesional en San Martín de los Andes y Patagonia.
            </p>
            <div className="services-actions">
              <p className="services-label">Quiero solicitar el servicio de:</p>
              <div className="services-quick-links">
                {["vender", "alquilar", "invertir", "otros"].map((need) => (
                  <a
                    key={need}
                    href={`https://wa.me/${officeWhatsApp}?text=${encodeURIComponent(
                      `Hola Denise, quiero solicitar tus servicios. Mi necesidad es: ${need}.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="wa-btn"
                  >
                    {need.charAt(0).toUpperCase() + need.slice(1)}
                  </a>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default App;
