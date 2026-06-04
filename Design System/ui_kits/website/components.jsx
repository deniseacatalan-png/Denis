/* ============================================================
   Denise Catalán — Website UI Kit · Components
   Cosmetic recreations of the public marketing site.
   Exposed on window for use by index.html.
   ============================================================ */

const WA_OFFICE = "5492944688613";
const waLink = (text) => `https://wa.me/${WA_OFFICE}?text=${encodeURIComponent(text)}`;

const CATEGORY_META = {
  venta:               { label: "En venta",            pin: "#b0528c" },
  alquiler_turistico:  { label: "Alquiler turístico",  pin: "#8e6a96" },
  alquiler_permanente: { label: "Alquiler permanente", pin: "#6e4f82" },
  vendido:             { label: "Vendido",             pin: "#4d3661" },
  proceso:             { label: "En proceso",          pin: "#c0a0cf" },
};

/* ---------------- Primitives ---------------- */

function StatusPill({ category, children }) {
  return <span className={`status-pill status-pill--${category}`}>{children ?? CATEGORY_META[category]?.label}</span>;
}

function Button({ variant = "primary", children, onClick, href }) {
  const cls = `btn btn--${variant}`;
  if (href) return <a className={cls} href={href} target="_blank" rel="noreferrer" onClick={onClick}>{children}</a>;
  return <button type="button" className={cls} onClick={onClick}>{children}</button>;
}

function Eyebrow({ children }) { return <p className="eyebrow">{children}</p>; }

function SectionTitle({ eyebrow, title }) {
  return (
    <div className="section-title">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2>{title}</h2>
    </div>
  );
}

/* ---------------- Top nav ---------------- */

function TopNav({ onServices }) {
  return (
    <nav className="top-nav">
      <img className="brand-logo" src="../../assets/logo-dc-mark.png" alt="Denise Catalán" />
      <button type="button" className="btn btn--nav" onClick={onServices}>Solicitar servicios</button>
    </nav>
  );
}

/* ---------------- Hero ---------------- */

function Hero() {
  return (
    <div className="hero-content">
      <p className="overline">Inmobiliaria boutique en Patagonia</p>
      <h1>Denise Catalán Bienes Raíces</h1>
      <p className="hero-tagline">Disfrutá la tranquilidad de estar, donde querés estar</p>
      <p className="hero-place">San Martín de los Andes · Patagonia Argentina</p>
    </div>
  );
}

/* ---------------- Map + details panel ---------------- */

function MapPanel({ properties, selected, onSelect }) {
  // Faux Leaflet map: aerial photo + category-colored circle markers.
  const PINS = {
    p1: { top: "32%", left: "26%" }, p2: { top: "54%", left: "58%" },
    p3: { top: "44%", left: "78%" }, p4: { top: "68%", left: "38%" },
    p5: { top: "24%", left: "62%" },
  };
  return (
    <div className="map-frame">
      <img className="map-aerial" src="../../assets/property-vega-maipu-1.jpeg" alt="Mapa de ubicaciones" />
      <div className="map-scrim" />
      {properties.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`map-pin ${p.id === selected?.id ? "is-active" : ""}`}
          style={{ ...PINS[p.id], "--pin": CATEGORY_META[p.category]?.pin }}
          onClick={() => onSelect(p)}
          aria-label={p.title}
        />
      ))}
      <div className="map-attrib">Geolocalización · OpenStreetMap</div>
    </div>
  );
}

