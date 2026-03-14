create extension if not exists pgcrypto with schema extensions;

create type public.medical_specialty as enum (
  'dermatology',
  'ophthalmology',
  'plastic_surgery'
);

create type public.staff_role as enum (
  'practice_owner',
  'practice_admin',
  'provider',
  'nurse',
  'medical_assistant',
  'front_desk',
  'biller'
);

create type public.patient_status as enum (
  'active',
  'inactive',
  'archived'
);

create type public.administrative_sex as enum (
  'female',
  'male',
  'intersex',
  'unknown'
);

create type public.appointment_type as enum (
  'new_patient',
  'follow_up',
  'procedure',
  'telehealth'
);

create type public.appointment_status as enum (
  'scheduled',
  'checked_in',
  'in_room',
  'completed',
  'cancelled',
  'no_show'
);

create type public.clinical_note_type as enum (
  'soap',
  'consult',
  'procedure',
  'follow_up'
);

create type public.clinical_note_status as enum (
  'draft',
  'signed',
  'addendum'
);

create type public.billing_status as enum (
  'draft',
  'ready_to_submit',
  'submitted',
  'partially_paid',
  'paid',
  'denied',
  'void'
);

create type public.document_type as enum (
  'clinical_photo',
  'consent_form',
  'lab_result',
  'referral',
  'insurance_card',
  'treatment_plan',
  'invoice',
  'external_record',
  'other'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  display_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.practices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  owner_user_id uuid not null references public.profiles (id) on delete restrict,
  specialties public.medical_specialty[] not null default array['dermatology'::public.medical_specialty],
  primary_email text,
  primary_phone text,
  timezone text not null default 'UTC',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint practices_specialties_not_empty check (coalesce(array_length(specialties, 1), 0) > 0)
);

create unique index practices_slug_unique_idx on public.practices (lower(slug));

create table public.practice_memberships (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.staff_role not null,
  specialties public.medical_specialty[] not null default array[]::public.medical_specialty[],
  employment_title text,
  invited_by_user_id uuid references public.profiles (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint practice_memberships_practice_user_unique unique (practice_id, user_id)
);

create index practice_memberships_user_idx on public.practice_memberships (user_id);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  name text not null,
  code text not null,
  phone text,
  email text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state_region text,
  postal_code text,
  country_code text not null default 'US',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint locations_practice_id_unique unique (practice_id, id),
  constraint locations_practice_code_unique unique (practice_id, code)
);

create index locations_practice_idx on public.locations (practice_id);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  portal_user_id uuid references public.profiles (id) on delete set null,
  chart_number text not null default ('PAT-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8))),
  first_name text not null,
  last_name text not null,
  preferred_name text,
  date_of_birth date not null,
  sex_at_birth public.administrative_sex not null default 'unknown',
  phone text,
  email text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state_region text,
  postal_code text,
  country_code text not null default 'US',
  emergency_contact_name text,
  emergency_contact_phone text,
  allergies text[] not null default array[]::text[],
  dermatology_flags text[] not null default array[]::text[],
  portal_enabled boolean not null default false,
  status public.patient_status not null default 'active',
  last_visit_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patients_practice_id_unique unique (practice_id, id),
  constraint patients_practice_chart_number_unique unique (practice_id, chart_number)
);

create index patients_practice_name_idx on public.patients (practice_id, last_name, first_name);
create index patients_portal_user_idx on public.patients (portal_user_id) where portal_user_id is not null;

create table public.patient_insurance_policies (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  patient_id uuid not null,
  payer_name text not null,
  plan_name text,
  member_id text not null,
  group_number text,
  subscriber_name text,
  relationship_to_subscriber text,
  is_primary boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patient_insurance_policies_practice_id_unique unique (practice_id, id),
  constraint patient_insurance_policies_patient_fk
    foreign key (practice_id, patient_id)
    references public.patients (practice_id, id)
    on delete cascade,
  constraint patient_insurance_policies_unique_member
    unique (practice_id, patient_id, payer_name, member_id)
);

