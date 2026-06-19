"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  CircleMarker,
  Marker,
  TileLayer,
  useMap,
  useMapEvents
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import logoMark from "../ISO GRAFITO.png";
import AppNavbar from "./components/AppNavbar";
import { publicNavbarItems } from "./components/AppNavbarConfig";
import Slider from "./components/Slider";
import {
  CATEGORY_META,
  findPropertyByPublicPath,
  formatPrice,
  formatPricePerM2,
  getPublicSelectedPropertyId,
  getVisiblePublicProperties,
  getCategoryMapColor,
  propertyShareData,
  propertyPublicPath
} from "./utils/properties";

function assetUrl(asset) {
  return typeof asset === "string" ? asset : asset?.src || "";
}

const logoMarkUrl = assetUrl(logoMark);

L.Icon.Default.mergeOptions({
  iconRetinaUrl: assetUrl(markerIcon2x),
  iconUrl: assetUrl(markerIcon),
  shadowUrl: assetUrl(markerShadow)
});

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

const SERVICE_OPTIONS = [
  {
    value: "vender",
    icon: "sale",
    label: "Vender",
    description: "Quiero vender una propiedad."
  },
  {
    value: "alquilar",
    icon: "rent",
    label: "Alquilar",
    description: "Quiero alquilar o publicar un alquiler."
  },
  {
    value: "invertir",
    icon: "investment",
    label: "Invertir",
    description: "Busco oportunidades para invertir."
  },
  {
    value: "otros",
    icon: "custom",
    label: "Otros",
    description: "Necesito una consulta personalizada."
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

const DEFAULT_MAP_CENTER = [-40.1573, -71.3524];

function hasValidPropertyCoords(property) {
  const [lat, lng] = property?.coords || [];
  return Number.isFinite(lat) && Number.isFinite(lng);
}

function formatCoords(coords) {
  const [lat, lng] = coords;
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function getVideoSourceLabel(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
    if (host === "youtu.be" || host.endsWith("youtube.com")) return "YouTube";
    if (host.endsWith("instagram.com")) return "Instagram Reels";
  } catch {
    return "Video";
  }

  return "Video";
}

function getVideoEmbedData(url) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./i, "").toLowerCase();

    if (hostname === "youtu.be") {
      const videoId = parsedUrl.pathname.split("/").filter(Boolean)[0];
      return videoId ? { source: "YouTube", embedUrl: `https://www.youtube.com/embed/${videoId}` } : null;
    }

    if (hostname.endsWith("youtube.com")) {
      const videoId = parsedUrl.searchParams.get("v") || parsedUrl.pathname.split("/").filter(Boolean)[1];
      return videoId ? { source: "YouTube", embedUrl: `https://www.youtube.com/embed/${videoId}` } : null;
    }

    if (hostname.endsWith("instagram.com")) {
      return {
        source: "Instagram Reels",
        embedUrl: parsedUrl.href
      };
    }
  } catch {
    return null;
  }

  return null;
}