function DetailsPanel({ property, onWhatsApp, onOpenDetail }) {
  if (!property) return null;
  return (
    <aside className="details-panel">
      <span className="chip">Ficha completa</span>
      <div className="details-cover">
        <img src={property.image} alt={property.title} />
        <h3>{property.title}</h3>
      </div>
      <p className="details-loc">{property.location}</p>
      <StatusPill category={property.category} />
      <div className="detail-stats">
        <div><span>Valor</span><strong>{property.price}</strong></div>
        <div><span>Superficie</span><strong>{property.area}</strong></div>
        <div><span>Geo</span><strong>{property.coords}</strong></div>
      </div>
      <button type="button" className="btn btn--soft" onClick={() => onOpenDetail(property)}>Ver ficha técnica</button>
      <Button variant="primary" href={waLink(`Hola Denise, quiero información sobre: ${property.title} (${property.price}) en ${property.location}.`)}>
        Hablar por WhatsApp
      </Button>
    </aside>
  );
}

/* ---------------- Property sliders ---------------- */

function PropertyCard({ property, active, onSelect, onOpenDetail }) {
  return (
    <article className={`property-slide ${active ? "active" : ""}`}>
      <div
        className="property-slide-card"
        role={active ? undefined : "button"}
        tabIndex={active ? undefined : 0}
        style={{ backgroundImage: `linear-gradient(180deg, rgba(35,35,31,0.10), rgba(35,35,31,0.30) 38%, rgba(35,35,31,0.78)), url(${property.image})` }}
        onClick={() => (active ? onOpenDetail(property) : onSelect(property))}
      >
        <StatusPill category={property.category} />
        <div className="property-slide-text">
          <span className="property-slide-kicker">{property.price}</span>
          <span className="property-slide-title">{property.title}</span>
          <span className="property-slide-intro">{property.summary}</span>
        </div>
        <div className="property-slide-footer">
          <span>{property.location}</span>
          <button type="button" className="property-slide-detail-btn" onClick={(e) => { e.stopPropagation(); onOpenDetail(property); }}>
            Ver descripción completa
          </button>
        </div>
      </div>
    </article>
  );
}