create index patient_insurance_policies_patient_idx on public.patient_insurance_policies (patient_id);
create unique index patient_insurance_primary_idx on public.patient_insurance_policies (patient_id) where is_primary;

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  location_id uuid,
  patient_id uuid not null,
  provider_user_id uuid not null,
  created_by_user_id uuid references public.profiles (id) on delete set null,
  appointment_type public.appointment_type not null default 'follow_up',
  status public.appointment_status not null default 'scheduled',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  visit_reason text,
  room_label text,
  notes text,
  check_in_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_practice_id_unique unique (practice_id, id),
  constraint appointments_patient_fk
    foreign key (practice_id, patient_id)
    references public.patients (practice_id, id)
    on delete cascade,
  constraint appointments_location_fk
    foreign key (practice_id, location_id)
    references public.locations (practice_id, id)
    on delete set null,
  constraint appointments_provider_fk
    foreign key (practice_id, provider_user_id)
    references public.practice_memberships (practice_id, user_id)
    on delete restrict,
  constraint appointments_time_order_check check (ends_at > starts_at)
);

create index appointments_practice_starts_at_idx on public.appointments (practice_id, starts_at desc);
create index appointments_patient_starts_at_idx on public.appointments (patient_id, starts_at desc);

create table public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  patient_id uuid not null,
  appointment_id uuid,
  author_user_id uuid not null,
  note_type public.clinical_note_type not null default 'soap',
  status public.clinical_note_status not null default 'draft',
  chief_complaint text,
  subjective text,
  objective text,
  assessment text,
  plan text,
  diagnosis_codes text[] not null default array[]::text[],
  is_patient_visible boolean not null default false,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_notes_patient_fk
    foreign key (practice_id, patient_id)
    references public.patients (practice_id, id)
    on delete cascade,
  constraint clinical_notes_appointment_fk
    foreign key (practice_id, appointment_id)
    references public.appointments (practice_id, id)
    on delete set null,
  constraint clinical_notes_author_fk
    foreign key (practice_id, author_user_id)
    references public.practice_memberships (practice_id, user_id)
    on delete restrict
);

create index clinical_notes_patient_created_idx on public.clinical_notes (patient_id, created_at desc);

create table public.patient_documents (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  patient_id uuid not null,
  appointment_id uuid,
  uploaded_by_user_id uuid references public.profiles (id) on delete set null,
  document_type public.document_type not null default 'external_record',
  file_name text not null,
  mime_type text not null,
  storage_bucket text not null default 'patient-documents',
  storage_path text not null,
  description text,
  captured_at timestamptz,
  is_patient_visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patient_documents_patient_fk
    foreign key (practice_id, patient_id)
    references public.patients (practice_id, id)
    on delete cascade,
  constraint patient_documents_appointment_fk
    foreign key (practice_id, appointment_id)
    references public.appointments (practice_id, id)
    on delete set null,
  constraint patient_documents_storage_unique unique (storage_bucket, storage_path)
);

create index patient_documents_patient_created_idx on public.patient_documents (patient_id, created_at desc);

create table public.billing_records (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  patient_id uuid not null,
  appointment_id uuid,
  insurance_policy_id uuid,
  rendering_provider_user_id uuid,
  cpt_code text not null,
  modifier_codes text[] not null default array[]::text[],
  icd10_codes text[] not null default array[]::text[],
  claim_reference text,
  units integer not null default 1,
  charge_amount numeric(10, 2) not null,
  allowed_amount numeric(10, 2),
  balance_amount numeric(10, 2) not null,
  status public.billing_status not null default 'draft',
  service_date date not null,
  submitted_at timestamptz,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_records_patient_fk
    foreign key (practice_id, patient_id)
    references public.patients (practice_id, id)
    on delete cascade,
  constraint billing_records_appointment_fk
    foreign key (practice_id, appointment_id)
    references public.appointments (practice_id, id)
    on delete set null,
  constraint billing_records_insurance_fk
    foreign key (practice_id, insurance_policy_id)
    references public.patient_insurance_policies (practice_id, id)
    on delete set null,
  constraint billing_records_rendering_provider_fk
    foreign key (practice_id, rendering_provider_user_id)
    references public.practice_memberships (practice_id, user_id)
    on delete set null,
  constraint billing_records_units_check check (units > 0),
  constraint billing_records_amounts_check check (charge_amount >= 0 and balance_amount >= 0)
);

