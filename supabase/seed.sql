-- CampusMap local test data only.
-- These records are fictitious and are intended for local development/testing.

insert into public.locations (id, name, slug, description, x, y)
values
  ('00000000-0000-0000-0000-000000000001', '[PRUEBA] Biblioteca Central', 'prueba-biblioteca-central', 'Ubicación ficticia para pruebas del mapa.', 22.50, 28.00),
  ('00000000-0000-0000-0000-000000000002', '[PRUEBA] Laboratorio de Sistemas', 'prueba-laboratorio-sistemas', 'Ubicación ficticia para pruebas del buscador.', 45.00, 24.00),
  ('00000000-0000-0000-0000-000000000003', '[PRUEBA] Cafetería Principal', 'prueba-cafeteria-principal', 'Ubicación ficticia para pruebas de rutas.', 68.00, 36.00),
  ('00000000-0000-0000-0000-000000000004', '[PRUEBA] Edificio de Bienestar', 'prueba-edificio-bienestar', 'Ubicación ficticia para pruebas de eventos.', 52.00, 62.00),
  ('00000000-0000-0000-0000-000000000005', '[PRUEBA] Auditorio', 'prueba-auditorio', 'Ubicación ficticia para pruebas de eventos.', 78.00, 72.00),
  ('00000000-0000-0000-0000-000000000006', '[PRUEBA] Entrada Principal', 'prueba-entrada-principal', 'Ubicación ficticia de inicio del campus.', 12.00, 78.00)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  x = excluded.x,
  y = excluded.y,
  is_public = true;

insert into public.paths (id, from_location_id, to_location_id, weight, is_bidirectional, is_public)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 120.000, true, true),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 85.000, true, true),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 110.000, true, true),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 95.000, true, true),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 70.000, true, true),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 140.000, true, true)
on conflict (id) do update set
  from_location_id = excluded.from_location_id,
  to_location_id = excluded.to_location_id,
  weight = excluded.weight,
  is_bidirectional = excluded.is_bidirectional,
  is_public = excluded.is_public;

insert into public.events (id, title, description, location_id, starts_at, ends_at, capacity, registration_open, status)
values
  ('20000000-0000-0000-0000-000000000001', '[PRUEBA] Feria de bienvenida', 'Evento ficticio para probar el catálogo público.', '00000000-0000-0000-0000-000000000004', '2027-01-20 14:00:00+00', '2027-01-20 18:00:00+00', 40, true, 'published'),
  ('20000000-0000-0000-0000-000000000002', '[PRUEBA] Taller de rutas', 'Evento ficticio con capacidad reducida para probar inscripciones.', '00000000-0000-0000-0000-000000000005', '2027-02-05 15:00:00+00', '2027-02-05 17:00:00+00', 2, true, 'active'),
  ('20000000-0000-0000-0000-000000000003', '[PRUEBA] Evento en borrador', 'No debe aparecer en el catálogo público.', '00000000-0000-0000-0000-000000000003', '2027-02-12 15:00:00+00', '2027-02-12 17:00:00+00', 20, true, 'draft'),
  ('20000000-0000-0000-0000-000000000004', '[PRUEBA] Evento cancelado', 'No debe aparecer en el catálogo público.', '00000000-0000-0000-0000-000000000001', '2027-02-19 15:00:00+00', '2027-02-19 17:00:00+00', 20, false, 'cancelled')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  location_id = excluded.location_id,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  capacity = excluded.capacity,
  registration_open = excluded.registration_open,
  status = excluded.status;
