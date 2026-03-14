# TASKS

## Boilerplate Setup
- [x] Next.js 15 project initialised (2026-03-13 18:13)
- [x] All dependencies installed (2026-03-13 18:13)
- [x] Folder structure scaffolded (2026-03-13 18:13)
- [x] Supabase SSR client configured (2026-03-13 18:13)
- [x] Middleware auth guard configured (2026-03-13 18:13)
- [x] shadcn/ui initialised (2026-03-13 18:13)
- [x] Vitest configured (2026-03-13 18:13)
- [x] Playwright configured (2026-03-13 18:13)
- [x] /doc context files created (2026-03-13 18:13)
- [x] Boilerplate reconciliation pass completed (2026-03-14 02:02)
- [x] Run `pnpm dev`, `pnpm build`, and `pnpm test` manually outside the Codex sandbox (2026-03-14 16:30 - `pnpm test` verified locally and production `pnpm build` validated through successful Vercel build/deploy)

## Planning
- [x] Parse the blueprint PDF and rewrite `/doc/PRD.md` with MVP scope, users, entities, non-goals, and success criteria (2026-03-14 09:55)
- [x] Decompose the MVP into sequenced implementation milestones in `/doc/TASKS.md` (2026-03-14 09:55)

## Database & Auth Foundation
- [x] Create the first Supabase migration for practices, memberships, locations, patients, insurance, appointments, clinical notes, documents, billing, and audit logs with RLS (2026-03-14 09:55)
- [x] Apply the migrations to the target Supabase database and regenerate `types/supabase.ts` (2026-03-14 17:06 - migration history reconciled with DB password, `pnpm db:migrate` reports up to date, and type safety restored for `practice_member_locations`/`has_location_access`)
- [x] Implement auth and practice onboarding so a signed-in owner can create a practice and land in the protected app (2026-03-14 10:50)
- [x] Build staff role management for practice members and location-aware access (2026-03-14 11:15)
- [x] Build the protected dashboard shell and navigation for patients, scheduling, charting, billing, documents, and reports (2026-03-14 11:29)

## MVP Application Slices
- [x] Implement patient intake and directory flows for demographics, contact details, allergies, portal linkage, and insurance capture (2026-03-14 11:41)
- [x] Implement appointment scheduling with provider, location, appointment type, and lifecycle status management (2026-03-14 12:03)
- [x] Implement dermatology-first clinical documentation with SOAP notes, diagnosis codes, and patient visibility toggles (2026-03-14 12:18)
- [x] Implement document and clinical photo management with metadata, secure storage references, and consent-friendly visibility control (2026-03-14 12:31)
- [x] Implement basic billing workflows for CPT-coded charge records, balances, and billing status tracking (2026-03-14 12:38)
- [x] Implement the patient portal baseline for appointments, visible documents, visible notes, and balances (2026-03-14 12:41)
- [x] Implement basic reporting views for appointment throughput, billing status, and patient activity (2026-03-14 12:41)

## QA & Release
- [x] Add unit coverage for validations, helpers, and data access paths introduced by the MVP (2026-03-14 12:44)
- [x] Add Playwright coverage for auth, patient intake, scheduling, charting, and billing happy paths (2026-03-14 12:44)
- [x] Run a final review pass before the first feature commit once the vertical slices above are complete (2026-03-14 12:44)