create index billing_records_practice_service_date_idx on public.billing_records (practice_id, service_date desc);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  actor_user_id uuid not null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_actor_fk
    foreign key (practice_id, actor_user_id)
    references public.practice_memberships (practice_id, user_id)
    on delete restrict
);

create index audit_logs_practice_created_idx on public.audit_logs (practice_id, created_at desc);

create or replace function public.is_practice_member(target_practice_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.practice_memberships membership
    where membership.practice_id = target_practice_id
      and membership.user_id = (select auth.uid())
      and membership.is_active = true
  );
$$;

create or replace function public.is_practice_admin(target_practice_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.practice_memberships membership
    where membership.practice_id = target_practice_id
      and membership.user_id = (select auth.uid())
      and membership.is_active = true
      and membership.role in ('practice_owner', 'practice_admin')
  );
$$;

create or replace function public.shares_practice_with_user(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.practice_memberships me
    join public.practice_memberships teammate
      on teammate.practice_id = me.practice_id
    where me.user_id = (select auth.uid())
      and me.is_active = true
      and teammate.user_id = target_user_id
      and teammate.is_active = true
  );
$$;

create or replace function public.is_patient_in_practice(target_practice_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.patients patient
    where patient.practice_id = target_practice_id
      and patient.portal_user_id = (select auth.uid())
      and patient.portal_enabled = true
  );
$$;

create or replace function public.is_patient_portal_owner(target_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.patients patient
    where patient.id = target_patient_id
      and patient.portal_user_id = (select auth.uid())
      and patient.portal_enabled = true
  );
$$;

create or replace function public.sync_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    display_name,
    avatar_url
  )
  values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''),
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(concat_ws(' ', new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name')), ''),
      new.email
    ),
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), '')
  )
  on conflict (id) do update
    set email = excluded.email,
        first_name = coalesce(excluded.first_name, public.profiles.first_name),
        last_name = coalesce(excluded.last_name, public.profiles.last_name),
        display_name = coalesce(excluded.display_name, public.profiles.display_name),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
        updated_at = now();

  return new;
end;
$$;

create or replace function public.create_owner_membership_for_practice()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.practice_memberships (
    practice_id,
    user_id,
    role,
    specialties
  )
  values (
    new.id,
    new.owner_user_id,
    'practice_owner',
    coalesce(new.specialties, array['dermatology'::public.medical_specialty])
  )
  on conflict (practice_id, user_id) do update
    set role = 'practice_owner',
        specialties = excluded.specialties,
        is_active = true,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.sync_profile_from_auth();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email, raw_user_meta_data on auth.users
for each row
execute function public.sync_profile_from_auth();

drop trigger if exists on_practice_created_add_owner on public.practices;
create trigger on_practice_created_add_owner
after insert on public.practices
for each row
execute function public.create_owner_membership_for_practice();

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_practices_updated_at
before update on public.practices
for each row
execute function public.set_updated_at();

create trigger set_practice_memberships_updated_at
before update on public.practice_memberships
for each row
execute function public.set_updated_at();

create trigger set_locations_updated_at
before update on public.locations
for each row
execute function public.set_updated_at();

create trigger set_patients_updated_at
before update on public.patients
for each row
execute function public.set_updated_at();

create trigger set_patient_insurance_policies_updated_at
before update on public.patient_insurance_policies
for each row
execute function public.set_updated_at();

create trigger set_appointments_updated_at
before update on public.appointments
for each row
execute function public.set_updated_at();

