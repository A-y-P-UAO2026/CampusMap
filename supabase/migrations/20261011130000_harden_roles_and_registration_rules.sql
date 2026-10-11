-- CAMP-01 correction: harden roles, SECURITY DEFINER functions and cancellation rules.
-- This migration must run after 20261011000000_initial_schema.sql.

drop policy if exists profiles_update_own_non_role on public.profiles;
drop policy if exists profiles_manage_by_staff on public.profiles;

create policy profiles_update_own_allowed_fields
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.current_profile_role());

-- Students can update only the profile field exposed by the MVP. Role changes
-- are performed through the admin-only RPC below.
revoke insert, update, delete on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated, service_role;

create or replace function public.admin_set_profile_role(
  p_user_id uuid,
  p_role public.profile_role
)
returns public.profile_role
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role public.profile_role;
begin
  if auth.uid() is null or public.current_profile_role() <> 'admin' then
    raise exception using errcode = '42501', message = 'Only administrators can modify roles';
  end if;

  update public.profiles
  set role = p_role
  where id = p_user_id
  returning role into v_role;

  if not found then
    raise exception using errcode = 'P0002', message = 'Profile not found';
  end if;

  return v_role;
end;
$$;

revoke all on function public.admin_set_profile_role(uuid, public.profile_role) from public, anon;
grant execute on function public.admin_set_profile_role(uuid, public.profile_role) to authenticated;

create or replace function public.assign_next_waitlisted_student(p_event_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event public.events;
  v_waitlist public.event_waitlist;
begin
  select * into v_event
  from public.events
  where id = p_event_id
  for update;

  if not found
    or v_event.status not in ('published', 'active')
    or not v_event.registration_open
    or v_event.starts_at <= timezone('utc', now()) then
    return null;
  end if;

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
  values (p_event_id, v_waitlist.student_id, 'confirmed');

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
set search_path = public, pg_temp
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
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_event public.events;
  v_registration_id uuid;
  v_promoted_student uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  select * into v_event from public.events where id = p_event_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Event not found'; end if;
  if v_event.starts_at <= timezone('utc', now()) then
    raise exception using errcode = '22023', message = 'Registrations cannot be cancelled after the event starts';
  end if;

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
