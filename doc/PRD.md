# PRD - Product Requirements Document
> Status: ACTIVE - Updated 2026-03-14 from `nextech_blueprint_20260309_192855.pdf` (generated March 09, 2026).

## Product Summary
Mahakurukshetra will be a cloud-native specialty EHR for small-to-medium specialty practices. The MVP is dermatology-first, but the product and schema should stay extensible to ophthalmology and plastic surgery. The core promise is faster clinical workflows, image-friendly charting, modern scheduling, and cleaner billing UX than legacy specialty EHR platforms.

## Problem Statement
Legacy specialty EHR systems are functionally dense but operationally painful. Clinics struggle with slow patient intake, rigid scheduling, fragmented imaging and document workflows, and billing tools that create revenue-cycle drag. Small and mid-sized specialty practices need a system that keeps clinical quality high without forcing staff through dated, generic workflows.

## Target Users
- Practice owner or administrator responsible for setup, staff access, and operational oversight
- Provider responsible for charting, diagnoses, treatment planning, and follow-up care
- Clinical staff responsible for intake, documentation support, and document or photo handling
- Front-desk and billing staff responsible for scheduling, insurance capture, and charges
- Patient portal user responsible for reviewing appointments, records, and balances

## Product Goals
- Deliver a dermatology-first MVP that handles patient intake, scheduling, charting, documents or photos, and basic billing end to end.
- Support both single-location and multi-location practices through a practice-scoped data model.
- Provide a secure patient portal baseline without weakening staff-facing workflows or RLS boundaries.
- Keep the platform structurally ready for later specialty expansion, imaging integrations, analytics, and AI-assisted tooling.

## MVP Scope
### In Scope
- Auth and practice onboarding
- Practice, staff role, and location management
- Patient registration, demographics, insurance, and chart identifiers
- Appointment scheduling with provider, location, and status tracking
- Dermatology-oriented clinical documentation with SOAP-style notes and diagnosis codes
- Patient documents, consent records, and clinical photo metadata or storage references
- Basic billing and claim-status tracking for completed visits
- Patient portal visibility controls for notes, documents, appointments, and balances
- Basic operational reporting for appointments and billing states

### Out of Scope for MVP
- DICOM viewers and direct diagnostic equipment integrations
- AI-powered diagnostic assistance, predictive analytics, and voice dictation
- Telehealth and remote examination tooling
- Inventory management, IoT integrations, and predictive equipment maintenance
- Referral workflows, quality reporting, and clinical trial management
- Multi-specialty UI packs beyond the initial dermatology workflow set

## Core Workflow Slices
### Staff
- Sign in and create or join a practice
- Maintain locations and role-based staff access
- Register a patient, capture insurance, and assign a chart number
- Book an appointment with provider and location
- Complete clinical notes, attach documents or photos, and mark items patient-visible when appropriate
- Create billing records tied to appointments and track charge status

### Patient
- Sign in to the portal
- Review appointment details
- View patient-visible notes and documents
- Review balances and billing status for completed visits

## Data Model Direction
The MVP data model should center on a multi-tenant `practice_id` boundary and cover the following core entities first:

- Practice
- Staff profile and practice membership
- Location
- Patient
- Insurance policy
- Appointment
- Clinical note
- Patient document and clinical photo metadata
- Billing record
- Audit log

Later phases can extend this foundation with procedures, referrals, inventory, lab integrations, imaging workflows, advanced analytics, and specialty-specific modules.

## API / Route Surface
Initial implementation should expect application slices around the following route groups or endpoint families:

- `/auth`
- `/dashboard`
- `/patients`
- `/appointments`
- `/clinical-notes`
- `/documents`
- `/billing`
- `/reports`
- `/admin`

## Competitive Positioning
The product should compete on modern UX, mobile-friendly workflows, and cleaner end-to-end operations rather than trying to match every legacy feature on day one. The MVP should prove that a focused specialty workflow beats a generic EHR for both staff efficiency and patient experience.

## Success Criteria
- Staff can onboard a practice, add locations and staff, register patients, book appointments, complete notes, attach documents or photos, and create billing records without leaving the app.
- Patient portal users can view their appointments, patient-visible records, and billing summaries under RLS.
- Practice data stays isolated through row-level security on every core table.
- The first release supports one specialty end to end without placeholder-only flows.
- The app is structurally ready for later expansion into imaging, AI, analytics, and other specialty modules.
