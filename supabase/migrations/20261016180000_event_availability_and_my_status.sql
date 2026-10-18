-- Lectura segura de cupos y de la posición propia en la lista de espera.
-- Debe ejecutarse después de 20261015190000_signup_student_or_staff_role.sql.
--
-- Motivo: un estudiante no puede contar las inscripciones de otras personas
-- (RLS), así que estos datos se calculan dentro de funciones SECURITY DEFINER
-- que devuelven solo agregados o información del propio usuario.

-- Cupos de un evento: datos agregados, sin información de personas.
create or replace function public.get_event_availability(p_event_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_event public.events;
  v_confirmed integer;
begin
  select * into v_event
  from public.events
  where id = p_event_id and status <> 'draft';

  if not found then
    raise exception using errcode = 'P0002', message = 'Event not found';
  end if;

  select count(*) into v_confirmed
  from public.event_registrations
  where event_id = p_event_id and status = 'confirmed';

  return jsonb_build_object(
    'capacity', v_event.capacity,
    'confirmed', v_confirmed,
    'available', greatest(v_event.capacity - v_confirmed, 0)
  );
end;
$$;

-- Estado del usuario autenticado en un evento: ninguno, confirmado o en espera
-- (con su posición). El orden coincide con assign_next_waitlisted_student:
-- joined_at y, si empatan, id.
create or replace function public.get_my_event_status(p_event_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_wait public.event_waitlist;
  v_position integer;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  if exists (
    select 1 from public.event_registrations
    where event_id = p_event_id and student_id = v_user_id and status = 'confirmed'
  ) then
    return jsonb_build_object('state', 'confirmed');
  end if;

  select * into v_wait
  from public.event_waitlist
  where event_id = p_event_id and student_id = v_user_id and status = 'waiting'
  order by joined_at desc, id desc
  limit 1;

  if found then
    select count(*) into v_position
    from public.event_waitlist w
    where w.event_id = p_event_id
      and w.status = 'waiting'
      and (w.joined_at, w.id) <= (v_wait.joined_at, v_wait.id);

    return jsonb_build_object('state', 'waitlisted', 'position', v_position);
  end if;

  return jsonb_build_object('state', 'none');
end;
$$;

revoke all on function public.get_event_availability(uuid) from public, anon;
grant execute on function public.get_event_availability(uuid) to anon, authenticated;

revoke all on function public.get_my_event_status(uuid) from public, anon;
grant execute on function public.get_my_event_status(uuid) to authenticated;