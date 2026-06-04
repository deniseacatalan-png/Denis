# Denise Catalán Bienes Raíces — Design System

A boutique real-estate brand based in **San Martín de los Andes, Patagonia Argentina**.
Denise Catalán sells and rents homes, mountain cabins, and land (terrenos/lotes) across
the Lácar lake region and surrounding Andean valleys. The brand voice is warm, personal,
and refined — an *inmobiliaria boutique* rather than a high-volume listings portal.

> **Tagline:** *"Disfrutá la tranquilidad de estar, donde querés estar."*
> ("Enjoy the calm of being right where you want to be.")

The product is built in **Spanish (Argentina)**. All copy, labels, and examples in this
system are Spanish-first.

---

## Sources

This design system was reverse-engineered from the brand's live web product:

- **GitHub:** https://github.com/deniseacatalan-png/Denis  (org mirror: https://github.com/p2pdevmedia/Denis)
  - React + Vite app. Key files studied:
    - `src/App.jsx` — public marketing site (`PublicApp`)
    - `src/admin/AdminApp.jsx` — admin CRM
    - `src/seller/SellerApp.jsx` — seller portal
    - `src/styles.css` — the full stylesheet (the **authoritative** source of truth)
    - `public/` — logos (`isodc.svg`, `ISO DC.png`, `logo-dc.svg`) and property imagery
  - `docs/superpowers/specs/` — product specs for the admin CRM

The reader is encouraged to explore the repository above to build richer, more faithful
designs — particularly `src/styles.css`, which contains several theme layers (see note below).

### ⚠️ A note on theme layers
`src/styles.css` contains **three** stacked `:root` blocks. An early **warm earthy** base
was overwritten by an experimental **magenta-glass dark theme** (`#F05DCE` + gold), which was
then itself reverted by a final *"Soft responsive polish"* layer back to the **warm, earthy
boutique palette**. **The final layer wins** — so the *source* live site is warm forest-green &
champagne, *not* the magenta experiment.

> **Current brand direction (per the owner):** this design system has since adopted a
> **rose→violet primary** (Violeta `#6E4F82`) in place of forest green, keeping the warm
> champagne/rose accents and the same boutique spirit. The primary color is **tweakable** in both
> UI kits. Forest green is retained only as the "vendido" (sold) category color. If you need the
> original green site, set `--brand: var(--verde-bosque)`.

---

## Index — what's in this folder

| Path | What it is |
|---|---|
| `README.md` | This file — brand context, content & visual foundations, iconography |
| `SKILL.md` | Agent-Skill manifest (works in Claude Code) |
| `colors_and_type.css` | All color + type tokens (CSS vars) — **import this in every artifact** |
| `assets/` | Logos (SVG + PNG), favicon, Patagonian landscape + property imagery |
| `preview/` | Small specimen cards that populate the Design System tab |
| `ui_kits/website/` | Public marketing site UI kit (hero, map, property sliders, search, modal) |
| `ui_kits/admin-crm/` | Admin CRM UI kit (login, dashboard, lists, edit forms) |

No fonts are bundled — the product loads **Cormorant Garamond** and **Manrope** from Google
Fonts via `@import` in `colors_and_type.css`. No slide template was provided, so no `slides/`
folder was created.

---

## CONTENT FUNDAMENTALS

**Language.** Spanish (Argentina), using *voseo* — the informal second person *vos* ("Disfrutá",
"Compartinos", "Buscá"). This is central to the brand's warmth: it speaks **to you, like a friend**,
never formally (*usted*).

**Person & address.** First-person plural for the business ("nuestra propuesta integral",
"Compartinos el detalle"); informal second person for the visitor. Denise is referred to by
**first name** — WhatsApp messages open *"Hola Denise, …"*. It's a personal, one-broker brand.