function PropertySlider({ group, properties, selected, onSelect, onOpenDetail }) {
  const trackRef = React.useRef(null);
  const list = properties.filter((p) => p.category === group.category);
  const activeIdx = Math.max(0, list.findIndex((p) => p.id === selected?.id));
  const scroll = (dir) => {
    const t = trackRef.current; if (!t) return;
    t.scrollBy({ left: dir * Math.max(t.clientWidth * 0.82, 320), behavior: "smooth" });
  };
  return (
    <section className="property-slider-section">
      <div className="property-slider-shell">
        <div className="property-slider-copy">
          <p className="eyebrow">{group.eyebrow}</p>
          <h3>{group.title}</h3>
        </div>
        <div className="property-slider-counter">{list.length ? activeIdx + 1 : 0} / {list.length}</div>
        <div className="property-slider-viewport">
          <button type="button" className="property-slider-nav" onClick={() => scroll(-1)} disabled={list.length <= 1}>‹</button>
          <div className="property-slider-track" ref={trackRef}>
            {list.length ? list.map((p) => (
              <PropertyCard key={p.id} property={p} active={p.id === selected?.id} onSelect={onSelect} onOpenDetail={onOpenDetail} />
            )) : <div className="property-slider-empty">{group.empty}</div>}
          </div>
          <button type="button" className="property-slider-nav" onClick={() => scroll(1)} disabled={list.length <= 1}>›</button>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Rental search ---------------- */

function RentalSearch() {
  const [type, setType] = React.useState("permanente");
  const [form, setForm] = React.useState({ detail: "", zone: "", budget: "", rooms: "", prefs: "", must: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const link = waLink(
    `Hola Denise, busco alquiler en San Martín de los Andes.\nTipo: ${type === "turistico" ? "alquiler turístico" : "alquiler permanente"}\nBúsqueda: ${form.detail || "A conversar"}\nZona: ${form.zone || "Flexible"}\nPresupuesto: ${form.budget || "A definir"}`
  );
  return (
    <section className="rental-search-section">
      <div className="property-slider-copy">
        <p className="eyebrow">Solicitud personalizada</p>
        <h3>Busco alquiler en San Martín de los Andes</h3>
        <span className="rental-lead">Compartinos el detalle de tu búsqueda para curar opciones permanentes o turísticas con zona, presupuesto y preferencias claras.</span>
      </div>
      <div className="rental-search-card">
        <div className="rental-type-toggle">
          {["permanente", "turistico"].map((t) => (
            <label key={t} className={type === t ? "is-on" : ""}>
              <input type="radio" name="rt" value={t} checked={type === t} onChange={(e) => setType(e.target.value)} />
              {t === "permanente" ? "Permanente" : "Turístico"}
            </label>
          ))}
        </div>
        <div className="rental-search-grid">
          <label className="wide"><span>Pequeño detalle de búsqueda</span>
            <textarea rows={2} value={form.detail} onChange={set("detail")} placeholder="Ej: casa luminosa para familia, cerca de colegio o con jardín" /></label>
          <label><span>Zona</span><input value={form.zone} onChange={set("zone")} placeholder="Centro, Vega, Chapelco, flexible…" /></label>
          <label><span>Presupuesto</span><input value={form.budget} onChange={set("budget")} placeholder="Monto estimado / moneda" /></label>
          <label><span>Ambientes</span><input value={form.rooms} onChange={set("rooms")} placeholder="2 dorm., 3 ambientes…" /></label>
          <label><span>Preferencias</span><input value={form.prefs} onChange={set("prefs")} placeholder="Amoblado, patio, vista, mascotas…" /></label>
        </div>
        <div className="rental-search-actions">
          <button type="button" className="btn btn--soft" onClick={() => { setForm({ detail: "", zone: "", budget: "", rooms: "", prefs: "", must: "" }); setType("permanente"); }}>Limpiar búsqueda</button>
          <Button variant="primary" href={link}>Enviar búsqueda por WhatsApp</Button>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Modals ---------------- */

function PropertyDetailModal({ property, onClose }) {
  if (!property) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="property-detail-screen">
        <button type="button" className="property-detail-close" onClick={onClose} aria-label="Cerrar">×</button>
        <div className="property-detail-hero">
          <img src={property.image} alt={property.title} />
          <div className="property-detail-hero-text">
            <StatusPill category={property.category} />
            <h2>{property.title}</h2>
            <p>{property.location}</p>
          </div>
        </div>
        <div className="property-detail-content">
          <div className="detail-stats">
            <div><span>Valor</span><strong>{property.price}</strong></div>
            <div><span>Superficie</span><strong>{property.area}</strong></div>
            <div><span>Geo</span><strong>{property.coords}</strong></div>
          </div>
          <div className="rich-text"><p>{property.description}</p></div>
          <div className="property-detail-actions">
            <button type="button" className="btn btn--soft" onClick={onClose}>Seleccionar en mapa</button>
            <Button variant="primary" href={waLink(`Hola Denise, quiero información sobre: ${property.title}.`)}>Consultar por WhatsApp</Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ServiceModal({ open, onClose }) {
  const [need, setNeed] = React.useState("vender");
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="service-modal">
        <label className="services-label" htmlFor="need">Quiero solicitar el servicio de:</label>
        <select id="need" value={need} onChange={(e) => setNeed(e.target.value)}>
          <option value="vender">Vender</option><option value="alquilar">Alquilar</option>
          <option value="invertir">Invertir</option><option value="otros">Otros</option>
        </select>
        <div className="service-modal-actions">
          <button type="button" className="btn btn--soft" onClick={onClose}>Cerrar</button>
          <Button variant="primary" href={waLink(`Hola Denise, quiero solicitar el servicio de ${need}.`)} onClick={onClose}>Ir a WhatsApp</Button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  CATEGORY_META, waLink, StatusPill, Button, Eyebrow, SectionTitle,
  TopNav, Hero, MapPanel, DetailsPanel, PropertyCard, PropertySlider,
  RentalSearch, PropertyDetailModal, ServiceModal,
});
