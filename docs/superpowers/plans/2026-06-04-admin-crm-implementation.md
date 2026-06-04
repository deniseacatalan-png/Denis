# Admin CRM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a CRM-style `/admin` with dashboard, Propiedades, Clientes and Vendedores pages, and rename `seller_contacts` to `clients`.

**Architecture:** Keep the React/Vite app lightweight by using pathname-based routing inside `AdminApp` instead of adding React Router. Move contact/client data helpers into `src/utils/supabase/clients.js`, keep seller auth/profile helpers in `src/utils/supabase/sellers.js`, and reuse the existing property editor behavior inside new admin views.

**Tech Stack:** React 18, Vite, Supabase JS/SSR, Supabase Postgres/RLS migrations, Node test runner.

---

## Scope Check

This is one cohesive subsystem: the internal admin and the shared client data model. The database rename, seller portal update, and admin CRM views must ship together because the portal vendedor and admin both read/write the same client records.

## File Structure

- Leave unchanged: existing migration files under `supabase/migrations/`.
- Create: `supabase/migrations/<timestamp>_rename_seller_contacts_to_clients.sql`
- Create: `src/utils/supabase/clients.js`
- Modify: `src/utils/supabase/sellers.js`
- Modify: `src/seller/SellerApp.jsx`
- Modify: `src/admin/AdminApp.jsx`
- Modify: `src/styles.css`
- Modify: `tests/seller-utils.test.js`
- Create: `tests/client-utils.test.js`

## Task 1: Add Client Helper Tests

**Files:**
- Create: `tests/client-utils.test.js`
- Modify: `tests/seller-utils.test.js`

- [ ] **Step 1: Write failing tests for client helpers**

Create `tests/client-utils.test.js`:

```js
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CLIENT_OPERATIONS,
  CLIENT_STATUSES,
  clientToDatabasePayload,
  normalizeClient
} from "../src/utils/supabase/clients.js";

describe("client supabase helpers", () => {
  it("exposes the supported client operation and status values", () => {
    assert.deepEqual(CLIENT_OPERATIONS, ["comprar", "alquilar"]);
    assert.deepEqual(CLIENT_STATUSES, ["nuevo", "contactado", "visitando", "cerrado", "pausado"]);
  });

  it("normalizes client rows from Supabase into UI fields", () => {
    const client = normalizeClient({
      id: "client-1",
      created_by: "seller-1",
      updated_by: "admin-1",
      full_name: "Juan Perez",
      phone: "2944000000",
      email: "juan@example.com",
      operation: "comprar",
      zone: "Centro",
      budget: "USD 180.000",
      rooms: "3 ambientes",
      status: "contactado",
      notes: "Busca casa luminosa",
      created_at: "2026-06-04T12:00:00Z",
      updated_at: "2026-06-04T13:00:00Z"
    });

    assert.deepEqual(client, {
      id: "client-1",
      createdBy: "seller-1",
      updatedBy: "admin-1",
      fullName: "Juan Perez",
      phone: "2944000000",
      email: "juan@example.com",
      operation: "comprar",
      zone: "Centro",
      budget: "USD 180.000",
      rooms: "3 ambientes",
      status: "contactado",
      notes: "Busca casa luminosa",
      createdAt: "2026-06-04T12:00:00Z",
      updatedAt: "2026-06-04T13:00:00Z"
    });
  });

  it("builds trimmed database payloads with safe defaults", () => {
    const payload = clientToDatabasePayload(
      {
        fullName: "  Maria Lopez  ",
        phone: "  +54 2944 111111  ",
        email: "  MARIA@EXAMPLE.COM  ",
        operation: "invalid",
        zone: "  Vega  ",
        budget: "  $900.000  ",
        rooms: "  2 dorm.  ",
        status: "unknown",
        notes: "  Prefiere alquiler permanente  "
      },
      "seller-1"
    );

    assert.deepEqual(payload, {
      full_name: "Maria Lopez",
      phone: "+54 2944 111111",
      email: "maria@example.com",
      operation: "alquilar",
      zone: "Vega",
      budget: "$900.000",
      rooms: "2 dorm.",
      status: "nuevo",
      notes: "Prefiere alquiler permanente",
      updated_by: "seller-1"
    });
  });

  it("requires a client name before saving", () => {
    assert.throws(
      () => clientToDatabasePayload({ fullName: " " }, "seller-1"),
      /El nombre del cliente es obligatorio/
    );
  });
});
```

