---
name: denise-catalan-design
description: Use this skill to generate well-branded interfaces and assets for Denise Catalán Bienes Raíces — a boutique Patagonian real-estate brand (San Martín de los Andes, Argentina) — for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, logos, imagery, and UI kit components for the public marketing site and the admin CRM. Spanish-first (voseo), warm/earthy/elegant, no emoji, WhatsApp-first CTAs.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc.), copy assets out of
`assets/` and create static HTML files for the user to view. If working on production code, you
can copy assets and read the rules here to become an expert in designing with this brand.

Key files:
- `README.md` — brand context, content fundamentals, visual foundations, iconography
- `colors_and_type.css` — color + type tokens (import this; don't hardcode hexes)
- `assets/` — DC monogram logos (SVG/PNG), favicon, Patagonian landscape + property imagery
- `ui_kits/website/` — public marketing site components (hero, map, sliders, search, modals)
- `ui_kits/admin-crm/` — admin CRM components (login, dashboard, lists, editor)
- `preview/` — small specimen cards (colors, type, spacing, components, brand)

Non-negotiables when designing for this brand:
- **Spanish (Argentina), voseo** ("Disfrutá", "Buscá", "Compartinos"); first-name, personal tone.
- **No emoji, ever.** Stay icon-light (the brand ships no icon set).
- Use the **·** middot as the signature separator.
- **WhatsApp-first CTAs** ("Hablar por WhatsApp"), pre-filled and warm.
- Warm boutique palette: **rose→violet primary** (Violeta `#6E4F82`, tweakable), champagne gold +
  powder rose accents; never flat white — use the layered warm page wash. Cormorant Garamond (display) + Manrope (UI).
- Pill buttons & chips, soft 18–20px radii, violet-tinted shadows, full-bleed Patagonian photos
  under green/earth gradient overlays. Never redraw the DC+key monogram — reuse the asset.

If the user invokes this skill without other guidance, ask them what they want to build or
design, ask a few clarifying questions, and act as an expert designer who outputs HTML artifacts
_or_ production code, depending on the need.
