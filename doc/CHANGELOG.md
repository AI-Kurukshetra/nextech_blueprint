# CHANGELOG

## Boilerplate
- Initialised Next.js 15 with App Router + Turbopack
- Installed Supabase SSR, TanStack Query, React Hook Form, Zod, nuqs, shadcn/ui, Vitest, and Playwright
- Scaffolded the full folder structure per `AGENTS.md`
- Configured TypeScript strict mode
- Configured Vitest and Playwright
- Added the Supabase SSR client, server, and middleware pattern
- Added the auth callback route handler
- Wired TanStack Query, theme, and toaster providers

## Reconciliation
- Added `components/ui/form.tsx` as the shared React Hook Form helper expected by the boilerplate.
- Kept `/dashboard` implemented at `app/(dashboard)/dashboard/page.tsx` because `app/(dashboard)/page.tsx` would collide with the root route.
- Kept `typedRoutes` at the top level of `next.config.ts` to match the current Next.js 15 config shape.
- Kept `sonner` as the toast system because the current shadcn CLI deprecates the old `toast` component.
- Verified `pnpm typecheck` and `pnpm lint` in Codex. `pnpm dev`, `pnpm build`, and `pnpm test` were intentionally deferred to the local terminal.

## PRD Ingestion & Core Schema
- Replaced the placeholder PRD with a dermatology-first specialty EHR MVP derived from the uploaded Nextech blueprint PDF.
- Rebuilt the task tracker into ordered implementation slices covering schema, auth and onboarding, patient intake, scheduling, charting, documents, billing, portal access, reporting, and QA.
- Added `supabase/migrations/20260314095500_create_core_ehr_tables.sql` with the initial multi-tenant tables, enums, helper functions, auth/profile triggers, indexes, and row-level security policies.
- Updated `doc/SCHEMA.md` and `doc/DECISIONS.md` to capture the initial schema and architecture decisions behind the MVP data model.

## Auth & Practice Onboarding
- Marked the initial Supabase migration as manually applied through the Supabase SQL editor and aligned `types/supabase.ts` for the auth/onboarding paths without using the Supabase CLI.
- Added validated server actions for sign-in, sign-up, sign-out, profile sync recovery, and owner practice creation.
- Replaced the placeholder login and register pages with React Hook Form + Zod flows and created the protected `/onboarding` practice setup route.
- Added a cached user-practice session helper and updated the root route, dashboard layout, and dashboard page to route signed-in users into onboarding until a practice membership exists.
- Added unit coverage for slug normalization, onboarding validation, and sign-up password confirmation.

## Team Access & Locations
- Added `supabase/migrations/20260314121500_add_practice_member_location_access.sql` with the `practice_member_locations` join table, the `has_location_access()` helper, and updated RLS policies for location-aware appointment and location reads.
- Added a server-only Supabase admin client plus validated team management actions for creating locations, adding existing registered staff to a practice, and updating roles, specialties, active state, and location assignments.
- Added the protected admin workspace for roster management, location creation, member editing, and location-scoped access management.
- Extended `types/supabase.ts` manually for `locations`, `practice_member_locations`, and `has_location_access()` while explicitly leaving the broader type-regeneration task open.
- Added unit coverage for location code normalization and team membership validation rules.

## Protected Shell & Navigation
- Added `lib/dashboard/navigation.ts` as the shared source of truth for protected route prefixes, sidebar sections, and shell copy for the module workspaces.
- Expanded middleware protection beyond `/dashboard` and `/onboarding` to cover `/patients`, `/appointments`, `/clinical-notes`, `/documents`, `/billing`, `/reports`, `/admin`, and the legacy `/team` redirect.
- Reworked the sidebar into grouped navigation for command, clinical, and revenue areas, and upgraded the `/dashboard` overview into a launchpad for all protected workspaces.
- Added protected shell pages for `/patients`, `/appointments`, `/clinical-notes`, `/documents`, `/billing`, and `/reports` using a shared module-shell component.
- Moved the team-management experience to `/admin` and turned `/team` into a redirect for route compatibility.
- Added unit coverage for the shared protected-route helper used by middleware.

## Patient Intake & Directory
- Extended `types/supabase.ts` manually for `patients` and `patient_insurance_policies` so the new intake and directory slice can type-check without a full regenerated schema file.
- Added `app/actions/patients.ts` with validated patient intake, optional portal profile linkage by existing account email, and optional primary insurance capture.
- Replaced the patient shell with a real `/patients` workspace that loads the directory server-side and pairs it with a client-side intake form plus search/filter experience.
- Added reusable patient components for the intake form and directory cards under `components/patients/`.
- Added unit coverage for chart-number normalization, delimited field parsing, and patient intake validation rules.

## Scheduling & Review Fixes
- Hardened multi-step admin writes by making patient-intake rollback messaging reflect rollback failures and by rolling back or restoring team memberships when location-assignment writes fail.
- Cleaned the patient-directory display separators so demographic, contact, and insurance summaries render correctly.
- Added `app/actions/appointments.ts` with validated appointment creation, provider-location access checks, overlap detection, status-transition enforcement, and patient `last_visit_at` updates on completion.
- Replaced the appointments shell with a real scheduling workspace at `/appointments`, including the appointment form, agenda search/date filter, and lifecycle status controls.
- Extended `types/supabase.ts` manually for the `appointments` table and added unit coverage for scheduling validation, UTC normalization, and status-transition rules.

