# DECISIONS

## [BOILERPLATE] App Router over Pages Router
Reason: Next.js 15 best practices, an RSC-first architecture, and cleaner Supabase SSR integration.

## [BOILERPLATE] pnpm over npm/yarn
Reason: Faster installs, stricter dependency resolution, and better disk efficiency.

## [BOILERPLATE] @supabase/ssr over @supabase/auth-helpers-nextjs
Reason: `@supabase/auth-helpers-nextjs` is deprecated. `@supabase/ssr` is the current recommended path.

## [BOILERPLATE] TanStack Query over SWR
Reason: Better support for mutations, optimistic updates, and richer DevTools.

## [BOILERPLATE] Dashboard home routed at /dashboard
Reason: `app/(dashboard)/page.tsx` would collide with `app/page.tsx`, so the protected home was moved to `app/(dashboard)/dashboard/page.tsx`.

## [BOILERPLATE] Keep `typedRoutes` at the top level of `next.config.ts`
Reason: The current Next.js 15 config uses `typedRoutes` as a top-level option instead of `experimental.typedRoutes`.

## [BOILERPLATE] Keep `sonner` instead of the deprecated shadcn `toast` component
Reason: The current shadcn CLI rejects `toast` and directs projects to use `sonner`.

## [BOILERPLATE] Add `components/ui/form.tsx` manually
Reason: The current shadcn CLI did not emit a shared `form.tsx` helper under the active project preset, but the boilerplate expects one for React Hook Form integration.

## [PRD] Start with a dermatology-first MVP on top of a multi-specialty foundation
Reason: The blueprint explicitly recommends dermatology as the smallest high-value entry point, but the product category still needs to expand later into ophthalmology and plastic surgery without another schema reset.

## [DB] Use `practice_id` as the primary tenant boundary on all clinical tables
Reason: Staff-facing workflows, billing, charting, scheduling, and reporting all need consistent row-level isolation. A shared practice boundary keeps RLS understandable and makes later feature work safer.

## [DB] Keep authenticated user profiles separate from patient records
Reason: Staff accounts and patient portal accounts originate from `auth.users`, but patient records are clinical entities that may exist before portal access is enabled and should remain practice-scoped.

## [DB] Use appointments as the first encounter anchor instead of introducing a separate encounters table
Reason: For the MVP, clinical notes, documents, and billing records can attach directly to appointments. A dedicated encounter abstraction can be added later if workflow complexity justifies it.

## [AUTH] Route signed-in users without a membership to `/onboarding`
Reason: Practice creation is the first tenant-establishing write in the MVP. Redirecting authenticated users into onboarding before the dashboard prevents partially configured sessions from reaching staff-facing screens with no practice context.

## [DB] Keep the direct-SQL workflow and maintain `types/supabase.ts` manually for active slices
Reason: The project is explicitly avoiding Supabase CLI usage going forward. Until another generation path is introduced, the app should keep `types/supabase.ts` aligned for the tables used by the current feature slice rather than blocking delivery on CLI-based type generation.

## [AUTH] Keep `/onboarding` inside the protected route group shell
Reason: The onboarding page still requires an authenticated session and benefits from the same signed-in context, but it must remain available before a practice membership exists.

## [DB] Model location-aware staff access with a `practice_member_locations` join table
Reason: Roles and locations already existed independently, but the MVP needed an explicit assignment layer to express which non-admin staff can work out of which offices. A join table keeps the access rule composable and lets later slices reuse it for scheduling without overloading the membership row.

## [MVP] Add staff by linking existing registered profiles before building invitation delivery
Reason: The immediate requirement was practice-side staff management, not a full invitation lifecycle. Looking up an already-registered account by email keeps this slice shippable while leaving room for a later invite flow without rewriting the membership model.

## [ROUTING] Keep the protected shell at top-level module routes with `/dashboard` as the launchpad
Reason: The PRD route surface is top-level (`/patients`, `/appointments`, `/clinical-notes`, `/documents`, `/billing`, `/reports`, `/admin`) rather than nested under `/dashboard`. Keeping those routes inside the shared `(dashboard)` layout preserves one authenticated shell while letting `/dashboard` stay the command center instead of becoming a path prefix for every module.

## [AUTH] Centralize protected route prefixes in one shared dashboard-navigation module
Reason: Middleware and navigation had already drifted on the staff-management route. A single source of truth for protected route prefixes keeps auth gating and sidebar links aligned as more modules are added.

## [INTAKE] Create patient demographics, portal linkage, and primary insurance in one server-side intake action
Reason: Intake is the first place staff collect these records together, and bundling them keeps the directory view coherent immediately after creation. The action uses the server-only admin client after confirming an active practice membership so it can link portal accounts by email and roll back the patient row if primary insurance capture fails.

## [SCHEDULING] Treat `practice_owner` and `provider` memberships as the schedulable provider set
Reason: The current membership model stores one role per user. Allowing owners to remain schedulable covers the common small-practice case where the owner is also a clinician without adding a second role system before the MVP is complete.

## [SCHEDULING] Convert `datetime-local` inputs to UTC in the browser before server-side validation
Reason: Browser `datetime-local` values do not include a timezone. Normalizing them client-side prevents the server runtime timezone from shifting scheduled visit times during validation or insert handling.

## [CHARTING] Enforce clinical-note status transitions server-side
Reason: Client-side controls can drift or be bypassed. Centralizing transition enforcement in server actions ensures notes can only move `draft -> signed -> addendum` regardless of UI state.

## [DOCUMENTS] Keep the initial document slice metadata-first and normalize captured timestamps to UTC
Reason: Upload transport and signed URL plumbing are deferred to a later slice, but document records still need consistent capture metadata now. Converting `datetime-local` captured times to ISO UTC before insert keeps audit and timeline ordering stable across environments.

## [BILLING] Enforce status transitions server-side and derive paid state balance updates in actions
Reason: Billing workflow integrity cannot rely on client state alone. Centralizing transition checks and paid-state side effects (`balance_amount = 0`, `paid_at` stamping) in server actions prevents inconsistent revenue records.

## [PORTAL] Route authenticated non-staff users with linked patient records to `/portal`
Reason: Patient portal users do not have practice memberships and should not be sent into staff onboarding. Redirect logic now distinguishes staff, portal, and unlinked-auth users to preserve role-appropriate entry points.

## [REPORTS] Start with bounded-window operational summaries instead of full analytics primitives
Reason: The MVP needs immediate throughput and revenue visibility without introducing heavy aggregation infrastructure. Time-window snapshots (30/60/90 day) provide actionable insight while keeping implementation lightweight.

## [QA] Scope Vitest to unit suites and keep Playwright in `test:e2e`
Reason: Running Playwright specs inside Vitest causes framework conflicts. Explicitly scoping Vitest includes to `tests/unit` preserves reliable unit gates while `pnpm test:e2e` owns browser workflows.
