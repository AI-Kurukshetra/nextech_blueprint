# SCHEMA
> Current focus: dermatology-first specialty EHR MVP with practice-scoped multi-tenancy.

## Enums
- `medical_specialty`: `dermatology`, `ophthalmology`, `plastic_surgery`
- `staff_role`: `practice_owner`, `practice_admin`, `provider`, `nurse`, `medical_assistant`, `front_desk`, `biller`
- `patient_status`: `active`, `inactive`, `archived`
- `administrative_sex`: `female`, `male`, `intersex`, `unknown`
- `appointment_type`: `new_patient`, `follow_up`, `procedure`, `telehealth`
- `appointment_status`: `scheduled`, `checked_in`, `in_room`, `completed`, `cancelled`, `no_show`
- `clinical_note_type`: `soap`, `consult`, `procedure`, `follow_up`
- `clinical_note_status`: `draft`, `signed`, `addendum`
- `billing_status`: `draft`, `ready_to_submit`, `submitted`, `partially_paid`, `paid`, `denied`, `void`
- `document_type`: `clinical_photo`, `consent_form`, `lab_result`, `referral`, `insurance_card`, `treatment_plan`, `invoice`, `external_record`, `other`

## Tables
- `profiles`: Mirrors `auth.users` into the app schema for both staff users and patient portal users.
- `practices`: Top-level tenant record with owner, slug, specialty coverage, and contact info.
- `practice_memberships`: Practice-specific staff roles and specialty assignments.
- `practice_member_locations`: Join table that assigns non-admin staff memberships to one or more practice locations.
- `locations`: Practice offices or clinics with address and active status.
- `patients`: Practice-scoped patient demographic record with chart number, allergies, dermatology flags, and optional portal linkage.
- `patient_insurance_policies`: Insurance data attached to patients, including primary-policy tracking.
- `appointments`: Scheduler backbone with patient, provider, location, status, type, and visit timing.
- `clinical_notes`: SOAP, procedure, consult, or follow-up notes tied to patients and optionally appointments.
- `patient_documents`: Storage metadata for clinical photos, consent forms, and other patient documents.
- `billing_records`: Basic charge-line records tied to patients, appointments, providers, and optional insurance policies.
- `audit_logs`: Append-only activity log for administrative review.

## Helper Functions & Triggers
- `set_updated_at()`: Shared trigger function for `updated_at` maintenance.
- `sync_profile_from_auth()`: Keeps `public.profiles` aligned with `auth.users`.
- `create_owner_membership_for_practice()`: Automatically inserts the owner membership when a practice is created.
- `is_practice_member()`: RLS helper for practice-scoped staff access.
- `is_practice_admin()`: RLS helper for admin-only practice settings and membership writes.
- `has_location_access()`: Grants access to a specific location for practice admins or staff explicitly assigned to that location.
- `shares_practice_with_user()`: Allows staff to read teammate profiles in the same practice.
- `is_patient_in_practice()`: Allows patient portal users to read practice or location metadata for their own practice.
- `is_patient_portal_owner()`: Allows patient portal users to read their own patient-scoped rows.

## RLS Policies
- Staff-facing clinical tables use `practice_id` plus `is_practice_member()` for general access.
- Practice settings and membership writes require `is_practice_admin()`.
- `locations` and `appointments` now narrow non-admin staff reads and writes through `has_location_access()` when a location is present.
- Patient portal access is a narrow exception and only applies to rows tied to the logged-in patient's record.
- Clinical notes and documents require explicit patient visibility flags before portal users can read them.
- `audit_logs` are admin-readable only.

## Migration History
- `20260314095500_create_core_ehr_tables.sql`: Initial MVP schema for practices, memberships, locations, patients, insurance, appointments, clinical notes, documents, billing, audit logs, helper functions, triggers, indexes, and RLS.
- `20260314121500_add_practice_member_location_access.sql`: Adds the membership-to-location access table, the `has_location_access()` helper, and location-aware RLS updates for `locations` and `appointments`.