- [ ] **Step 2: Reduce `tests/seller-utils.test.js` to seller-specific behavior**

Replace its imports and test body with:

```js
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { usernameToSellerEmail } from "../src/utils/supabase/sellers.js";

describe("seller supabase helpers", () => {
  it("maps short seller usernames to the private seller email domain", () => {
    assert.equal(
      usernameToSellerEmail("  Sofia  "),
      "sofia@vendedor.denise-catalan.local"
    );
    assert.equal(usernameToSellerEmail("ventas@example.com"), "ventas@example.com");
  });
});
```

- [ ] **Step 3: Run tests and verify failure**

Run:

```bash
npm test
```

Expected: `tests/client-utils.test.js` fails because `src/utils/supabase/clients.js` does not exist.

## Task 2: Implement Client Data Helpers

**Files:**
- Create: `src/utils/supabase/clients.js`
- Modify: `src/utils/supabase/sellers.js`

- [ ] **Step 1: Create `src/utils/supabase/clients.js`**

```js
import { createClient } from "./client.js";

export const CLIENT_OPERATIONS = ["comprar", "alquilar"];
export const CLIENT_STATUSES = ["nuevo", "contactado", "visitando", "cerrado", "pausado"];

const CLIENT_SELECT = `
  id,
  created_by,
  updated_by,
  full_name,
  phone,
  email,
  operation,
  zone,
  budget,
  rooms,
  status,
  notes,
  created_at,
  updated_at
`;

function textValue(value) {
  return String(value || "").trim();
}

export function normalizeClient(row) {
  return {
    id: row.id,
    createdBy: row.created_by || "",
    updatedBy: row.updated_by || "",
    fullName: row.full_name || "",
    phone: row.phone || "",
    email: row.email || "",
    operation: row.operation || "alquilar",
    zone: row.zone || "",
    budget: row.budget || "",
    rooms: row.rooms || "",
    status: row.status || "nuevo",
    notes: row.notes || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || ""
  };
}

export function clientToDatabasePayload(values, userId) {
  const fullName = textValue(values.fullName);

  if (!fullName) {
    throw new Error("El nombre del cliente es obligatorio.");
  }

  const operation = CLIENT_OPERATIONS.includes(values.operation) ? values.operation : "alquilar";
  const status = CLIENT_STATUSES.includes(values.status) ? values.status : "nuevo";

  return {
    full_name: fullName,
    phone: textValue(values.phone),
    email: textValue(values.email).toLowerCase(),
    operation,
    zone: textValue(values.zone),
    budget: textValue(values.budget),
    rooms: textValue(values.rooms),
    status,
    notes: textValue(values.notes),
    updated_by: userId
  };
}

export async function fetchClients(filters = {}) {
  const supabase = createClient();
  let query = supabase
    .from("clients")
    .select(CLIENT_SELECT)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (CLIENT_OPERATIONS.includes(filters.operation)) {
    query = query.eq("operation", filters.operation);
  }

  if (CLIENT_STATUSES.includes(filters.status)) {
    query = query.eq("status", filters.status);
  }

  if (filters.createdBy) {
    query = query.eq("created_by", filters.createdBy);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(normalizeClient);
}

export async function saveClient(values, userId) {
  const supabase = createClient();
  const payload = clientToDatabasePayload(values, userId);

  if (values.id) {
    const { data, error } = await supabase
      .from("clients")
      .update(payload)
      .eq("id", values.id)
      .select(CLIENT_SELECT)
      .single();

    if (error) throw error;
    return normalizeClient(data);
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      ...payload,
      created_by: userId
    })
    .select(CLIENT_SELECT)
    .single();

  if (error) throw error;
  return normalizeClient(data);
}
```

- [ ] **Step 2: Remove client/contact exports from `src/utils/supabase/sellers.js`**

Delete `CONTACT_OPERATIONS`, `CONTACT_STATUSES`, `SELLER_CONTACT_SELECT`, `normalizeSellerContact`, `sellerContactToDatabasePayload`, `fetchSellerContacts`, and `saveSellerContact`.

Keep these seller-focused exports:

