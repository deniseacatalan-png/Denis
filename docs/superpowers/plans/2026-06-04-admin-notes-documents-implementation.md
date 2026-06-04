# Admin Notes And Documents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add internal notes and document/image attachments to admin property/client records and seller client records.

**Architecture:** Add four Supabase tables with RLS, a focused `activity` helper module for notes/documents, reusable React panels for notes and documents, and extend the existing Vercel Blob upload token endpoint for internal attachments. Keep route handling inside the existing React/Vite apps.

**Tech Stack:** React 18, Vite, Supabase JS/SSR, Supabase Postgres/RLS, Vercel Blob client upload, Node test runner.

---

## File Structure

- Create `supabase/migrations/<timestamp>_add_notes_and_documents.sql` for tables, indexes, grants, and RLS.
- Create `src/utils/supabase/activity.js` for normalize/payload/fetch/create helpers.
- Create `tests/activity-utils.test.js` for helper behavior.
- Modify `api/blob/upload.js` to support internal property/client attachments with authenticated admin/seller checks.
- Modify `src/admin/AdminApp.jsx` to load profile context and render notes/documents on property and client views.
- Modify `src/seller/SellerApp.jsx` to render client notes/documents in the seller portal.
- Modify `src/styles.css` for shared panels.

## Tasks

- [ ] Add failing tests for activity helper normalization and payload validation.
- [ ] Implement `src/utils/supabase/activity.js` until tests pass.
- [ ] Add Supabase migration for notes/document tables, RLS, indexes, and Data API grants.
- [ ] Extend `/api/blob/upload` to authorize `property-document` and `client-document` uploads and validate file types.
- [ ] Add shared Notes/Documents panels and wire them into admin property/client detail pages.
- [ ] Wire the client panels into the seller portal.
- [ ] Run `npm test` and `npm run build`.
- [ ] Start the Vite dev server and smoke test the rendered admin/seller surfaces.
