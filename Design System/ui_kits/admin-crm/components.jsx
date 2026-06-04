/* ============================================================
   Denise Catalán — Admin CRM UI Kit · Components
   Cosmetic recreation of /admin (AdminApp). Manrope-led UI.
   Lucide icons via CDN (flagged substitution — brand ships none).
   ============================================================ */

const CAT = {
  venta: "En venta", alquiler_turistico: "Alquiler turístico",
  alquiler_permanente: "Alquiler permanente", vendido: "Vendido", proceso: "En proceso",
};

function Icon({ name, size = 18 }) {
  // lucide is loaded globally; render its SVG markup.
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current && window.lucide?.icons) {
      const pascal = name.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join("");
      const node = window.lucide.icons[pascal]?.toSvg ? window.lucide.icons[pascal] : null;
      if (window.lucide.createElement && window.lucide.icons[pascal]) {
        ref.current.innerHTML = "";
        ref.current.appendChild(window.lucide.createElement(window.lucide.icons[pascal]));
        const svg = ref.current.querySelector("svg");
        if (svg) { svg.setAttribute("width", size); svg.setAttribute("height", size); }
      }
    }
  }, [name, size]);
  return <span className="icon" ref={ref} aria-hidden="true" />;
}

function Pill({ category }) {
  return <span className={`a-pill a-pill--${category}`}>{CAT[category]}</span>;
}

/* ---------------- Login ---------------- */
function Login({ onLogin }) {
  return (
    <main className="admin-shell admin-shell--login">
      <section className="admin-login-panel">
        <img src="../../assets/logo-dc-mark.png" alt="Denise Catalán" />
        <p className="a-eyebrow">Acceso interno</p>
        <h1>Panel de administración</h1>
        <form className="a-form" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
          <label><span>Email</span><input type="email" defaultValue="denise@catalan.com.ar" /></label>
          <label><span>Contraseña</span><input type="password" defaultValue="••••••••••" /></label>
          <button type="submit" className="a-btn a-btn--primary">Ingresar</button>
        </form>
      </section>
    </main>
  );
}

/* ---------------- Shell ---------------- */
function Header({ onLogout }) {
  return (
    <header className="admin-header">
      <div className="admin-header-brand">
        <img src="../../assets/logo-dc-mark.png" alt="DC" />
        <div>
          <p className="a-eyebrow">Denise Catalán · CRM</p>
          <h1>Panel de administración</h1>
        </div>
      </div>
      <button type="button" className="a-btn a-btn--ghost" onClick={onLogout}>Cerrar sesión</button>
    </header>
  );
}

function Navbar({ active, onNav }) {
  const tabs = [
    { id: "resumen", label: "Resumen", icon: "layout-dashboard" },
    { id: "propiedades", label: "Propiedades", icon: "home" },
    { id: "clientes", label: "Clientes", icon: "users" },
    { id: "vendedores", label: "Vendedores", icon: "user-cog" },
  ];
  return (
    <nav className="admin-navbar">
      {tabs.map((t) => (
        <button key={t.id} type="button" className={active === t.id ? "active" : ""} onClick={() => onNav(t.id)}>
          <Icon name={t.icon} size={16} />{t.label}
        </button>
      ))}
    </nav>
  );
}

/* ---------------- Dashboard ---------------- */
function MetricCard({ label, value, hint }) {
  return (
    <div className="admin-metric-card">
      <p className="a-eyebrow">{label}</p>
      <strong>{value}</strong>
      <span>{hint}</span>
    </div>
  );
}