```js
export const SELLER_EMAIL_DOMAIN = "vendedor.denise-catalan.local";
export function usernameToSellerEmail(username) { ... }
export function normalizeSellerProfile(row) { ... }
export async function signInSeller(username, password) { ... }
export function getCurrentSession() { ... }
export function onAuthStateChange(callback) { ... }
export async function signOutSeller() { ... }
export async function fetchInternalProfile(userId) { ... }
export async function fetchSellerProfiles() { ... }
export async function createSellerFromAdmin({ accessToken, seller }) { ... }
export async function setSellerActiveFromAdmin({ accessToken, sellerId, isActive }) { ... }
```

- [ ] **Step 3: Run tests**

Run:

```bash
npm test
```

Expected: all helper/API tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/utils/supabase/clients.js src/utils/supabase/sellers.js tests/client-utils.test.js tests/seller-utils.test.js
git commit -m "refactor: add shared client helpers"
```

## Task 3: Add Supabase Rename Migration

**Files:**
- Create: `supabase/migrations/<timestamp>_rename_seller_contacts_to_clients.sql`

- [ ] **Step 1: Check Supabase CLI syntax before creating the migration**

Run:

```bash
supabase --version
supabase migration --help
supabase migration new --help
```

Expected: CLI prints version and confirms the `migration new <name>` syntax.

- [ ] **Step 2: Create the migration file**

Run:

```bash
supabase migration new rename_seller_contacts_to_clients
```

Expected: a new file appears under `supabase/migrations/` ending with `_rename_seller_contacts_to_clients.sql`.

- [ ] **Step 3: Fill the migration SQL**

Put this SQL in the new migration file:

```sql
alter table if exists public.seller_contacts rename to clients;

alter index if exists public.seller_contacts_created_at_idx rename to clients_created_at_idx;
alter index if exists public.seller_contacts_status_operation_idx rename to clients_status_operation_idx;
alter index if exists public.seller_contacts_created_by_idx rename to clients_created_by_idx;

alter trigger seller_contacts_set_updated_at on public.clients rename to clients_set_updated_at;

drop policy if exists "Internal users can read seller contacts" on public.clients;
drop policy if exists "Internal users can create seller contacts" on public.clients;
drop policy if exists "Internal users can update seller contacts" on public.clients;
drop policy if exists "Internal users can read clients" on public.clients;
drop policy if exists "Internal users can create clients" on public.clients;
drop policy if exists "Internal users can update clients" on public.clients;

alter table public.clients enable row level security;

revoke all on public.clients from anon;
grant select, insert, update on public.clients to authenticated;

create policy "Internal users can read clients"
on public.clients
for select
to authenticated
using ((select public.is_admin()) or (select public.is_seller()));

create policy "Internal users can create clients"
on public.clients
for insert
to authenticated
with check (
  ((select public.is_admin()) or (select public.is_seller()))
  and created_by = (select auth.uid())
);

