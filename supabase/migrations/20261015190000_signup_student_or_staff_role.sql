create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  requested_role text;
  assigned_role public.profile_role;
begin
  requested_role := lower(nullif(trim(coalesce(new.raw_user_meta_data ->> 'role', '')), ''));

  if requested_role in ('student', 'staff') then
    assigned_role := requested_role::public.profile_role;
  else
    assigned_role := 'student';
  end if;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    assigned_role
  );

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated, service_role;