create trigger set_clinical_notes_updated_at
before update on public.clinical_notes
for each row
execute function public.set_updated_at();

create trigger set_patient_documents_updated_at
before update on public.patient_documents
for each row
execute function public.set_updated_at();

create trigger set_billing_records_updated_at
before update on public.billing_records
for each row
execute function public.set_updated_at();

grant usage on type
  public.medical_specialty,
  public.staff_role,
  public.patient_status,
  public.administrative_sex,
  public.appointment_type,
  public.appointment_status,
  public.clinical_note_type,
  public.clinical_note_status,
  public.billing_status,
  public.document_type
to authenticated, service_role;

grant select, insert, update, delete on table
  public.profiles,
  public.practices,
  public.practice_memberships,
  public.locations,
  public.patients,
  public.patient_insurance_policies,
  public.appointments,
  public.clinical_notes,
  public.patient_documents,
  public.billing_records,
  public.audit_logs
to authenticated;

grant all on table
  public.profiles,
  public.practices,
  public.practice_memberships,
  public.locations,
  public.patients,
  public.patient_insurance_policies,
  public.appointments,
  public.clinical_notes,
  public.patient_documents,
  public.billing_records,
  public.audit_logs
to service_role;

grant execute on function
  public.is_practice_member(uuid),
  public.is_practice_admin(uuid),
  public.shares_practice_with_user(uuid),
  public.is_patient_in_practice(uuid),
  public.is_patient_portal_owner(uuid)
to authenticated, service_role;

alter table public.profiles enable row level security;
alter table public.practices enable row level security;
alter table public.practice_memberships enable row level security;
alter table public.locations enable row level security;
alter table public.patients enable row level security;
alter table public.patient_insurance_policies enable row level security;
alter table public.appointments enable row level security;
alter table public.clinical_notes enable row level security;
alter table public.patient_documents enable row level security;
alter table public.billing_records enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_select_self_or_shared_practice
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or public.shares_practice_with_user(id)
);

create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy practices_select_by_member_or_patient
on public.practices
for select
to authenticated
using (
  public.is_practice_member(id)
  or public.is_patient_in_practice(id)
);

create policy practices_insert_by_owner
on public.practices
for insert
to authenticated
with check (owner_user_id = (select auth.uid()));

create policy practices_update_by_admin
on public.practices
for update
to authenticated
using (public.is_practice_admin(id))
with check (public.is_practice_admin(id));

create policy practice_memberships_select_by_practice
on public.practice_memberships
for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.is_practice_member(practice_id)
);

create policy practice_memberships_insert_by_admin
on public.practice_memberships
for insert
to authenticated
with check (public.is_practice_admin(practice_id));

create policy practice_memberships_update_by_admin
on public.practice_memberships
for update
to authenticated
using (public.is_practice_admin(practice_id))
with check (public.is_practice_admin(practice_id));

create policy practice_memberships_delete_by_admin
on public.practice_memberships
for delete
to authenticated
using (
  public.is_practice_admin(practice_id)
  and role <> 'practice_owner'
);

create policy locations_select_by_member_or_patient
on public.locations
for select
to authenticated
using (
  public.is_practice_member(practice_id)
  or public.is_patient_in_practice(practice_id)
);

create policy locations_insert_by_admin
on public.locations
for insert
to authenticated
with check (public.is_practice_admin(practice_id));

create policy locations_update_by_admin
on public.locations
for update
to authenticated
using (public.is_practice_admin(practice_id))
with check (public.is_practice_admin(practice_id));

create policy locations_delete_by_admin
on public.locations
for delete
to authenticated
using (public.is_practice_admin(practice_id));

create policy patients_select_by_member_or_self
on public.patients
for select
to authenticated
using (
  public.is_practice_member(practice_id)
  or (
    portal_enabled = true
    and portal_user_id = (select auth.uid())
  )
);

create policy patients_insert_by_practice_member
on public.patients
for insert
to authenticated
with check (public.is_practice_member(practice_id));