create policy "Internal users can update clients"
on public.clients
for update
to authenticated
using ((select public.is_admin()) or (select public.is_seller()))
with check ((select public.is_admin()) or (select public.is_seller()));
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/*_rename_seller_contacts_to_clients.sql
git commit -m "db: rename seller contacts to clients"
```

## Task 4: Update Seller Portal To Use Clients

**Files:**
- Modify: `src/seller/SellerApp.jsx`

- [ ] **Step 1: Update imports**

Replace the current seller contact imports with:

```js
import {
  CLIENT_OPERATIONS,
  CLIENT_STATUSES,
  fetchClients,
  saveClient
} from "../utils/supabase/clients";
import {
  fetchInternalProfile,
  getCurrentSession,
  onAuthStateChange,
  signInSeller,
  signOutSeller
} from "../utils/supabase/sellers";
```

- [ ] **Step 2: Rename UI copy from contactos to clientes**

Use these exact display labels in `SellerApp.jsx`:

```js
const emptyClientForm = {
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
```

Rename `contactToForm` to `clientToForm`, and use `CLIENT_OPERATIONS` / `CLIENT_STATUSES`.

- [ ] **Step 3: Update data calls**

Replace:

```js
const data = await fetchSellerContacts(filters);
const savedContact = await saveSellerContact(form, session.user.id);
```

with:

```js
const data = await fetchClients(filters);
const savedClient = await saveClient(form, session.user.id);
```

Then set:

```js
setSelectedClientId(savedClient.id);
setForm(clientToForm(savedClient));
```

- [ ] **Step 4: Run tests and build**

```bash
npm test
npm run build
```

Expected: tests pass and Vite builds without missing imports.

- [ ] **Step 5: Commit**

```bash
git add src/seller/SellerApp.jsx
git commit -m "refactor: use clients in seller portal"
```

## Task 5: Add Admin Routing Helpers And Shared Labels

**Files:**
- Modify: `src/admin/AdminApp.jsx`

- [ ] **Step 1: Add imports**

Add:

```js
import {
  CLIENT_OPERATIONS,
  CLIENT_STATUSES,
  fetchClients,
  saveClient
} from "../utils/supabase/clients";
```

- [ ] **Step 2: Add route constants near the form constants**

```js
const adminNavItems = [
  { label: "Resumen", path: "/admin", match: "dashboard" },
  { label: "Propiedades", path: "/admin/propiedades", match: "properties" },
  { label: "Clientes", path: "/admin/clientes", match: "clients" },
  { label: "Vendedores", path: "/admin/vendedores", match: "sellers" }
];

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

const emptyClientForm = {
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
```

- [ ] **Step 3: Add route parser**

```js
function parseAdminRoute(pathname = window.location.pathname) {
  const parts = pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  const section = parts[1] || "";
  const id = parts[2] || "";
  const action = parts[3] || "";

  if (!section) return { section: "dashboard", mode: "dashboard", id: "" };
  if (section === "propiedades") {
    if (id === "nueva") return { section: "properties", mode: "new", id: "" };
    return { section: "properties", mode: action === "editar" ? "edit" : id ? "view" : "list", id };
  }
  if (section === "clientes") {
    if (id === "nuevo") return { section: "clients", mode: "new", id: "" };
    return { section: "clients", mode: action === "editar" ? "edit" : id ? "view" : "list", id };
  }
  if (section === "vendedores") {
    if (id === "nuevo") return { section: "sellers", mode: "new", id: "" };
    return { section: "sellers", mode: action === "editar" ? "edit" : id ? "view" : "list", id };
  }

  return { section: "dashboard", mode: "not-found", id: "" };
}
```

- [ ] **Step 4: Add navigation helper inside `AdminApp`**

```js
const [route, setRoute] = useState(() => parseAdminRoute());

useEffect(() => {
  const handlePopState = () => setRoute(parseAdminRoute());
  window.addEventListener("popstate", handlePopState);
  return () => window.removeEventListener("popstate", handlePopState);
}, []);

const navigateAdmin = (path) => {
  window.history.pushState({}, "", path);
  setRoute(parseAdminRoute(path));
};
```

- [ ] **Step 5: Commit**

```bash
git add src/admin/AdminApp.jsx
git commit -m "feat: add admin route parsing"
```

## Task 6: Load Clients And Build Admin Dashboard

**Files:**
- Modify: `src/admin/AdminApp.jsx`

- [ ] **Step 1: Add admin client state**

Inside `AdminApp`:

```js
const [clients, setClients] = useState([]);
const [clientFilters, setClientFilters] = useState({ operation: "", status: "", createdBy: "" });
const [clientMessage, setClientMessage] = useState("");
const [clientError, setClientError] = useState("");
const [isSavingClient, setIsSavingClient] = useState(false);
```

- [ ] **Step 2: Add `loadClients`**

```js
const loadClients = async () => {
  if (!session) return;
  setClientError("");

  try {
    const data = await fetchClients(clientFilters);
    setClients(data);
  } catch (loadError) {
    setClientError(loadError.message);
  }
};
```

Update the session load effect:

```js
useEffect(() => {
  loadProperties();
  loadSellers();
  loadClients();
}, [session, clientFilters.operation, clientFilters.status, clientFilters.createdBy]);
```

- [ ] **Step 3: Add dashboard view function**

```jsx
function AdminDashboard({ properties, clients, sellers, navigateAdmin }) {
  const publishedCount = properties.filter((property) => property.isPublished).length;
  const activeSellerCount = sellers.filter((seller) => seller.isActive).length;
  const recentClients = clients.slice(0, 4);

  return (
    <section className="admin-crm-dashboard">
      <div className="admin-metric-grid">
        <article className="admin-metric-card">
          <span>Propiedades</span>
          <strong>{properties.length}</strong>
        </article>
        <article className="admin-metric-card">
          <span>Publicadas</span>
          <strong>{publishedCount}</strong>
        </article>
        <article className="admin-metric-card">
          <span>Clientes</span>
          <strong>{clients.length}</strong>
        </article>
        <article className="admin-metric-card">
          <span>Vendedores activos</span>
          <strong>{activeSellerCount}</strong>
        </article>
      </div>

      <div className="admin-crm-grid">
        <section className="admin-panel">
          <h2>Actividad reciente</h2>
          <div className="admin-table-list">
            {recentClients.map((client) => (
              <div className="admin-table-row" key={client.id}>
                <div>
                  <strong>{client.fullName}</strong>
                  <span>{operationLabels[client.operation] || client.operation}</span>
                </div>
                <span className={`seller-status-pill seller-status-pill--${client.status}`}>
                  {statusLabels[client.status] || client.status}
                </span>
              </div>
            ))}
            {!recentClients.length ? <p className="seller-empty-state">No hay clientes cargados.</p> : null}
          </div>
        </section>

        <section className="admin-panel">
          <h2>Accesos rapidos</h2>
          <div className="admin-quick-actions">
            <button type="button" className="wa-btn" onClick={() => navigateAdmin("/admin/propiedades/nueva")}>
              Nueva propiedad
            </button>
            <button type="button" className="wa-btn" onClick={() => navigateAdmin("/admin/clientes/nuevo")}>
              Nuevo cliente
            </button>
            <button type="button" className="wa-btn" onClick={() => navigateAdmin("/admin/vendedores/nuevo")}>
              Nuevo vendedor
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Render dashboard when `route.section === "dashboard"`**

In the authenticated return, below the header/nav:

```jsx
{route.section === "dashboard" ? (
  <AdminDashboard
    properties={properties}
    clients={clients}
    sellers={sellers}
    navigateAdmin={navigateAdmin}
  />
) : null}
```

- [ ] **Step 5: Commit**

```bash
git add src/admin/AdminApp.jsx
git commit -m "feat: add admin crm dashboard"
```

## Task 7: Convert Property Admin Into List/View/Edit Routes

**Files:**
- Modify: `src/admin/AdminApp.jsx`

- [ ] **Step 1: Replace the always-visible property layout with conditional property rendering**

Move the existing property sidebar/editor markup into:

```jsx
function renderPropertiesSection() {
  if (route.mode === "list") {
    return (
      <section className="admin-panel">
        <div className="admin-section-header">
          <div>
            <p>Inventario</p>
            <h2>Propiedades</h2>
          </div>
          <button type="button" className="wa-btn" onClick={() => {
            startNewProperty();
            navigateAdmin("/admin/propiedades/nueva");
          }}>
            Nueva
          </button>
        </div>
        <div className="admin-table-list">
          {properties.map((property) => (
            <div className="admin-table-row" key={property.id}>
              <div>
                <strong>{property.title}</strong>
                <span>{CATEGORY_META[property.category]?.label || property.category} · {property.location}</span>
              </div>
              <span className={`admin-publish-chip ${property.isPublished ? "is-published" : "is-hidden"}`}>
                {property.isPublished ? "Publicada" : "Oculta"}
              </span>
              <div className="admin-row-actions">
                <button type="button" className="map-btn" onClick={() => navigateAdmin(`/admin/propiedades/${property.id}`)}>
                  Ver
                </button>
                <button type="button" className="map-btn" onClick={() => {
                  setSelectedId(property.id);
                  navigateAdmin(`/admin/propiedades/${property.id}/editar`);
                }}>
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (route.mode === "view") {
    const property = properties.find((item) => item.id === route.id);
    if (!property) return renderNotFound("Propiedad no encontrada", "/admin/propiedades");
    return renderPropertyView(property);
  }

  if (route.mode === "new" || route.mode === "edit") {
    return renderPropertyEditor();
  }

  return renderNotFound("Seccion no encontrada", "/admin/propiedades");
}
```

- [ ] **Step 2: Add `renderPropertyView`**

```jsx
function renderPropertyView(property) {
  return (
    <section className="admin-panel">
      <div className="admin-section-header">
        <div>
          <p>{CATEGORY_META[property.category]?.label || property.category}</p>
          <h2>{property.title}</h2>
        </div>
        <div className="admin-row-actions">
          <button type="button" className="map-btn" onClick={() => navigateAdmin("/admin/propiedades")}>
            Volver
          </button>
          <button type="button" className="wa-btn" onClick={() => {
            setSelectedId(property.id);
            navigateAdmin(`/admin/propiedades/${property.id}/editar`);
          }}>
            Editar
          </button>
        </div>
      </div>
      <div className="admin-detail-grid">
        <div><span>Valor</span><strong>{property.price}</strong></div>
        <div><span>Superficie</span><strong>{property.area}</strong></div>
        <div><span>Ubicacion</span><strong>{property.location}</strong></div>
        <div><span>Estado</span><strong>{property.isPublished ? "Publicada" : "Oculta"}</strong></div>
      </div>
      <p className="admin-detail-copy">{property.summary || "Sin resumen cargado."}</p>
    </section>
  );
}
```

- [ ] **Step 3: Reuse the existing property form as `renderPropertyEditor`**

Use the current `<form className="admin-editor" onSubmit={handleSave}>...</form>` markup as the body of `renderPropertyEditor`. Add a `Volver` button to `/admin/propiedades`, and after successful save in `handleSave`, call:

```js
navigateAdmin(`/admin/propiedades/${propertyId}`);
```

- [ ] **Step 4: Keep drag-and-drop order inside the property list**

Use the existing `draggable`, `handlePropertyDragStart`, `handlePropertyDragOver`, `handlePropertyDrop`, `handlePropertyDragEnd`, `isSavingOrder`, `draggingPropertyId`, and `dropTargetPropertyId` logic on the rows in `renderPropertiesSection`.

- [ ] **Step 5: Commit**

```bash
git add src/admin/AdminApp.jsx
git commit -m "feat: add admin property routes"
```

## Task 8: Add Admin Client List/View/Edit Routes

**Files:**
- Modify: `src/admin/AdminApp.jsx`

- [ ] **Step 1: Add client form helpers**

```js
function clientToForm(client) {
  return {
    id: client.id || "",
    fullName: client.fullName || "",
    phone: client.phone || "",
    email: client.email || "",
    operation: CLIENT_OPERATIONS.includes(client.operation) ? client.operation : "alquilar",
    zone: client.zone || "",
    budget: client.budget || "",
    rooms: client.rooms || "",
    status: CLIENT_STATUSES.includes(client.status) ? client.status : "nuevo",
    notes: client.notes || ""
  };
}

function formatAdminDate(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}
```

- [ ] **Step 2: Add client form state**

```js
const [clientForm, setClientForm] = useState(emptyClientForm);

const updateClientField = (field, value) => {
  setClientForm((current) => ({
    ...current,
    [field]: value
  }));
};
```

- [ ] **Step 3: Add `handleClientSave`**

```js
const handleClientSave = async (event) => {
  event.preventDefault();

  if (!session?.user?.id) {
    setClientError("Tu sesion expiro. Volve a ingresar para administrar clientes.");
    return;
  }

  setIsSavingClient(true);
  setClientMessage("");
  setClientError("");

  try {
    const savedClient = await saveClient(clientForm, session.user.id);
    setClientMessage("Cliente guardado.");
    await loadClients();
    navigateAdmin(`/admin/clientes/${savedClient.id}`);
  } catch (saveError) {
    setClientError(saveError.message);
  } finally {
    setIsSavingClient(false);
  }
};
```

- [ ] **Step 4: Add `renderClientsSection`**

Implement:

```jsx
function renderClientsSection() {
  if (route.mode === "list") return renderClientsList();
  if (route.mode === "view") {
    const client = clients.find((item) => item.id === route.id);
    if (!client) return renderNotFound("Cliente no encontrado", "/admin/clientes");
    return renderClientView(client);
  }
  if (route.mode === "new") return renderClientEditor();
  if (route.mode === "edit") {
    const client = clients.find((item) => item.id === route.id);
    if (!client) return renderNotFound("Cliente no encontrado", "/admin/clientes");
    return renderClientEditor();
  }
  return renderNotFound("Seccion no encontrada", "/admin/clientes");
}
```

- [ ] **Step 5: Add `renderClientsList`, `renderClientView`, and `renderClientEditor`**

Use a panel with filters:

```jsx
<select value={clientFilters.createdBy} onChange={(event) => setClientFilters((current) => ({ ...current, createdBy: event.target.value }))}>
  <option value="">Todos los vendedores</option>
  {sellers.map((seller) => (
    <option value={seller.id} key={seller.id}>{seller.fullName || seller.username}</option>
  ))}
</select>
```

Use actions:

```jsx
<button type="button" className="map-btn" onClick={() => navigateAdmin(`/admin/clientes/${client.id}`)}>Ver</button>
<button type="button" className="map-btn" onClick={() => navigateAdmin(`/admin/clientes/${client.id}/editar`)}>Editar</button>
```

Use the editor fields from the seller portal client form: name, phone, email, operation, zone, budget, rooms, status, notes.

- [ ] **Step 6: Sync client form state from route changes**

Add this effect inside `AdminApp`:

```js
useEffect(() => {
  if (route.section !== "clients") return;

  if (route.mode === "new") {
    setClientForm(emptyClientForm);
    setClientMessage("");
    setClientError("");
    return;
  }

  if (route.mode === "edit") {
    const client = clients.find((item) => item.id === route.id);
    if (client) {
      setClientForm(clientToForm(client));
      setClientMessage("");
      setClientError("");
    }
  }
}, [route.section, route.mode, route.id, clients]);
```

- [ ] **Step 7: Commit**

```bash
git add src/admin/AdminApp.jsx
git commit -m "feat: add admin client routes"
```

## Task 9: Add Admin Seller List/View/Edit Routes

**Files:**
- Modify: `src/admin/AdminApp.jsx`

- [ ] **Step 1: Add seller form helpers**

```js
function sellerToForm(seller) {
  return {
    username: seller.username || "",
    fullName: seller.fullName || "",
    password: "",
    isActive: Boolean(seller.isActive)
  };
}

function countClientsForSeller(clients, sellerId) {
  return clients.filter((client) => client.createdBy === sellerId).length;
}
```

- [ ] **Step 2: Update `handleSellerSave` for new/edit route**

After save and reload:

```js
const savedSeller = await createSellerFromAdmin({
  accessToken: session.access_token,
  seller: sellerForm
});
setSellerMessage("Vendedor guardado.");
setSellerForm(emptySellerForm);
await loadSellers();
navigateAdmin(`/admin/vendedores/${savedSeller.id}`);
```

- [ ] **Step 3: Add `renderSellersSection`**

Modes:

- `list`: table of sellers with Ver/Edit and active chip.
- `view`: seller details plus `countClientsForSeller(clients, seller.id)`.
- `new`: empty seller form.
- `edit`: seller form with password optional.

Use actions:

```jsx
<button type="button" className="map-btn" onClick={() => navigateAdmin(`/admin/vendedores/${seller.id}`)}>Ver</button>
<button type="button" className="map-btn" onClick={() => {
  setSellerForm(sellerToForm(seller));
  navigateAdmin(`/admin/vendedores/${seller.id}/editar`);
}}>Editar</button>
```

- [ ] **Step 4: Preserve active/inactive toggle**

Use the existing `handleSellerActiveChange(seller, !seller.isActive)` in list and view rows.

- [ ] **Step 5: Commit**

```bash
git add src/admin/AdminApp.jsx
git commit -m "feat: add admin seller routes"
```

## Task 10: Add Admin Navbar And CRM Styles

**Files:**
- Modify: `src/admin/AdminApp.jsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add navbar below the admin header**

```jsx
<nav className="admin-navbar" aria-label="Administracion">
  {adminNavItems.map((item) => (
    <button
      type="button"
      key={item.path}
      className={route.section === item.match ? "active" : ""}
      onClick={() => navigateAdmin(item.path)}
    >
      {item.label}
    </button>
  ))}
</nav>
```

- [ ] **Step 2: Add CRM styles**

Append:

```css
.admin-navbar,
.admin-panel,
.admin-metric-card {
  border: 1px solid var(--glass-border);
  background: linear-gradient(145deg, rgba(255,255,255,0.18), rgba(255,255,255,0.07));
  backdrop-filter: blur(16px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 14px 34px rgba(19, 12, 18, 0.24);
}

.admin-navbar {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
  padding: 0.55rem;
}

.admin-navbar button {
  border: 0;
  border-radius: 8px;
  padding: 0.62rem 0.9rem;
  color: var(--text-soft);
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-weight: 900;
}

.admin-navbar button.active {
  color: #1e1a1f;
  background: rgba(255, 255, 255, 0.88);
}

.admin-crm-dashboard,
.admin-panel {
  display: grid;
  gap: 1rem;
}

.admin-metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.admin-metric-card,
.admin-panel {
  padding: 1rem;
}

.admin-metric-card span,
.admin-detail-grid span {
  display: block;
  color: #ffeec9;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.76rem;
  font-weight: 900;
}

.admin-metric-card strong {
  display: block;
  margin-top: 0.35rem;
  color: #fff;
  font-size: clamp(1.8rem, 3vw, 2.6rem);
  line-height: 1;
}

.admin-crm-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: 1rem;
}

.admin-section-header,
.admin-table-row,
.admin-row-actions,
.admin-quick-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.admin-section-header,
.admin-table-row {
  justify-content: space-between;
}

.admin-section-header h2,
.admin-panel h2 {
  margin: 0;
  color: #fff;
}

.admin-table-list {
  display: grid;
  gap: 0.65rem;
}

.admin-table-row {
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 8px;
  padding: 0.85rem;
  color: #1e1a1f;
  background: rgba(255, 255, 255, 0.88);
}

.admin-table-row div {
  min-width: 0;
}

.admin-table-row strong,
.admin-table-row span {
  overflow-wrap: anywhere;
}

.admin-table-row span {
  color: #5b4c55;
}

.admin-detail-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}

.admin-detail-grid > div {
  border-radius: 8px;
  padding: 0.85rem;
  background: rgba(255, 255, 255, 0.12);
}

.admin-detail-grid strong,
.admin-detail-copy {
  color: #fff;
}

@media (max-width: 900px) {
  .admin-metric-grid,
  .admin-crm-grid,
  .admin-detail-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/admin/AdminApp.jsx src/styles.css
git commit -m "style: add admin crm navigation"
```

## Task 11: Final Verification

**Files:**
- Verify all modified files.

- [ ] **Step 1: Run automated tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: Vite build completes and prints output files.

- [ ] **Step 3: Start dev server**

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite prints a local URL, usually `http://127.0.0.1:5173/`.

- [ ] **Step 4: Browser verification**

Open these routes in the in-app browser:

- `http://127.0.0.1:5173/admin`
- `http://127.0.0.1:5173/admin/propiedades`
- `http://127.0.0.1:5173/admin/clientes`
- `http://127.0.0.1:5173/admin/vendedores`
- `http://127.0.0.1:5173/vendedor`

Expected:

- Admin login or dashboard loads without a blank screen.
- Navbar shows Resumen, Propiedades, Clientes, Vendedores.
- Each list view has visible rows or an empty state.
- Ver/Edit/Nuevo routes render a panel instead of breaking the SPA.
- Seller portal uses "Clientes" copy and still renders.

- [ ] **Step 5: Final commit**

```bash
git status --short
git add src/admin/AdminApp.jsx src/seller/SellerApp.jsx src/styles.css src/utils/supabase/clients.js src/utils/supabase/sellers.js tests/client-utils.test.js tests/seller-utils.test.js supabase/migrations/*_rename_seller_contacts_to_clients.sql
git commit -m "feat: build admin crm"
```

Skip this commit only if every previous task already committed all changed files and `git status --short` is clean.

## Self-Review

- Spec coverage: The plan covers the CRM dashboard, admin navbar, Propiedades/Clientes/Vendedores pages, detail/edit/new routes, table rename, seller portal continuity, RLS migration, tests, build and browser verification.
- Placeholder scan: No deferred markers or placeholder instructions remain. The large UI tasks specify exact functions, route modes, actions and copy.
- Type consistency: Client fields use `fullName`, `createdBy`, `updatedBy`, `createdAt`, `updatedAt` in UI and snake_case only in Supabase payload/selects. Route sections are `dashboard`, `properties`, `clients`, and `sellers`.
