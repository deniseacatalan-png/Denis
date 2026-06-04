# Website UI Kit — Denise Catalán (public marketing site)

A cosmetic, click-through recreation of the public-facing marketing site (`PublicApp` in the
source). It's the brand's storefront: a photographic hero, a map of listings, category sliders,
a personalized rental-search form, and WhatsApp-first CTAs.

## Run it
Open `index.html`. It loads `../../colors_and_type.css` (tokens) + `kit.css` (kit styles) and
mounts the React app from `components.jsx`.

## What's interactive
- **Map pins** — click a colored pin to select that property; the details panel updates.
- **Property sliders** — three horizontal scroll-snap rows (venta / turístico / permanente) with
  a `current / total` counter and ‹ › pill nav. Click a card to select it; click again (or the
  "Ver descripción completa" link) to open the **detail modal**.
- **Details panel** — "Ver ficha técnica" opens the modal; "Hablar por WhatsApp" deep-links to
  a pre-filled WhatsApp message.
- **Rental search** — permanente/turístico toggle + fields; "Enviar búsqueda por WhatsApp"
  composes a structured message. "Limpiar búsqueda" resets.
- **Solicitar servicios** (nav) — opens the service modal (Vender / Alquilar / Invertir / Otros).

## Components (`components.jsx`)
| Component | Role |
|---|---|
| `StatusPill` | Category pill (color per listing status) |
| `Button` | Pill button — `primary` (green gradient) / `soft` (champagne) / `nav` |
| `Eyebrow`, `SectionTitle` | Italic eyebrow + serif H2 section header |
| `TopNav` | Logo + "Solicitar servicios" |
| `Hero` | Overline, H1, italic tagline, place line |
| `MapPanel` | Faux Leaflet map — aerial photo + colored circle markers |
| `DetailsPanel` | Selected-property ficha with stats + CTAs |
| `PropertyCard` / `PropertySlider` | Full-bleed image listing cards in a snap carousel |
| `RentalSearch` | Personalized rental request form → WhatsApp |
| `PropertyDetailModal`, `ServiceModal` | Overlays |

## Faithful to the source, with cosmetic shortcuts
- The real site uses **Leaflet + OpenStreetMap** and pulls live listings from **Supabase**. This
  kit fakes the map with an aerial photo + positioned markers, and uses inline sample data — the
  *look*, copy, and interactions match; the data layer does not.
- WhatsApp links are real `wa.me` deep links (same format as production).

## Notes
- Spanish (Argentina), *voseo*, no emoji, **·** separators — match this when extending.
- Sample property data lives in `index.html`; swap titles/prices/images freely.
