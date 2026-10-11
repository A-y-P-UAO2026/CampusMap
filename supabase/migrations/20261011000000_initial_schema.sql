-- CAMP-01: schema, RLS and transactional RPCs for CampusMap MVP.
-- Apply locally or through the reviewed Supabase migration workflow.

create extension if not exists pgcrypto;

create type public.profile_role as enum ('student', 'staff', 'admin');
create type public.event_status as enum ('draft', 'published', 'active', 'cancelled', 'finished');
create type public.registration_status as enum ('confirmed', 'cancelled');
create type public.waitlist_status as enum ('waiting', 'assigned', 'cancelled');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.profile_role not null default 'student',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  x numeric(5, 2) not null check (x >= 0 and x <= 100),
  y numeric(5, 2) not null check (y >= 0 and y <= 100),
  is_public boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.paths (
  id uuid primary key default gen_random_uuid(),
  from_location_id uuid not null references public.locations(id) on delete restrict,
  to_location_id uuid not null references public.locations(id) on delete restrict,
  weight numeric(12, 3) not null check (weight >= 0),
  is_bidirectional boolean not null default true,
  is_public boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint paths_distinct_locations check (from_location_id <> to_location_id),
  constraint paths_unique_direction unique (from_location_id, to_location_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  description text,
  location_id uuid not null references public.locations(id) on delete restrict,
  created_by uuid references public.profiles(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity integer not null check (capacity > 0),
  registration_open boolean not null default true,
  status public.event_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint events_valid_time_range check (ends_at > starts_at)
);

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status public.registration_status not null default 'confirmed',
  registered_at timestamptz not null default timezone('utc', now()),
  cancelled_at timestamptz,
  constraint registrations_cancelled_at_consistency check (
    (status = 'cancelled' and cancelled_at is not null)
    or (status = 'confirmed' and cancelled_at is null)
  )
);

create table public.event_waitlist (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status public.waitlist_status not null default 'waiting',
  joined_at timestamptz not null default timezone('utc', now()),
  assigned_at timestamptz,
  cancelled_at timestamptz,
  constraint waitlist_status_timestamps check (
    (status = 'waiting' and assigned_at is null and cancelled_at is null)
    or (status = 'assigned' and assigned_at is not null and cancelled_at is null)
    or (status = 'cancelled' and assigned_at is null and cancelled_at is not null)
  )
);

create unique index event_registrations_one_confirmed_per_student
  on public.event_registrations (event_id, student_id)
  where status = 'confirmed';

create unique index event_waitlist_one_waiting_per_student
  on public.event_waitlist (event_id, student_id)
  where status = 'waiting';

create index locations_public_name_idx on public.locations (name) where is_public;
create index paths_public_from_location_idx on public.paths (from_location_id) where is_public;
create index paths_public_to_location_idx on public.paths (to_location_id) where is_public;
create index events_public_catalog_idx on public.events (starts_at, location_id)
  where status in ('published', 'active') and registration_open;
create index events_location_idx on public.events (location_id);
create index registrations_student_idx on public.event_registrations (student_id, event_id);
create index waitlist_student_idx on public.event_waitlist (student_id, event_id);
create index waitlist_fifo_idx on public.event_waitlist (event_id, joined_at, id)
  where status = 'waiting';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger locations_set_updated_at
  before update on public.locations
  for each row execute function public.set_updated_at();
create trigger paths_set_updated_at
  before update on public.paths
  for each row execute function public.set_updated_at();
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.current_profile_role()
returns public.profile_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

alter table public.profiles enable row level security;
alter table public.locations enable row level security;
alter table public.paths enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.event_waitlist enable row level security;

create policy profiles_select_own
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.current_profile_role() in ('staff', 'admin'));

create policy profiles_update_own_non_role
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.current_profile_role());

create policy profiles_manage_by_staff
  on public.profiles for all to authenticated
  using (public.current_profile_role() in ('staff', 'admin'))
  with check (public.current_profile_role() in ('staff', 'admin'));

create policy locations_select_public
  on public.locations for select to anon, authenticated
  using (is_public or public.current_profile_role() in ('staff', 'admin'));

create policy locations_manage_by_staff
  on public.locations for all to authenticated
  using (public.current_profile_role() in ('staff', 'admin'))
  with check (public.current_profile_role() in ('staff', 'admin'));

create policy paths_select_public
  on public.paths for select to anon, authenticated
  using (is_public or public.current_profile_role() in ('staff', 'admin'));