create policy patients_update_by_practice_member
on public.patients
for update
to authenticated
using (public.is_practice_member(practice_id))
with check (public.is_practice_member(practice_id));

create policy patients_delete_by_admin
on public.patients
for delete
to authenticated
using (public.is_practice_admin(practice_id));

create policy patient_insurance_policies_select_by_member_or_self
on public.patient_insurance_policies
for select
to authenticated
using (
  public.is_practice_member(practice_id)
  or public.is_patient_portal_owner(patient_id)
);

create policy patient_insurance_policies_insert_by_practice_member
on public.patient_insurance_policies
for insert
to authenticated
with check (public.is_practice_member(practice_id));

create policy patient_insurance_policies_update_by_practice_member
on public.patient_insurance_policies
for update
to authenticated
using (public.is_practice_member(practice_id))
with check (public.is_practice_member(practice_id));

create policy patient_insurance_policies_delete_by_admin
on public.patient_insurance_policies
for delete
to authenticated
using (public.is_practice_admin(practice_id));

create policy appointments_select_by_member_or_self
on public.appointments
for select
to authenticated
using (
  public.is_practice_member(practice_id)
  or public.is_patient_portal_owner(patient_id)
);

create policy appointments_insert_by_practice_member
on public.appointments
for insert
to authenticated
with check (public.is_practice_member(practice_id));

create policy appointments_update_by_practice_member
on public.appointments
for update
to authenticated
using (public.is_practice_member(practice_id))
with check (public.is_practice_member(practice_id));

create policy appointments_delete_by_admin
on public.appointments
for delete
to authenticated
using (public.is_practice_admin(practice_id));

create policy clinical_notes_select_by_member_or_visible_patient
on public.clinical_notes
for select
to authenticated
using (
  public.is_practice_member(practice_id)
  or (
    is_patient_visible = true
    and public.is_patient_portal_owner(patient_id)
  )
);

create policy clinical_notes_insert_by_practice_member
on public.clinical_notes
for insert
to authenticated
with check (public.is_practice_member(practice_id));

create policy clinical_notes_update_by_practice_member
on public.clinical_notes
for update
to authenticated
using (public.is_practice_member(practice_id))
with check (public.is_practice_member(practice_id));

create policy clinical_notes_delete_by_admin
on public.clinical_notes
for delete
to authenticated
using (public.is_practice_admin(practice_id));

create policy patient_documents_select_by_member_or_visible_patient
on public.patient_documents
for select
to authenticated
using (
  public.is_practice_member(practice_id)
  or (
    is_patient_visible = true
    and public.is_patient_portal_owner(patient_id)
  )
);

create policy patient_documents_insert_by_practice_member
on public.patient_documents
for insert
to authenticated
with check (public.is_practice_member(practice_id));

create policy patient_documents_update_by_practice_member
on public.patient_documents
for update
to authenticated
using (public.is_practice_member(practice_id))
with check (public.is_practice_member(practice_id));

create policy patient_documents_delete_by_admin
on public.patient_documents
for delete
to authenticated
using (public.is_practice_admin(practice_id));

create policy billing_records_select_by_member_or_self
on public.billing_records
for select
to authenticated
using (
  public.is_practice_member(practice_id)
  or public.is_patient_portal_owner(patient_id)
);

create policy billing_records_insert_by_practice_member
on public.billing_records
for insert
to authenticated
with check (public.is_practice_member(practice_id));

create policy billing_records_update_by_practice_member
on public.billing_records
for update
to authenticated
using (public.is_practice_member(practice_id))
with check (public.is_practice_member(practice_id));

create policy billing_records_delete_by_admin
on public.billing_records
for delete
to authenticated
using (public.is_practice_admin(practice_id));

create policy audit_logs_select_by_admin
on public.audit_logs
for select
to authenticated
using (public.is_practice_admin(practice_id));

create policy audit_logs_insert_by_practice_member
on public.audit_logs
for insert
to authenticated
with check (
  public.is_practice_member(practice_id)
  and actor_user_id = (select auth.uid())
);
