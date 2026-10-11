-- CAMP-01 correction tests. Run with: supabase test db
-- Requires the pgTAP extension provided by Supabase local testing.

begin;

select plan(12);

select has_function('public', 'admin_set_profile_role', array['uuid', 'public.profile_role'], 'admin role RPC exists');
select ok(
  not has_function_privilege('authenticated', 'public.handle_new_user()', 'EXECUTE')
    and not has_function_privilege('anon', 'public.handle_new_user()', 'EXECUTE'),
  'new-user trigger is not directly executable by API roles'
);
select ok(
  not has_function_privilege('authenticated', 'public.assign_next_waitlisted_student(uuid)', 'EXECUTE')
    and not has_function_privilege('anon', 'public.assign_next_waitlisted_student(uuid)', 'EXECUTE'),
  'waitlist promotion is internal only'
);

-- The remaining assertions are executable against fixtures created by a local
-- test helper or a dedicated authenticated test seed. They document the
-- required authorization behavior without changing Cloud data.
select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_update_own_allowed_fields'
  ),
  'students have an own-profile update policy'
);
select ok(
  not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_manage_by_staff'
  ),
  'staff-wide profile management policy is removed'
);
select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE'),
  'API users cannot update the profile role column directly'
);
select ok(
  has_column_privilege('authenticated', 'public.profiles', 'full_name', 'UPDATE'),
  'API users can update the permitted full_name column'
);
select ok(
  exists (
    select 1 from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'cancel_event_registration'
  ),
  'cancel RPC exists'
);
select ok(
  exists (
    select 1 from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'assign_next_waitlisted_student'
  ),
  'waitlist promotion RPC exists'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.event_registrations'::regclass
      and conname = 'registrations_cancelled_at_consistency'
  ),
  'registration cancellation invariant exists'
);
select ok(
  position('Registrations cannot be cancelled after the event starts' in pg_get_functiondef('public.cancel_event_registration(uuid)'::regprocedure)) > 0,
  'cancel RPC rejects cancellations after the event starts'
);
select ok(
  position($check$v_event.status not in ('published', 'active')$check$ in pg_get_functiondef('public.assign_next_waitlisted_student(uuid)'::regprocedure)) > 0,
  'waitlist promotion checks event eligibility'
);

select * from finish();
rollback;