create policy paths_manage_by_staff
  on public.paths for all to authenticated
  using (public.current_profile_role() in ('staff', 'admin'))
  with check (public.current_profile_role() in ('staff', 'admin'));

create policy events_select_catalog
  on public.events for select to anon, authenticated
  using (
    (status in ('published', 'active') and starts_at > timezone('utc', now()))
    or public.current_profile_role() in ('staff', 'admin')
  );

create policy events_manage_by_staff
  on public.events for all to authenticated
  using (public.current_profile_role() in ('staff', 'admin'))
  with check (public.current_profile_role() in ('staff', 'admin'));

create policy registrations_select_own
  on public.event_registrations for select to authenticated
  using (student_id = auth.uid() or public.current_profile_role() in ('staff', 'admin'));

create policy waitlist_select_own
  on public.event_waitlist for select to authenticated
  using (student_id = auth.uid() or public.current_profile_role() in ('staff', 'admin'));

-- RLS filters rows; these grants provide the table-level privileges required
-- for the policies to be evaluated by Supabase client roles.
grant select on public.locations, public.paths, public.events to anon, authenticated;
grant insert, update, delete on public.locations, public.paths, public.events to authenticated;
grant select on public.profiles, public.event_registrations, public.event_waitlist to authenticated;
grant insert, update, delete on public.profiles to authenticated;

create or replace function public.assign_next_waitlisted_student(p_event_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_waitlist public.event_waitlist;
begin
  select * into v_waitlist
  from public.event_waitlist
  where event_id = p_event_id and status = 'waiting'
  order by joined_at, id
  limit 1
  for update;

  if not found then
    return null;
  end if;

  insert into public.event_registrations (event_id, student_id, status)
  values (p_event_id, v_waitlist.student_id, 'confirmed')
  ;

  update public.event_waitlist
  set status = 'assigned', assigned_at = timezone('utc', now())
  where id = v_waitlist.id;

  return v_waitlist.student_id;
end;
$$;

create or replace function public.register_for_event(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_event public.events;
  v_confirmed_count integer;
  v_registration_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  select * into v_event from public.events where id = p_event_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Event not found'; end if;
  if v_event.status not in ('published', 'active')
    or not v_event.registration_open
    or v_event.starts_at <= timezone('utc', now()) then
    raise exception using errcode = '22023', message = 'Event registrations are closed';
  end if;

  if exists (select 1 from public.event_registrations where event_id = p_event_id and student_id = v_user_id and status = 'confirmed') then
    raise exception using errcode = '23505', message = 'Student is already registered';
  end if;
  if exists (select 1 from public.event_waitlist where event_id = p_event_id and student_id = v_user_id and status = 'waiting') then
    raise exception using errcode = '23505', message = 'Student is already on the waitlist';
  end if;

  select count(*) into v_confirmed_count
  from public.event_registrations
  where event_id = p_event_id and status = 'confirmed';

  if v_confirmed_count < v_event.capacity then
    insert into public.event_registrations (event_id, student_id)
    values (p_event_id, v_user_id)
    returning id into v_registration_id;
    return jsonb_build_object('status', 'confirmed', 'registration_id', v_registration_id);
  end if;

  insert into public.event_waitlist (event_id, student_id)
  values (p_event_id, v_user_id);
  return jsonb_build_object('status', 'waitlisted');
end;
$$;

create or replace function public.cancel_event_registration(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_registration_id uuid;
  v_promoted_student uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  perform 1 from public.events where id = p_event_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Event not found'; end if;

  select id into v_registration_id
  from public.event_registrations
  where event_id = p_event_id and student_id = v_user_id and status = 'confirmed'
  order by registered_at desc
  limit 1
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Active registration not found';
  end if;

  update public.event_registrations
  set status = 'cancelled', cancelled_at = timezone('utc', now())
  where id = v_registration_id;

  v_promoted_student := public.assign_next_waitlisted_student(p_event_id);
  return jsonb_build_object('status', 'cancelled', 'promoted_student_id', v_promoted_student);
end;
$$;

revoke all on function public.assign_next_waitlisted_student(uuid) from public, anon, authenticated;
revoke all on function public.register_for_event(uuid) from public, anon;
revoke all on function public.cancel_event_registration(uuid) from public, anon;
grant execute on function public.register_for_event(uuid) to authenticated;
grant execute on function public.cancel_event_registration(uuid) to authenticated;
