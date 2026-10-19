-- CAMP-XX: catálogo inicial de eventos en ubicaciones conectadas a la red UAO.
-- Requiere que la red de navegación de supabase/seeds/uao_navigation.sql
-- ya esté cargada en la base de datos.

begin;

do $$
declare
  missing_locations text[];
begin
  select array_agg(target.slug order by target.slug)
    into missing_locations
  from (
    values
      ('uao-poi-biblioteca-crai'),
      ('uao-poi-cafeteria-dcafe'),
      ('uao-poi-aulas-1'),
      ('uao-poi-aulas-2'),
      ('uao-poi-aulas-3'),
      ('uao-poi-cafeterias'),
      ('uao-poi-espacios-de-actividades-bienestar'),
      ('uao-poi-oficinas-bienestar'),
      ('uao-poi-agora'),
      ('uao-poi-auditorio-lile')
  ) as target(slug)
  left join public.locations location on location.slug = target.slug
  where location.id is null
     or not exists (
       select 1
       from public.paths path
       where path.is_public
         and (
           path.from_location_id = location.id
           or path.to_location_id = location.id
         )
     );

  if missing_locations is not null then
    raise exception
      'No se pueden cargar los eventos: faltan ubicaciones conectadas a la red pública: %',
      array_to_string(missing_locations, ', ');
  end if;
end;
$$;

insert into public.events (
  id,
  title,
  description,
  location_id,
  starts_at,
  ends_at,
  capacity,
  registration_open,
  status
)
select
  event_data.id,
  event_data.title,
  event_data.description,
  location.id,
  event_data.starts_at,
  event_data.ends_at,
  event_data.capacity,
  true,
  'published'
from (
  values
    ('30000000-0000-0000-0000-000000000001'::uuid, 'Círculo de lectura y conocimiento', 'Conversatorio y actividades de lectura en la Biblioteca - CRAI.', 'uao-poi-biblioteca-crai', '2027-01-22 14:00:00+00'::timestamptz, '2027-01-22 16:00:00+00'::timestamptz, 10),
    ('30000000-0000-0000-0000-000000000002'::uuid, 'Café y bienestar universitario', 'Espacio de integración para estudiantes en la Cafetería D´Cafe.', 'uao-poi-cafeteria-dcafe', '2027-01-29 15:00:00+00'::timestamptz, '2027-01-29 17:00:00+00'::timestamptz, 12),
    ('30000000-0000-0000-0000-000000000003'::uuid, 'Taller de desarrollo web', 'Taller práctico de interfaces web y herramientas de desarrollo.', 'uao-poi-aulas-1', '2027-02-05 14:00:00+00'::timestamptz, '2027-02-05 18:00:00+00'::timestamptz, 10),
    ('30000000-0000-0000-0000-000000000004'::uuid, 'Seminario de innovación tecnológica', 'Charla sobre innovación, tecnología y proyectos universitarios.', 'uao-poi-aulas-2', '2027-02-12 09:00:00+00'::timestamptz, '2027-02-12 12:00:00+00'::timestamptz, 15),
    ('30000000-0000-0000-0000-000000000005'::uuid, 'Muestra de proyectos estudiantiles', 'Presentación de prototipos y proyectos desarrollados por estudiantes.', 'uao-poi-aulas-3', '2027-02-19 10:00:00+00'::timestamptz, '2027-02-19 13:00:00+00'::timestamptz, 20),
    ('30000000-0000-0000-0000-000000000006'::uuid, 'Taller de alimentación saludable', 'Actividad práctica sobre hábitos de alimentación saludable.', 'uao-poi-cafeterias', '2027-02-26 11:00:00+00'::timestamptz, '2027-02-26 13:00:00+00'::timestamptz, 10),
    ('30000000-0000-0000-0000-000000000007'::uuid, 'Jornada de salud y autocuidado', 'Actividades de promoción de la salud y hábitos de autocuidado.', 'uao-poi-espacios-de-actividades-bienestar', '2027-03-05 08:00:00+00'::timestamptz, '2027-03-05 10:00:00+00'::timestamptz, 15),
    ('30000000-0000-0000-0000-000000000008'::uuid, 'Orientación para la vida universitaria', 'Encuentro informativo sobre servicios y acompañamiento de Bienestar.', 'uao-poi-oficinas-bienestar', '2027-03-12 13:00:00+00'::timestamptz, '2027-03-12 15:00:00+00'::timestamptz, 8),
    ('30000000-0000-0000-0000-000000000009'::uuid, 'Taller de expresión cultural', 'Actividad práctica de expresión artística y cultural para estudiantes.', 'uao-poi-agora', '2027-03-19 16:00:00+00'::timestamptz, '2027-03-19 18:00:00+00'::timestamptz, 20),
    ('30000000-0000-0000-0000-000000000010'::uuid, 'Cine foro universitario', 'Proyección y conversación sobre cine, sociedad y cultura.', 'uao-poi-auditorio-lile', '2027-03-26 17:00:00+00'::timestamptz, '2027-03-26 20:00:00+00'::timestamptz, 20)
) as event_data(id, title, description, slug, starts_at, ends_at, capacity)
join public.locations location on location.slug = event_data.slug
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  location_id = excluded.location_id,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  capacity = excluded.capacity,
  registration_open = excluded.registration_open,
  status = excluded.status;

commit;