function escapeMarkerText(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeMarkerColor(category) {
  return getCategoryMapColor(category);
}

function normalizeMapSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function propertyMatchesMapSearch(property, query) {
  const tokens = normalizeMapSearchText(query).split(" ").filter(Boolean);
  if (!tokens.length) return true;

  const categoryLabel = CATEGORY_META[property.category]?.label || "";
  const searchText = normalizeMapSearchText([
    property.title,
    property.slug,
    property.location,
    property.price,
    property.area,
    property.summary,
    categoryLabel
  ].join(" "));

  return tokens.every((token) => searchText.includes(token));
}

function filterMapPropertiesBySearch(properties, query) {
  return properties.filter((property) => propertyMatchesMapSearch(property, query));
}

function resolvePropertyCoverImage(property) {
  return property.images?.[0] || "";
}

function HeroSlider({ images = [], alt = "" }) {
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const total = images.length;

  useEffect(() => {
    setActiveIndex(0);
    if (trackRef.current) trackRef.current.scrollLeft = 0;
  }, [images]);

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const next = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
    setActiveIndex(Math.min(Math.max(next, 0), total - 1));
  };

  const goTo = (index) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.min(Math.max(index, 0), total - 1);
    track.scrollTo({ left: track.clientWidth * clamped, behavior: "smooth" });
  };

  if (!total) return null;

  return (
    <div className="hero-slider">
      <div className="hero-slider-track" ref={trackRef} onScroll={handleScroll}>
        {images.map((src, index) => (
          <img
            key={src}
            src={src}
            alt={`${alt} — foto ${index + 1}`}
            draggable={false}
          />
        ))}
      </div>
      {total > 1 ? (
        <>
          <button
            type="button"
            className="hero-slider-nav hero-slider-nav--prev"
            onClick={() => goTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label="Foto anterior"
          >
            ‹
          </button>
          <button
            type="button"
            className="hero-slider-nav hero-slider-nav--next"
            onClick={() => goTo(activeIndex + 1)}
            disabled={activeIndex >= total - 1}
            aria-label="Foto siguiente"
          >
            ›
          </button>
          <div className="hero-slider-dots">
            {images.map((src, index) => (
              <button
                key={src}
                type="button"
                className={`hero-slider-dot ${index === activeIndex ? "active" : ""}`}
                onClick={() => goTo(index)}
                aria-label={`Foto ${index + 1}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function ImageLightbox({ images = [], initialIndex = 0, alt = "", onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const total = images.length;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight" && currentIndex < total - 1) setCurrentIndex(currentIndex + 1);
      if (event.key === "ArrowLeft" && currentIndex > 0) setCurrentIndex(currentIndex - 1);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [currentIndex, total, onClose]);

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-content" onClick={(event) => event.stopPropagation()}>
        <img src={images[currentIndex]} alt={`${alt} — foto ${currentIndex + 1}`} />
        <div className="lightbox-counter">{currentIndex + 1} / {total}</div>
        {total > 1 ? (
          <>
            <button
              type="button"
              className="lightbox-nav lightbox-nav--prev"
              onClick={() => setCurrentIndex(currentIndex - 1)}
              disabled={currentIndex === 0}
              aria-label="Foto anterior"
            >
              ‹
            </button>
            <button
              type="button"
              className="lightbox-nav lightbox-nav--next"
              onClick={() => setCurrentIndex(currentIndex + 1)}
              disabled={currentIndex >= total - 1}
              aria-label="Foto siguiente"
            >
              ›
            </button>
          </>
        ) : null}
        <button type="button" className="lightbox-close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
      </div>
    </div>
  );
}

function MapFocus({ coords }) {
  const map = useMap();
  const [lat, lng] = coords;

  useEffect(() => {
    map.flyTo([lat, lng], 13, { duration: 1.1 });
  }, [lat, lng, map]);

  return null;
}

function MapClickReset({ onClear }) {
  useMapEvents({
    click: (event) => {
      const clickTarget = event.originalEvent?.target;

      if (clickTarget?.closest?.(".leaflet-interactive")) {
        return;
      }

      onClear();
    }
  });

  return null;
}

function MapAutoViewport({ properties, focusProperty }) {
  const map = useMap();
  const boundsKey = properties
    .map((property) => `${property.id}:${property.coords?.[0]},${property.coords?.[1]}`)
    .join("|");
  const focusKey = focusProperty?.id || "";

  useEffect(() => {
    if (focusProperty && hasValidPropertyCoords(focusProperty)) {
      map.flyTo(focusProperty.coords, 14, { duration: 0.8 });
      return;
    }

    const coords = properties.filter(hasValidPropertyCoords).map((property) => property.coords);

    if (!coords.length) {
      map.setView(DEFAULT_MAP_CENTER, 12);
      return;
    }

    if (coords.length === 1) {
      map.flyTo(coords[0], 13, { duration: 0.8 });
      return;
    }

    map.fitBounds(L.latLngBounds(coords), {
      padding: [74, 74],
      maxZoom: 13
    });
  }, [boundsKey, focusKey, focusProperty, map, properties]);

  return null;
}

function PriceMapMarker({ property, isActive, displayedPrice, onHover, onClick }) {
  const markerColor = safeMarkerColor(property.category);
  const markerHtml = useMemo(() => {
    const activeClass = isActive ? " map-price-marker--active" : "";
    return `
      <span class="map-price-marker${activeClass}" style="--marker-color: ${markerColor};">
        <span class="map-price-marker-dot" aria-hidden="true"></span>
        <span class="map-price-marker-label">${escapeMarkerText(displayedPrice)}</span>
      </span>
    `;
  }, [displayedPrice, isActive, markerColor]);
  const markerIcon = useMemo(
    () =>
      L.divIcon({
        className: "map-price-marker-icon",
        html: markerHtml,
        iconSize: [172, 34],
        iconAnchor: [10, 17]
      }),
    [markerHtml]
  );

  return (
    <Marker
      position={property.coords}
      icon={markerIcon}
      title={`${property.title} - ${displayedPrice}`}
      zIndexOffset={isActive ? 1000 : 0}
      eventHandlers={{
        mouseover: () => onHover(property),
        click: () => onClick(property)
      }}
    />
  );
}

function ServiceOptionVisual({ icon }) {
  const iconClassName = `service-option-visual service-option-visual--${icon}`;

  if (icon === "rent") {
    return (
      <span className={iconClassName} aria-hidden="true">
        <svg viewBox="0 0 48 48" focusable="false">
          <path d="M17 27.5a9.5 9.5 0 1 1 6.7-2.8L40 41l-4 4-5-5-4 4-4-4 4-4-6.7-6.7a9.4 9.4 0 0 1-3.3.2Z" />
          <circle cx="16" cy="16" r="3.5" />
          <path d="M30 14h9v19" />
          <path d="M33 33h12" />
        </svg>
      </span>
    );
  }

  if (icon === "investment") {
    return (
      <span className={iconClassName} aria-hidden="true">
        <svg viewBox="0 0 48 48" focusable="false">
          <path d="M8 39h34" />
          <path d="M12 34l8-9 7 5 11-15" />
          <path d="M31 15h7v7" />
          <circle cx="15" cy="17" r="6" />
          <path d="M15 13v8" />
          <path d="M12 17h6" />
        </svg>
      </span>
    );
  }

  if (icon === "custom") {
    return (
      <span className={iconClassName} aria-hidden="true">
        <svg viewBox="0 0 48 48" focusable="false">
          <path d="M9 13h24a6 6 0 0 1 6 6v7a6 6 0 0 1-6 6H21l-9 7v-7H9a6 6 0 0 1-6-6v-7a6 6 0 0 1 6-6Z" />
          <path d="M17 10h22a6 6 0 0 1 6 6v8a6 6 0 0 1-4 5.7" />
          <path d="M13 23h1" />
          <path d="M21 23h1" />
          <path d="M29 23h1" />
        </svg>
      </span>
    );
  }

  return (
    <span className={iconClassName} aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false">
        <path d="M8 24 24 11l16 13" />
        <path d="M13 23v18h22V23" />
        <path d="M20 41V30h8v11" />
        <path d="M31 13h7v13" />
        <path d="M8 10h13v9H8z" />
        <path d="M11 14h7" />
        <path d="M11 17h4" />
      </svg>
    </span>
  );
}

function MapPropertyPreview({ property, isPinned, displayedPrice, onPreviewClick }) {
  const pricePerM2 = property.category === "venta" ? formatPricePerM2(property) : null;

  return (
    <article
      className={`map-property-preview ${isPinned ? "map-property-preview--pinned" : ""}`}
      data-property-id={property.id}
      role="button"
      tabIndex={0}
      onClick={(event) => {
        event.stopPropagation();
        onPreviewClick();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onPreviewClick();
        }
      }}
    >
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
          <dd>{displayedPrice}</dd>
        </div>
        <div>
          <dt>Superficie</dt>
          <dd>{property.area}</dd>
        </div>
        {pricePerM2 ? (
          <div>
            <dt>Precio/m²</dt>
            <dd>{pricePerM2}</dd>
          </div>
        ) : null}
      </dl>
      <small>{isPinned ? "Click para ver la propiedad" : "Click para fijar la propiedad"}</small>
    </article>
  );
}

function PropertySliderDivider() {
  return (
    <div className="property-slider-divider" aria-hidden="true">
      <span className="property-slider-divider-line" />
      <span className="property-slider-divider-mark" />
      <span className="property-slider-divider-line" />
    </div>
  );
}

function PublicApp({ initialProperties = [] }) {
  const [properties, setProperties] = useState(() => initialProperties);
  const [selectedId, setSelectedId] = useState("");
  const [pinnedPropertyId, setPinnedPropertyId] = useState("");
  const [hoveredPropertyId, setHoveredPropertyId] = useState("");
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [loading, setLoading] = useState(() => !initialProperties.length);
  const [loadError, setLoadError] = useState("");
  const [rentalSearch, setRentalSearch] = useState(INITIAL_RENTAL_SEARCH);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [currentPathname, setCurrentPathname] = useState(() => window.location.pathname);
  const [shareFeedback, setShareFeedback] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const shareFeedbackTimerRef = useRef(0);

  useEffect(() => {
    let active = true;

    async function loadProperties() {
      try {
        const response = await fetch("/api/properties/public");
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.error || "No pudimos cargar las propiedades desde la base de datos.");
        }

        const parsed = (payload.properties || []).map((property) => ({
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
    return () => {
      if (shareFeedbackTimerRef.current) {
        window.clearTimeout(shareFeedbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!properties.length) return;
    const currentExists = properties.some((property) => property.id === selectedId);
    if (!currentExists) {
      setSelectedId(properties[0].id);
    }

    if (pinnedPropertyId && !properties.some((property) => property.id === pinnedPropertyId)) {
      setPinnedPropertyId("");
    }

    if (hoveredPropertyId && !properties.some((property) => property.id === hoveredPropertyId)) {
      setHoveredPropertyId("");
    }
  }, [properties, selectedId, pinnedPropertyId, hoveredPropertyId]);

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
  const routedPropertyPricePerM2 =
    routedProperty && routedProperty.category === "venta" ? formatPricePerM2(routedProperty) : null;
  const selectedProperty =
    routedProperty || visibleProperties.find((property) => property.id === selectedId) || visibleProperties[0] || null;
  const activeMapPropertyId = pinnedPropertyId || hoveredPropertyId || selectedProperty?.id || "";
  const mapPreviewPropertyId = pinnedPropertyId || hoveredPropertyId;
  const mapPreviewProperty =
    visibleProperties.find((property) => property.id === mapPreviewPropertyId) || null;
  const isMapPreviewPinned = Boolean(mapPreviewProperty && mapPreviewProperty.id === pinnedPropertyId);

  useEffect(() => {
    if (routedProperty && routedProperty.id !== selectedId) {
      setSelectedId(routedProperty.id);
    }
  }, [routedProperty, selectedId]);

  useEffect(() => {
    const hasInstagramVideo = routedProperty?.videos?.some((videoUrl) => {
      try {
        return new URL(videoUrl).hostname.replace(/^www\./i, "").toLowerCase().endsWith("instagram.com");
      } catch {
        return false;
      }
    });

    if (!hasInstagramVideo) return;

    if (!document.querySelector('script[src="https://www.instagram.com/embed.js"]')) {
      const script = document.createElement("script");
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const timer = window.setTimeout(() => {
      window.instgrm?.Embeds?.process?.();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [routedProperty?.videos, currentPathname]);

  const formatDisplayedPrice = (property) => {
    if (property?.category === "proceso") return "Sin valor";
    return formatPrice(property?.priceAmount, property?.currency) || property?.price || "Consultar";
  };

  const getPropertyIntro = (property) =>
    property.summary || property.location || "Conoce todos los detalles de esta propiedad.";

  const getPropertiesByCategory = (category) =>
    visibleProperties.filter((property) => property.category === category);
  const sliderGroupsWithProperties = PROPERTY_SLIDER_GROUPS.map((group) => ({
    ...group,
    properties: getPropertiesByCategory(group.category)
  }))
    .filter((group) => group.properties.length)
    .sort((firstGroup, secondGroup) => {
      const firstGroupIndex = visibleProperties.findIndex(
        (property) => property.id === firstGroup.properties[0]?.id
      );
      const secondGroupIndex = visibleProperties.findIndex(
        (property) => property.id === secondGroup.properties[0]?.id
      );

      return firstGroupIndex - secondGroupIndex;
    });

  const selectPropertyOnMap = (property) => {
    setSelectedId(property.id);
    setPinnedPropertyId(property.id);
    setHoveredPropertyId(property.id);
    navigateToPath("/map");
  };

  const navigateToPath = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
    setCurrentPathname(path);
    window.scrollTo({ left: 0, top: 0, behavior: "auto" });
  };

  const handlePublicNavbarItemSelect = (item) => {
    if (item.action === "navigateHome") {
      navigateToPath("/");
    }

    if (item.action === "openService") {
      setIsServiceModalOpen(true);
    }
  };

  const openPropertyPage = (property) => {
    setSelectedId(property.id);
    setPinnedPropertyId("");
    setHoveredPropertyId("");
    navigateToPath(propertyPublicPath(property));
  };

  const pinPropertyPreview = (property) => {
    setPinnedPropertyId(property.id);
    setHoveredPropertyId(property.id);
  };

  const updateFullscreenMapSearch = (value) => {
    setMapSearchQuery(value);
    setPinnedPropertyId("");
    setHoveredPropertyId("");
  };

  const focusFullscreenMapProperty = (property) => {
    setSelectedId(property.id);
    pinPropertyPreview(property);
  };

  const clearMapPropertyPreview = () => {
    setPinnedPropertyId("");
    setHoveredPropertyId("");
  };

  const handleMapPreviewClick = (property) => {
    if (property.id === pinnedPropertyId) {
      openPropertyPage(property);
      return;
    }

    pinPropertyPreview(property);
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

  const showShareFeedback = (message) => {
    setShareFeedback(message);
    if (shareFeedbackTimerRef.current) {
      window.clearTimeout(shareFeedbackTimerRef.current);
    }
    shareFeedbackTimerRef.current = window.setTimeout(() => setShareFeedback(""), 2400);
  };

  const copyPropertyShareUrl = async (url) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = url;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  };

  const handleShareProperty = async (property) => {
    const shareData = propertyShareData(property, window.location.origin);

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }

    try {
      await copyPropertyShareUrl(shareData.url);
      showShareFeedback("Link copiado");
    } catch (error) {
      showShareFeedback("No pudimos copiar el link");
    }
  };

  const createServiceWhatsAppLink = (need) => {
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
        <button
          type="button"
          className="service-modal-close"
          onClick={() => setIsServiceModalOpen(false)}
          aria-label="Cerrar"
        >
          ×
        </button>
        <h3 id="service-modal-title" className="services-label">Quiero solicitar el servicio de:</h3>
        <div className="service-option-grid" aria-labelledby="service-modal-title">
          {SERVICE_OPTIONS.map((option) => (
            <a
              key={option.value}
              className="service-option-card"
              href={createServiceWhatsAppLink(option.value)}
              target="_blank"
              rel="noreferrer"
              aria-label={`Solicitar servicio de ${option.label} por WhatsApp`}
              onClick={() => setIsServiceModalOpen(false)}
            >
              <ServiceOptionVisual icon={option.icon} />
              <span className="service-option-copy">
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  ) : null;

  const normalizedPathname = currentPathname.replace(/\/+$/, "") || "/";
  const isFullscreenMapRoute = normalizedPathname === "/map";
  const fullscreenMapProperties = useMemo(
    () => filterMapPropertiesBySearch(visibleProperties, mapSearchQuery),
    [mapSearchQuery, visibleProperties]
  );
  const fullscreenMapPropertiesWithCoords = useMemo(
    () => fullscreenMapProperties.filter(hasValidPropertyCoords),
    [fullscreenMapProperties]
  );
  const fullscreenMapPreviewProperty =
    fullscreenMapPropertiesWithCoords.find((property) => property.id === (pinnedPropertyId || hoveredPropertyId)) ||
    null;
  const fullscreenActiveMapPropertyId =
    fullscreenMapPreviewProperty?.id ||
    (fullscreenMapPropertiesWithCoords.some((property) => property.id === selectedId) ? selectedId : "");
  const fullscreenMapCenter = fullscreenMapPropertiesWithCoords[0]?.coords || DEFAULT_MAP_CENTER;
  const fullscreenResultLabel = loading
    ? "Cargando propiedades..."
    : `${fullscreenMapProperties.length} ${
        fullscreenMapProperties.length === 1 ? "propiedad encontrada" : "propiedades encontradas"
      }`;

  if (isFullscreenMapRoute) {
    return (
      <div className="page-shell fullscreen-map-shell">
        <main className="fullscreen-map-main" aria-label="Mapa de propiedades en pantalla completa">
          <div className="fullscreen-map-toolbar">
            <button
              type="button"
              className="fullscreen-map-brand"
              onClick={() => navigateToPath("/")}
              aria-label="Volver al inicio"
            >
              <img src={logoMarkUrl} alt="Logo Denise Catalán" />
              <span>Mapa de propiedades</span>
            </button>

            <form className="fullscreen-map-search" onSubmit={(event) => event.preventDefault()}>
              <label htmlFor="fullscreen-property-search">Buscar propiedad</label>
              <div className="fullscreen-map-search-control">
                <input
                  id="fullscreen-property-search"
                  type="search"
                  value={mapSearchQuery}
                  onChange={(event) => updateFullscreenMapSearch(event.target.value)}
                  placeholder="Nombre, zona, precio o categoría"
                  autoComplete="off"
                />
                {mapSearchQuery ? (
                  <button
                    type="button"
                    className="fullscreen-map-clear"
                    onClick={() => updateFullscreenMapSearch("")}
                    aria-label="Limpiar búsqueda"
                  >
                    ×
                  </button>
                ) : null}
              </div>
              <span className="fullscreen-map-count" role="status">
                {fullscreenResultLabel}
              </span>

              {mapSearchQuery ? (
                <div className="fullscreen-map-results" role="listbox" aria-label="Resultados de propiedades">
                  {fullscreenMapPropertiesWithCoords.length ? (
                    fullscreenMapPropertiesWithCoords.slice(0, 6).map((property) => (
                      <button
                        type="button"
                        key={property.id}
                        onClick={() => focusFullscreenMapProperty(property)}
                        role="option"
                        aria-selected={property.id === fullscreenActiveMapPropertyId}
                      >
                        <strong>{property.title}</strong>
                        <span>{formatDisplayedPrice(property)} · {property.location}</span>
                      </button>
                    ))
                  ) : (
                    <p>No encontramos propiedades para esa búsqueda.</p>
                  )}
                </div>
              ) : null}
            </form>

            <a
              href="/"
              className="map-btn fullscreen-map-home"
              onClick={(event) => {
                event.preventDefault();
                navigateToPath("/");
              }}
            >
              Volver
            </a>
          </div>

          <section className="fullscreen-map-canvas" aria-label="Mapa con precios de propiedades">
            <MapContainer
              center={fullscreenMapCenter}
              zoom={12}
              scrollWheelZoom={true}
              className="map-view fullscreen-map-view"
            >
              <MapAutoViewport
                properties={fullscreenMapPropertiesWithCoords}
                focusProperty={fullscreenMapPreviewProperty}
              />
              <MapClickReset onClear={clearMapPropertyPreview} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {fullscreenMapPropertiesWithCoords.map((property) => (
                <PriceMapMarker
                  key={property.id}
                  property={property}
                  isActive={property.id === fullscreenActiveMapPropertyId}
                  displayedPrice={formatDisplayedPrice(property)}
                  onHover={(hoveredProperty) => setHoveredPropertyId(hoveredProperty.id)}
                  onClick={focusFullscreenMapProperty}
                />
              ))}
            </MapContainer>

            {!fullscreenMapPropertiesWithCoords.length ? (
              <div className="fullscreen-map-empty">
                <p>{loading ? "Cargando mapa..." : "No hay propiedades para mostrar en el mapa."}</p>
              </div>
            ) : null}

            {loadError ? (
              <p className="fullscreen-map-status" role="alert">
                {loadError}
              </p>
            ) : null}

            {fullscreenMapPreviewProperty ? (
              <div
                className={`map-preview-overlay ${
                  fullscreenMapPreviewProperty.id === pinnedPropertyId ? "map-preview-overlay--pinned" : ""
                }`}
              >
                <MapPropertyPreview
                  property={fullscreenMapPreviewProperty}
                  isPinned={fullscreenMapPreviewProperty.id === pinnedPropertyId}
                  displayedPrice={formatDisplayedPrice(fullscreenMapPreviewProperty)}
                  onPreviewClick={() => handleMapPreviewClick(fullscreenMapPreviewProperty)}
                />
              </div>
            ) : null}
            <div className="map-legend">
              <div className="map-legend-item">
                <span className="map-legend-dot" style={{ background: CATEGORY_META.venta.mapColor }} />
                <span>Venta</span>
              </div>
              <div className="map-legend-item">
                <span className="map-legend-dot" style={{ background: CATEGORY_META.alquiler_turistico.mapColor }} />
                <span>Alq. turístico</span>
              </div>
              <div className="map-legend-item">
                <span className="map-legend-dot" style={{ background: CATEGORY_META.alquiler_permanente.mapColor }} />
                <span>Alq. permanente</span>
              </div>
            </div>
          </section>
        </main>
        {serviceModal}
      </div>
    );
  }

  if (isPropertyRoute) {
    return (
      <div className="page-shell property-page-shell">
        <AppNavbar
          logoUrl={logoMarkUrl}
          onBrandClick={() => navigateToPath("/")}
          items={publicNavbarItems({ isPropertyRoute: true, currentPathname })}
          onItemSelect={handlePublicNavbarItemSelect}
        />

        <main className="property-page-main">
          {loading ? (
            <p className="loading-state">Leyendo la propiedad...</p>
          ) : loadError ? (
            <p className="loading-state">{loadError}</p>
          ) : routedProperty ? (
            <>
            <article className="property-page-detail">
              <div className="property-detail-hero property-page-hero">
                <HeroSlider
                  images={routedProperty.images || []}
                  alt={routedProperty.title}
                />
                <div className="property-detail-hero-text">
                  <p className="property-detail-category-label">
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
                    <span>{routedPropertyPricePerM2 ? "Precio/m²" : "Geo"}</span>
                    <strong>{routedPropertyPricePerM2 || formatCoords(routedProperty.coords)}</strong>
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
                    {routedProperty.images.map((imageUrl, index) => (
                      <button
                        type="button"
                        className="gallery-photo-button"
                        key={imageUrl}
                        onClick={() => setLightboxIndex(index)}
                      >
                        <img src={imageUrl} alt={`Foto de ${routedProperty.title}`} loading="lazy" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="gallery-empty">Esta propiedad todavia no tiene fotos cargadas.</p>
                )}

                {routedProperty.videos?.length ? (
                  <section className="property-detail-videos" aria-labelledby="property-detail-videos-title">
                    <div className="property-detail-videos-header">
                      <h2 id="property-detail-videos-title">Videos</h2>
                      <p>Videos embebidos para ver recorridos y reels de la propiedad.</p>
                    </div>
                    <div className="property-detail-videos-list">
                      {routedProperty.videos.map((videoUrl, index) => {
                        const embedData = getVideoEmbedData(videoUrl);

                        if (!embedData?.embedUrl) {
                          return (
                            <a
                              key={`${videoUrl}-${index}`}
                              href={videoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="property-detail-video-link"
                            >
                              <strong>{getVideoSourceLabel(videoUrl)}</strong>
                              <span>Ver video {index + 1}</span>
                            </a>
                          );
                        }

                        if (embedData.source === "Instagram Reels") {
                          return (
                            <article
                              key={`${videoUrl}-${index}`}
                              className="property-detail-video-card property-detail-instagram-card"
                            >
                              <div className="property-detail-instagram-header">
                                <div className="property-detail-instagram-brand">
                                  <span className="property-detail-instagram-mark" aria-hidden="true">
                                    IG
                                  </span>
                                  <div>
                                    <strong>Instagram Reel</strong>
                                    <span>Reel de la propiedad</span>
                                  </div>
                                </div>
                                <a
                                  href={videoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="property-detail-instagram-open"
                                >
                                  Abrir
                                </a>
                              </div>
                              <div className="property-detail-instagram-frame">
                                <blockquote
                                  className="instagram-media"
                                  data-instgrm-permalink={embedData.embedUrl}
                                  data-instgrm-version="14"
                                  data-instgrm-captioned="true"
                                >
                                  <a href={videoUrl} target="_blank" rel="noreferrer">
                                    Ver en Instagram
                                  </a>
                                </blockquote>
                              </div>
                            </article>
                          );
                        }

                        return (
                          <article key={`${videoUrl}-${index}`} className="property-detail-video-card">
                            <div className="property-detail-video-frame">
                              <iframe
                                src={embedData.embedUrl}
                                title={`${embedData.source} - video ${index + 1} de ${routedProperty.title}`}
                                loading="lazy"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                referrerPolicy="strict-origin-when-cross-origin"
                                allowFullScreen
                              />
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ) : null}

                <div className="property-detail-actions">
                  <button
                    type="button"
                    className="map-btn"
                    onClick={() => selectPropertyOnMap(routedProperty)}
                  >
                    Ver en el mapa
                  </button>
                  <button
                    type="button"
                    className="map-btn share-btn"
                    onClick={() => handleShareProperty(routedProperty)}
                    aria-label={`Compartir ${routedProperty.title}`}
                  >
                    Compartir
                  </button>
                  <a
                    href={createWhatsAppLink(routedProperty)}
                    target="_blank"
                    rel="noreferrer"
                    className="wa-btn"
                  >
                    Consultar por WhatsApp
                  </a>
                  {shareFeedback ? (
                    <span className="share-feedback" role="status">
                      {shareFeedback}
                    </span>
                  ) : null}
                </div>
              </div>
            </article>
            {lightboxIndex >= 0 && routedProperty?.images?.length ? (
              <ImageLightbox
                images={routedProperty.images}
                initialIndex={lightboxIndex}
                alt={routedProperty.title}
                onClose={() => setLightboxIndex(-1)}
              />
            ) : null}
            </>
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
      <AppNavbar
        logoUrl={logoMarkUrl}
        onBrandClick={() => navigateToPath("/")}
        items={publicNavbarItems({ currentPathname })}
        onItemSelect={handlePublicNavbarItemSelect}
      />
      <header className="hero" id="inicio">
        <div className="hero-layout">
          <div className="hero-content">
            <p className="overline">Inmobiliaria boutique en Patagonia</p>
            <h1>Denise Catalán Bienes Raíces</h1>
            <p className="contact-line">
              San Martín de los Andes · Patagonia Argentina · WhatsApp: <strong>+54 9 2944 68-8613</strong>
            </p>
          </div>

          <section className="map-section hero-map-section" id="mapa" aria-label="Mapa de propiedades disponibles">
            <div className="map-section-header hero-map-section-header">
              <a
                href="/map"
                className="map-fullscreen-link"
                onClick={(event) => {
                  event.preventDefault();
                  navigateToPath("/map");
                }}
              >
                Pantalla completa
              </a>
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
                    <MapClickReset
                      onClear={clearMapPropertyPreview}
                    />
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {visibleProperties.map((property) => (
                      <CircleMarker
                        key={property.id}
                        center={property.coords}
                        radius={property.id === activeMapPropertyId ? 11 : 8}
                        bubblingMouseEvents={false}
                        pathOptions={{
                          color: getCategoryMapColor(property.category),
                          fillColor: getCategoryMapColor(property.category),
                          fillOpacity: 0.9,
                          weight: property.id === activeMapPropertyId ? 4 : 2
                        }}
                        eventHandlers={{
                          mouseover: () => setHoveredPropertyId(property.id),
                          click: () => pinPropertyPreview(property)
                        }}
                      />
                    ))}
                  </MapContainer>
                ) : (
                  <div className="map-empty">
                    <p>No hay propiedades cargadas todavia.</p>
                  </div>
                )}
                {mapPreviewProperty ? (
                  <div
                    className={`map-preview-overlay ${
                      isMapPreviewPinned ? "map-preview-overlay--pinned" : ""
                    }`}
                  >
                    <MapPropertyPreview
                      property={mapPreviewProperty}
                      isPinned={isMapPreviewPinned}
                      displayedPrice={formatDisplayedPrice(mapPreviewProperty)}
                      onPreviewClick={() => handleMapPreviewClick(mapPreviewProperty)}
                    />
                  </div>
                ) : null}
                <div className="map-legend">
                  <div className="map-legend-item">
                    <span className="map-legend-dot" style={{ background: CATEGORY_META.venta.mapColor }} />
                    <span>Venta</span>
                  </div>
                  <div className="map-legend-item">
                    <span className="map-legend-dot" style={{ background: CATEGORY_META.alquiler_turistico.mapColor }} />
                    <span>Alq. turístico</span>
                  </div>
                  <div className="map-legend-item">
                    <span className="map-legend-dot" style={{ background: CATEGORY_META.alquiler_permanente.mapColor }} />
                    <span>Alq. permanente</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </header>

      <main className="content-wrap">
        <section className="properties" id="propiedades" aria-labelledby="properties-title">
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
              {sliderGroupsWithProperties.map((group, index) => {
                return (
                  <Fragment key={group.category}>
                    {index > 0 ? <PropertySliderDivider /> : null}
                    <Slider
                      id={`property-slider-${group.category}`}
                      eyebrow={group.eyebrow}
                      title={group.title}
                      items={group.properties}
                      selectedId={selectedProperty?.id}
                      emptyMessage={group.emptyMessage}
                      showHeader={false}
                      showCounter={false}
                      onActiveItemChange={(property) => {
                        if (property?.id) {
                          setSelectedId(property.id);
                        }
                      }}
                      renderItem={({ item: property, active }) => (
                        <div
                          className="property-slide-card"
                          role={active ? undefined : "button"}
                          tabIndex={active ? undefined : 0}
                          onClick={() => selectPropertySlide(property)}
                          onKeyDown={(event) => {
                            if (!active && (event.key === "Enter" || event.key === " ")) {
                              event.preventDefault();
                              selectPropertySlide(property);
                            }
                          }}
                        >
                          {property.images.length ? (
                            <img
                              className="property-slide-image"
                              src={resolvePropertyCoverImage(property)}
                              alt=""
                              loading="lazy"
                            />
                          ) : null}
                          <span className={`status-pill status-pill--${property.category}`}>
                            {CATEGORY_META[property.category]?.label || "En venta"}
                          </span>
                          <span className="property-slide-text">
                            <span className="property-slide-kicker">
                              {formatDisplayedPrice(property)}
                              {property.category === "venta" && formatPricePerM2(property) ? (
                                <small className="property-slide-price-m2"> · {formatPricePerM2(property)}</small>
                              ) : null}
                            </span>
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
                      )}
                    />
                  </Fragment>
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

export { PublicApp };
export default PublicApp;