**Tone.** Calm, aspirational, grounded. Sells a *feeling of place* ("Hogares para vivir la
Patagonia", "Estadías y escapadas") before specs. Never pushy or salesy; no urgency tactics,
no "¡OFERTA!", no exclamation spam.

**Casing.**
- Headings & titles: **sentence case** ("Propiedades disponibles", "Plano de ubicaciones").
- Eyebrows / status pills / micro-labels: **UPPERCASE**, lightly tracked ("EN VENTA",
  "SAN MARTÍN DE LOS ANDES · PATAGONIA ARGENTINA").
- Body: sentence case, generous and unhurried.

**Punctuation & separators.** The middot **·** is the signature separator
("San Martín de los Andes · Patagonia Argentina · WhatsApp: +54 9 2944 68-8613"). Accents are
always correct (Catalán, San Martín, ubicación). Note: some source strings drop accents in code
(`descripcion`, `tecnica`) — **always restore correct accents in finished copy.**

**Vocabulary (use these exact terms):**
- *Venta* (sale) · *Alquiler turístico* (holiday rental) · *Alquiler permanente* (long-term rental)
- *Vendido* (sold) · *En proceso / sin valor* (in process / no listed price → "Consultar")
- *Ficha técnica* (technical sheet) · *Propiedad* · *Terreno / Lote* (land) · *Ambientes* (rooms)
- *Bienes Raíces* (real estate) · *Inmobiliaria boutique*

**Emoji.** **None.** The brand never uses emoji. Don't introduce them.

**CTAs.** The primary action is almost always **WhatsApp** ("Hablar por WhatsApp", "Consultar
por WhatsApp", "Enviar búsqueda por WhatsApp"). Messages are pre-filled, warm, and specific.
Secondary actions are quiet ("Ver ficha técnica", "Seleccionar en mapa", "Limpiar búsqueda").

**Example copy (verbatim from product):**
- Eyebrow: *"Inmobiliaria boutique en Patagonia"*
- Eyebrow: *"Una selección dentro de nuestra propuesta integral"*
- Section: *"Estadías y escapadas"* / *"Hogares para vivir la Patagonia"*
- Empty state: *"No hay propiedades en venta disponibles por el momento."*
- Loading: *"Leyendo las propiedades reales..."*
- Pre-filled WA: *"Hola Denise, quiero información sobre: {título} ({precio}) en {ubicación}."*

---

## VISUAL FOUNDATIONS

**Overall vibe.** Warm, earthy, feminine-but-grounded boutique elegance. Think a refined
Patagonian *estancia* — natural materials, soft light, mountain-and-lake calm. High-contrast
serif typography against a warm cream wash, with forest green doing the heavy lifting and
champagne gold + powder rose as jewelry.

**Color.** See `colors_and_type.css` for tokens.
- **Primary:** Violeta `#6E4F82` (rose-violet) — headings, primary buttons, brand. Deep variant
  Violeta Profundo `#4D3661`. The brand sits in a **rose→violet range** (Rosa Nude `#D9A8AD` →
  Rosa Magenta `#C97AA8` → Rosa Profundo `#A86F7A` → Malva `#8E6A96` → Violeta → Violeta Profundo).
  *The primary color is **tweakable** — both UI kits expose a "Color primario" control (violet /
  rose / mauve / plum) that re-derives `--brand`, `--brand-deep`, and the button gradient live.*
- **Accents:** Champagne `#D8BF8F` (gold, borders/chips — complements the violet), Rosa Profundo
  `#A86F7A` (rose), Marrón Tierra `#8A6A4F` (earth — used for eyebrows/meta).
- **Neutrals:** Tinta `#23231F` (text), Gris Texto `#6D655D` (muted), Blanco Cálido `#FFFAF4`.
- **Listing categories** each own a color, now **unified within the violet range**: orchid=venta,
  mauve=turístico, violet=permanente, deep plum=vendido, soft lilac=proceso. These same colors
  tint the map pins and the CRM status/category pills, so the whole system reads as one family.

**Backgrounds.** *Never flat white.* The page is a **layered warm wash** — three soft radial
glows (rose top-left, champagne top-right, violet bottom) over a cream→lavender linear gradient,
`background-attachment: fixed`. The hero is a **full-bleed Patagonian landscape photo** under a
violet → rose diagonal gradient. No repeating patterns or textures; no hand-drawn
illustration. Imagery is the texture.

**Typography.** Display = **Cormorant Garamond** (a high-contrast serif) for H1–H3, prices, *and*
body copy — set tight (`line-height ~0.95`) and large at display sizes, with frequent **italics**
for taglines and eyebrows. UI = **Manrope** for forms, tables, navigation, counters, and metrics.
The two-typeface contrast (elegant serif + clean grotesque) is core to the look.

**Imagery color/mood.** Cool, natural Patagonian palette (deep lake blues, forest greens, snow,
golden grass) — warmed and unified by the green/earth gradient overlays the brand lays on top.
Photos are full-color (not B&W), no heavy grain. Aerial/satellite plot maps with outlined lot
boundaries are common for land listings — treat them as authentic, not placeholders.

**Cards & surfaces.** Warm translucent panels: `background: rgba(255,250,244,0.88)` +
`backdrop-filter: blur(8px)`, a hairline violet-tinted border `rgba(110,79,130,0.15)`,
`border-radius: 18px`, and a soft violet-tinted shadow `0 18px 36px rgba(77,54,97,0.14)`.
Image listing cards are darker: full-bleed photo + a layered dark gradient for text legibility,
white serif title, `border-radius: 20px`.

**Corner radii.** Soft and generous: inputs `10px`, inner tiles `14px`, cards/panels `18px`,
media frames & image cards `20px`, large feature panels `26px`, and **pills `999px`** for every
button, chip, status, and counter.

**Borders.** Almost always hairline (1px) and **violet-tinted** (`rgba(110,79,130,0.15)`) or
**champagne** (`rgba(216,191,143,0.44)`) on warm chips. No heavy or dark outlines.

**Shadows.** A single violet-tinted family (never neutral grey): button `0 10px 22px / .20`,
card `0 18px 36px / .14`, hover lift `0 18px 40px / .24`. Image cards use a deeper
`0 16px 32px rgba(77,54,97,0.22)`.

**Transparency & blur.** Used deliberately for the "warm glass" feel — translucent cream panels
over the gradient page, `backdrop-filter: blur(8px)`. Status pills and chips sit on translucent
color fields (e.g. `rgba(217,168,173,0.48)`), never solid blocks.

**Buttons.** Pill-shaped. **Primary** = forest-green gradient
`linear-gradient(135deg, #5f7765, #2f4f3e)` with white text (WhatsApp / main CTAs).
**Soft/secondary** = champagne field `rgba(239,225,195,0.82)` with forest-green text.
A subtle diagonal **sheen sweep** can pass across buttons on hover.

**Animation.** Gentle and short (`0.2–0.25s ease`). Cards **lift** (`translateY(-4px)`) and
deepen their shadow on hover; the map **flies** to a selected property (`flyTo`, ~1.1s). No
bounces, no springy/playful motion, no infinite loops. Calm and understated.

**Hover states.** Lift + shadow deepen + border shifts toward champagne
(`rgba(216,191,143,0.74)`). Links shift color (earth/rose → forest green). Image cards lighten
their dark scrim on hover.

**Press / focus.** Focus rings are champagne/gold (`rgba(198,167,105,0.24–0.9)`), often as an
`outline` or soft `box-shadow` halo. No hard blue browser default.

**Layout rules.** Centered content column `width: min(1200px, 92vw)`. The hero content slightly
**overlaps** the content below (negative top margin). Generous `clamp()`-based responsive padding.
Property listings are **horizontal scroll-snap sliders** (one row per category) with a
`current / total` counter and prev/next pill nav.

---

## ICONOGRAPHY

**There is almost no icon system.** The brand is deliberately spare with iconography — it leans
on **typography, color, and photography** instead of icons.

- **No icon font, no SVG icon set, no Heroicons/Lucide/Font Awesome** in the source.
- **No emoji**, ever.
- The few "icons" present are **Unicode glyphs used as controls**:
  - Slider navigation: **‹** and **›** (U+2039 / U+203A) in pill buttons.
  - Modal close: **×** (multiplication sign) as the dismiss affordance.
- **Map markers** are simple colored **`CircleMarker`** dots (Leaflet), tinted by listing
  category — they double as the only "status icon" in the product.
- The **only true brand graphic** is the **DC monogram** (`assets/logo-dc-mark.svg` /
  `.png`) — the founder's initials joined by an ornate **vintage skeleton key**. The key is the
  brand's signature motif and the closest thing to an icon; reuse it as a favicon, bullet, or
  decorative accent rather than inventing new icons.

**Guidance for new work.** Stay icon-light. Prefer a labeled pill, an eyebrow, or a photo over
an icon. If a UI genuinely needs functional icons (e.g. an admin CRM toolbar), use a **thin,
minimal line set** (e.g. Lucide via CDN) at a light stroke weight to match the refined serif feel —
and **flag it as a substitution**, since the brand ships none today. Keep them sparse, monochrome
(forest green or earth), and never decorative.

> **Substitution flag:** No icon set exists in the source. The admin CRM kit in this system uses
> a handful of **Lucide** line icons (CDN) purely to make the toolbar legible. Swap for a brand
> set if one is ever created.

---

## How to use this system

1. Link `colors_and_type.css` and use the CSS variables — don't hardcode hexes.
2. Pull real assets from `assets/` (logo, landscapes). Never redraw the monogram.
3. Match the voice: Spanish, *voseo*, warm, no emoji, WhatsApp-first CTAs, **·** separators.
4. Compose from the UI kits in `ui_kits/` for product-accurate screens.
