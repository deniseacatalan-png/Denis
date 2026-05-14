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

const KML_URL = "/webpropiedades.kml";
const officeWhatsApp = "5492944688613";
const PUBLIC_IMAGE_FILES = import.meta.glob(
  "../public/images/**/*.{jpg,JPG,jpeg,JPEG,png,PNG,webp,WEBP,avif,AVIF}",
  { eager: true, import: "default", query: "?url" }
);

const PROPERTY_IMAGE_LIBRARY = Object.entries(PUBLIC_IMAGE_FILES).reduce((acc, [filePath, fileUrl]) => {
  const normalizedPath = filePath.replace(/\\/g, "/");
  const folderName = normalizedPath.split("/").at(-2) || "";
  const folderSlug = slugify(folderName);

  if (!folderSlug) return acc;
  if (!acc[folderSlug]) acc[folderSlug] = [];
  acc[folderSlug].push(fileUrl);
  return acc;
}, {});

function isExcludedProperty(name, styleColor) {
  return (styleColor || "").toLowerCase() === "000000";
}

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
    label: "En proceso / sin valor",
    color: "#c9a227",
    mapColor: "#c9a227"
  }
};

function slugify(value, maxLength = Number.POSITIVE_INFINITY) {
  const normalized = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return Number.isFinite(maxLength) ? normalized.slice(0, maxLength) : normalized;
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


const AREA_OVERRIDES = {
  "HAS ORILLAS DE CALEUFU": "13.000 m²",
  "LOTES KALEUCHE ALTO": "700 m²",
  "LOTE CJN BELLO": "800 m²",
  "LOTE ALIHUEN ALTO": "1.700 m²",
  "LOTE KALEUCHE MEDIO": "1.135 m²",
  "LOTE VEGA MAIPU": "1.178 m²",
  "LOTE ZONA CENTRO": "229,52 m²",
  "LOTE 102, ESTANCIA MIRALEJOS CLUB DE CAMPO": "6.849 m²",
  "LOTE 42, ESTANCIA MIRALEJOS CLUB DE CAMPO": "2.507 m²"
};

function resolveArea(title, text) {
  if (AREA_OVERRIDES[title]) return AREA_OVERRIDES[title];
  return extractArea(text);
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

function normalizeKmlColor(styleColor, fallback = "#a65774") {
  const color = (styleColor || "").replace(/[^a-f0-9]/gi, "").toLowerCase();
  if (!color) return fallback;

  if (color.length === 6) return `#${color}`;
  if (color.length === 8) {
    const rr = color.slice(6, 8);
    const gg = color.slice(4, 6);
    const bb = color.slice(2, 4);
    return `#${rr}${gg}${bb}`;
  }

  return fallback;
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

      if (isExcludedProperty(name, styleColor)) {
        return null;
      }

      const inferredCategory = buildCategory(plainText, styleColor);
      const isHuilquilTouristic = /huilquil\s+casona?\s+de\s+montaña/i.test(name);

      return {
        id: `${slugify(name, 48)}-${index + 1}`,
        title: name,
        location: extractLocation(plainText, name),
        price: extractPrice(plainText),
        area: resolveArea(name, plainText),
        category: isHuilquilTouristic
          ? "alquiler_turistico"
          : inferredCategory === "alquiler_turistico"
            ? "venta"
            : inferredCategory,
        styleColor,
        markerColor: normalizeKmlColor(styleColor),
        coords: [lat, lng],
        descriptionHtml,
        summary: truncateText(plainText, 210),
        rawDescription: plainText
      };
    })
    .filter(Boolean);
}

function resolvePropertyImages(property) {
  const normalizedTitle = slugify(property.title || "");
  const normalizedLocation = slugify(property.location || "");
  const titleTokens = normalizedTitle.split("-").filter((token) => token.length > 1);
  const locationTokens = normalizedLocation.split("-").filter((token) => token.length > 2);

  let bestScore = 0;
  let bestImages = [];

  if (PROPERTY_IMAGE_LIBRARY[normalizedTitle]) {
    return PROPERTY_IMAGE_LIBRARY[normalizedTitle];
  }

  for (const [folderSlug, images] of Object.entries(PROPERTY_IMAGE_LIBRARY)) {
    const folderTokens = folderSlug.split("-").filter((token) => token.length > 1);
    const titleHits = folderTokens.filter((token) => titleTokens.includes(token)).length;
    const locationHits = folderTokens.filter((token) => locationTokens.includes(token)).length;
    const score = titleHits * 3 + locationHits;

    const hasStrongTitleMatch = titleHits >= 2 || normalizedTitle.includes(folderSlug);

    if (hasStrongTitleMatch && score > bestScore) {
      bestScore = score;
      bestImages = images;
    }
  }

  return bestImages;
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

function App() {
  const [properties, setProperties] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [expandedGalleryId, setExpandedGalleryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [serviceNeed, setServiceNeed] = useState("vender");
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const mapSectionRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function loadKml() {
      try {
        const response = await fetch(`${KML_URL}?v=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`No se pudo cargar ${KML_URL}`);
        }
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
    property?.category === "proceso" ? "Sin valor" : property?.price || "Consultar";

  const focusPropertyOnMap = (property) => {
    setSelectedId(property.id);
    mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
            <h1>Propiedades reales en San Martin de los Andes, Patagonia.</h1>
            <p>
              Datos leidos desde <strong>webpropiedades.kml</strong> para mostrar ubicacion, valor y descripcion completa.
            </p>
            <p className="contact-line">
              WhatsApp: <strong>+54 9 2944 68-8613</strong>
            </p>
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
        <section className="properties" id="propiedades">
          <div className="section-title">
            <h2>PROPIEDADES</h2>
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
                        <span>Valor</span>
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

export default App;
