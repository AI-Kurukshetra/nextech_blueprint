create table public.practice_member_locations (
  practice_id uuid not null references public.practices (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  location_id uuid not null,
  assigned_by_user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (practice_id, user_id, location_id),
  constraint practice_member_locations_membership_fk
    foreign key (practice_id, user_id)
    references public.practice_memberships (practice_id, user_id)
    on delete cascade,
  constraint practice_member_locations_location_fk
    foreign key (practice_id, location_id)
    references public.locations (practice_id, id)
    on delete cascade
);

create index practice_member_locations_user_idx
on public.practice_member_locations (user_id);

create index practice_member_locations_location_idx
on public.practice_member_locations (location_id);

create or replace function public.has_location_access(
  target_practice_id uuid,
  target_location_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_practice_admin(target_practice_id)
    or exists (
      select 1
      from public.practice_member_locations assignment
      join public.practice_memberships membership
        on membership.practice_id = assignment.practice_id
       and membership.user_id = assignment.user_id
      where assignment.practice_id = target_practice_id
        and assignment.location_id = target_location_id
        and assignment.user_id = (select auth.uid())
        and membership.is_active = true
    );
$$;

grant select, insert, delete on table
  public.practice_member_locations
to authenticated;

grant all on table
  public.practice_member_locations
to service_role;

grant execute on function
  public.has_location_access(uuid, uuid)
to authenticated, service_role;

alter table public.practice_member_locations enable row level security;

create policy practice_member_locations_select_by_practice
on public.practice_member_locations
for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.is_practice_member(practice_id)
);

create policy practice_member_locations_insert_by_admin
on public.practice_member_locations
for insert
to authenticated
with check (public.is_practice_admin(practice_id));

create policy practice_member_locations_delete_by_admin
on public.practice_member_locations
for delete
to authenticated
using (public.is_practice_admin(practice_id));

drop policy if exists locations_select_by_member_or_patient on public.locations;

create policy locations_select_by_member_or_patient
on public.locations
for select
to authenticated
using (
  public.is_patient_in_practice(practice_id)
  or public.has_location_access(practice_id, id)
);

drop policy if exists appointments_select_by_member_or_self on public.appointments;

create policy appointments_select_by_member_or_self
on public.appointments
for select
to authenticated
using (
  public.is_patient_portal_owner(patient_id)
  or (
    location_id is null
    and public.is_practice_member(practice_id)
  )
  or (
    location_id is not null
    and public.has_location_access(practice_id, location_id)
  )
);

drop policy if exists appointments_insert_by_practice_member on public.appointments;

create policy appointments_insert_by_practice_member
on public.appointments
for insert
to authenticated
with check (
  (
    location_id is null
    and public.is_practice_member(practice_id)
  )
  or (
    location_id is not null
    and public.has_location_access(practice_id, location_id)
  )
);

drop policy if exists appointments_update_by_practice_member on public.appointments;

create policy appointments_update_by_practice_member
on public.appointments
for update
to authenticated
using (
  (
    location_id is null
    and public.is_practice_member(practice_id)
  )
  or (
    location_id is not null
    and public.has_location_access(practice_id, location_id)
  )
)
with check (
  (
    location_id is null
    and public.is_practice_member(practice_id)
  )
  or (
    location_id is not null
    and public.has_location_access(practice_id, location_id)
  )
);
