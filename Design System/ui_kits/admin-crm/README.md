# Admin CRM UI Kit — Denise Catalán (`/admin`)

A cosmetic, click-through recreation of the internal **CRM** (`AdminApp` in the source, per
`docs/.../admin-crm-design.md`). It's a lightweight CRM for a one-broker boutique: a dashboard,
and listings for **Propiedades**, **Clientes**, and **Vendedores**, each with view/edit flows.

The CRM is **Manrope-led** (UI/data typeface) with Cormorant Garamond reserved for headings —
warm "soft glass" panels on the brand's page wash, forest-green primary actions.

## Run it
Open `index.html`. Loads `../../colors_and_type.css` + `kit.css`, Lucide (icons), then mounts
`components.jsx`. **Login with the prefilled credentials** ("Ingresar") to enter the shell.

## What's interactive
- **Login → shell** — submit the login form to authenticate (cosmetic).
- **Navbar** — switch between Resumen / Propiedades / Clientes / Vendedores.
- **Dashboard** — metric cards, recent activity feed, quick-action buttons (jump to a section).
- **Propiedades** — live **search** by title/location/category; **Editar** opens the property
  editor (two-column form + sidebar thumbnail); "← Volver" returns.
- **Clientes** — filter by operation; status pills per client.
- **Vendedores** — active/inactive status + client counts.

## Components (`components.jsx`)
| Component | Role |
|---|---|
| `Login` | Branded login panel |
| `Header`, `Navbar` | Shell chrome + tab navigation |
| `Dashboard`, `MetricCard` | KPIs, activity feed, quick actions |
| `PropertiesList` / `PropertyEdit` | Searchable table + full editor form |
| `ClientsList`, `SellersList` | Filterable CRM tables |
| `Pill` | Category pill (shared color language with the website) |
| `Icon` | Thin Lucide line icon (see substitution note) |

## ⚠️ Iconography substitution
The brand **ships no icon set**. This kit uses a handful of **Lucide** line icons (CDN, light
stroke) purely to make the CRM toolbar/navbar legible — flagged in the system README. Swap for a
brand set if one is ever created; the public website kit uses **no** icons (only Unicode ‹ › ×),
matching production.

## Faithful to the source, with cosmetic shortcuts
- Real `/admin` uses **Supabase** (auth, RLS, `properties` / `clients` / `seller_profiles`) and
  has no routing library — `AdminApp` resolves views from `window.location.pathname`. This kit
  fakes auth + data and routes via React state. The visual language, layout, and flows match the
  approved CRM spec.
- Sample data lives in `index.html`.