function Dashboard({ data, onNav }) {
  return (
    <div className="admin-crm-dashboard">
      <div className="admin-metrics">
        <MetricCard label="Propiedades" value={data.properties.length} hint="cargadas en total" />
        <MetricCard label="Publicadas" value={data.properties.filter((p) => p.published).length} hint="visibles en el sitio" />
        <MetricCard label="Clientes" value={data.clients.length} hint="de todos los vendedores" />
        <MetricCard label="Vendedores activos" value={data.sellers.filter((s) => s.active).length} hint={`de ${data.sellers.length}`} />
      </div>
      <div className="admin-dash-cols">
        <section className="admin-panel">
          <div className="admin-panel-head"><h2>Actividad reciente</h2></div>
          <ul className="admin-activity">
            {data.activity.map((a, i) => (
              <li key={i}><span className="dot" data-kind={a.kind} /><div><strong>{a.title}</strong><em>{a.who} · {a.when}</em></div></li>
            ))}
          </ul>
        </section>
        <section className="admin-panel">
          <div className="admin-panel-head"><h2>Accesos rápidos</h2></div>
          <div className="admin-quick">
            <button type="button" className="a-btn a-btn--soft" onClick={() => onNav("propiedades")}><Icon name="plus" size={16} />Nueva propiedad</button>
            <button type="button" className="a-btn a-btn--soft" onClick={() => onNav("clientes")}><Icon name="user-plus" size={16} />Nuevo cliente</button>
            <button type="button" className="a-btn a-btn--soft" onClick={() => onNav("vendedores")}><Icon name="user-plus" size={16} />Nuevo vendedor</button>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------------- Lists ---------------- */
function Toolbar({ children }) { return <div className="admin-toolbar">{children}</div>; }

function PropertiesList({ data, onEdit }) {
  const [q, setQ] = React.useState("");
  const rows = data.properties.filter((p) => (p.title + p.location + CAT[p.category]).toLowerCase().includes(q.toLowerCase()));
  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <h2>Propiedades</h2>
        <button type="button" className="a-btn a-btn--primary"><Icon name="plus" size={16} />Nueva propiedad</button>
      </div>
      <Toolbar>
        <div className="a-search"><Icon name="search" size={16} /><input placeholder="Buscar por título, ubicación o categoría…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </Toolbar>
      <table className="admin-table">
        <thead><tr><th>Propiedad</th><th>Categoría</th><th>Publicación</th><th>Valor</th><th></th></tr></thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td><strong>{p.title}</strong><em>{p.location}</em></td>
              <td><Pill category={p.category} /></td>
              <td><span className={`a-dot ${p.published ? "on" : ""}`} />{p.published ? "Publicada" : "Borrador"}</td>
              <td className="a-num">{p.price}</td>
              <td className="a-actions">
                <button type="button" className="a-btn a-btn--ghost a-btn--sm">Ver</button>
                <button type="button" className="a-btn a-btn--soft a-btn--sm" onClick={() => onEdit(p)}>Editar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ClientsList({ data }) {
  const [op, setOp] = React.useState("");
  const rows = data.clients.filter((c) => !op || c.operation === op);
  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <h2>Clientes</h2>
        <button type="button" className="a-btn a-btn--primary"><Icon name="user-plus" size={16} />Nuevo cliente</button>
      </div>
      <Toolbar>
        <label className="a-filter"><span>Operación</span>
          <select value={op} onChange={(e) => setOp(e.target.value)}>
            <option value="">Todas</option><option value="Compra">Compra</option><option value="Alquiler">Alquiler</option><option value="Venta">Venta</option>
          </select>
        </label>
        <label className="a-filter"><span>Estado</span><select><option>Todos</option><option>Nuevo</option><option>En seguimiento</option><option>Cerrado</option></select></label>
        <label className="a-filter"><span>Vendedor</span><select><option>Todos</option><option>Denise C.</option><option>Martín R.</option></select></label>
      </Toolbar>
      <table className="admin-table">
        <thead><tr><th>Cliente</th><th>Operación</th><th>Estado</th><th>Zona</th><th>Creado por</th></tr></thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id}>
              <td><strong>{c.name}</strong><em>{c.phone}</em></td>
              <td>{c.operation}</td>
              <td><span className={`a-status a-status--${c.statusKey}`}>{c.status}</span></td>
              <td>{c.zone}</td>
              <td>{c.createdBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function SellersList({ data }) {
  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <h2>Vendedores</h2>
        <button type="button" className="a-btn a-btn--primary"><Icon name="user-plus" size={16} />Nuevo vendedor</button>
      </div>
      <table className="admin-table">
        <thead><tr><th>Vendedor</th><th>Usuario</th><th>Estado</th><th>Clientes</th><th></th></tr></thead>
        <tbody>
          {data.sellers.map((s) => (
            <tr key={s.id}>
              <td><strong>{s.name}</strong></td>
              <td>{s.email}</td>
              <td><span className={`a-dot ${s.active ? "on" : ""}`} />{s.active ? "Activo" : "Inactivo"}</td>
              <td className="a-num">{s.clients}</td>
              <td className="a-actions"><button type="button" className="a-btn a-btn--soft a-btn--sm">Editar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/* ---------------- Property editor ---------------- */
function PropertyEdit({ property, onBack }) {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header"><h2>Edición</h2><button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={onBack}>← Volver</button></div>
        <div className="admin-thumb" style={{ backgroundImage: `url(${property.image})` }} />
        <Pill category={property.category} />
        <p className="a-muted">Los cambios se publican al guardar. El orden en el sitio se ajusta arrastrando en el listado.</p>
      </aside>
      <section className="admin-editor">
        <div className="admin-editor-title"><p className="a-eyebrow">Propiedad</p><h2>{property.title}</h2></div>
        <div className="a-form a-form--grid">
          <label><span>Título</span><input defaultValue={property.title} /></label>
          <label><span>Ubicación</span><input defaultValue={property.location} /></label>
          <label><span>Categoría</span>
            <select defaultValue={property.category}>
              {Object.entries(CAT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label><span>Valor</span><input defaultValue={property.price} /></label>
          <label><span>Superficie</span><input defaultValue={property.area} /></label>
          <label><span>Coordenadas</span><input defaultValue={property.coords} /></label>
          <label className="wide"><span>Ficha técnica</span><textarea rows={4} defaultValue={property.description} /></label>
          <label className="a-check"><input type="checkbox" defaultChecked={property.published} /><span>Publicada en el sitio</span></label>
        </div>
        <div className="admin-editor-actions">
          <button type="button" className="a-btn a-btn--ghost" onClick={onBack}>Cancelar</button>
          <button type="button" className="a-btn a-btn--primary">Guardar cambios</button>
        </div>
      </section>
    </div>
  );
}

Object.assign(window, {
  CAT, Icon, Pill, Login, Header, Navbar, Dashboard, MetricCard,
  PropertiesList, ClientsList, SellersList, PropertyEdit,
});