## Clinical Notes
- Added clinical-note validation schemas, transition checks, diagnosis normalization, and submission helpers in `lib/validations/index.ts`.
- Extended `types/supabase.ts` manually for the `clinical_notes` table to unblock strongly-typed charting reads and writes.
- Added `app/actions/clinical-notes.ts` with validated note creation, status transitions, and patient-visibility updates.
- Replaced `/clinical-notes` shell content with a real charting workspace that loads patients, appointments, notes, memberships, and author profiles.
- Added reusable charting UI components in `components/clinical-notes/` and unit coverage in `tests/unit/clinical-note-validations.test.ts`.

## Documents & Clinical Photos
- Added document validation schemas and submission normalization in `lib/validations/index.ts`, including UTC normalization for optional captured timestamps.
- Extended `types/supabase.ts` manually for the `patient_documents` table.
- Added `app/actions/documents.ts` for validated metadata create flow and patient-visibility toggles with appointment-to-patient checks.
- Replaced `/documents` shell content with a real document workspace wired to patient, appointment, and author context.
- Added reusable document UI components in `components/documents/`, switched post-update refresh from hard reload to `router.refresh()`, and added `tests/unit/document-validations.test.ts`.

## Billing
- Added billing validation schemas, code normalization helpers, status-transition guardrails, and submission normalization in `lib/validations/index.ts`.
- Extended `types/supabase.ts` manually for `billing_records`.
- Added `app/actions/billing.ts` for billing record creation, appointment/patient/insurance/provider validation, and status transitions with balance handling.
- Replaced `/billing` shell content with a live billing workspace using `components/billing/create-billing-record-form.tsx` and `components/billing/billing-board.tsx`.
- Added unit coverage in `tests/unit/billing-validations.test.ts`.

## Portal & Reports
- Added authenticated patient-portal routing decisions so login/register redirects now route staff to `/dashboard`, portal users to `/portal`, and unlinked users to `/onboarding`.
- Added `app/(portal)/layout.tsx` and `app/(portal)/portal/page.tsx` to deliver the patient portal baseline for appointments, visible documents, visible notes, and balances.
- Replaced `/reports` shell content with live operational summaries for appointment throughput, billing pipeline state, and patient activity.
- Updated dashboard navigation/status metadata so documents, billing, and reports are marked live.

## QA Baseline
- Added `tests/e2e/mvp-happy-path.spec.ts` covering auth plus patient intake, scheduling, charting, and billing happy-path progression (env-gated by `E2E_STAFF_EMAIL` and `E2E_STAFF_PASSWORD`).
- Updated `vitest.config.ts` to include only `tests/unit/**/*.test.ts` so unit and E2E suites do not conflict.
- Verified quality gates with `pnpm typecheck`, `pnpm lint`, `pnpm test`, and Playwright test discovery via `pnpm test:e2e -- --list`.

## Git + Vercel Delivery
- Repointed repository delivery to `https://github.com/AI-Kurukshetra/nextech_blueprint` and pushed all MVP + fix commits on `main`.
- Created and linked Vercel project `nextech-blueprint`, then configured production env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`).
- Repaired deployment blockers discovered on Vercel builds:
  - Restored `types/supabase.ts` after accidental empty overwrite.
  - Refactored server action files to keep `"use server"` at file scope with async-only value exports.
  - Switched middleware imports to edge-compatible relative paths.
- Deployed successfully and aliased production to `https://nextech-blueprint.vercel.app`.

## Supabase Link + Type Sync Follow-up
- Linked the workspace to Supabase project `qoommnnvgrdxljdyiilw` using a personal access token.
- Regenerated `types/supabase.ts` from remote metadata and then patched in the `practice_member_locations` table/function typing to match the app's active migration usage.
- Migration history reconciliation is now complete after DB-password authentication and repair verification.

## Supabase Migration Reconciliation Complete
- Reconciled migration history using DB-password authentication and verified local/remote versions are aligned (`20260314095500`, `20260314121500`).
- Confirmed `pnpm db:migrate` now reports `Remote database is up to date`.
- Restored strict type safety by re-adding `practice_member_locations` and `has_location_access` in `types/supabase.ts` after Supabase type generation omitted them.
- Re-ran quality gates successfully: `pnpm typecheck`, `pnpm lint`, and `pnpm test`.

## Production Middleware Stabilization
- Hardened `lib/supabase/middleware.ts` to avoid runtime crashes when Edge auth surface differs (`getUser` fallback to `getSession`).
- Changed middleware env handling to fail safe: protected routes redirect to `/login` and public routes continue instead of returning a global 500.
- Re-ran quality gates successfully: `pnpm typecheck`, `pnpm lint`, and `pnpm test`.

## ESM Path Compatibility Hotfix
- Updated `vitest.config.ts` to remove `path.resolve(__dirname, ".")`.
- Replaced alias resolution with `new URL(".", import.meta.url).pathname`.
- Removed `path` import from `vitest.config.ts`.

## Edge Middleware Runtime Hotfix
- Replaced Supabase client initialization in `lib/supabase/middleware.ts` with cookie-based session gating to avoid edge-runtime `__dirname` failures.
- Preserved protected-route redirects (`/login?next=...`) and auth-route redirect behavior for signed-in sessions.
- Re-ran quality gates successfully: `pnpm typecheck`, `pnpm lint`, and `pnpm test`.

## One-Page PRD UI
- Replaced `app/page.tsx` redirect logic with a full one-page interactive experience matching PRD scope.
- Added sections for product positioning, module-by-module scope coverage, role coverage, and testing access credentials.
- Applied a bold color-forward layout (cyan/emerald/amber accents on slate background) with interactive details cards and responsive structure.
