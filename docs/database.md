# CampusMap — base de datos

La migración `supabase/migrations/20261011000000_initial_schema.sql` define el MVP.

## Relaciones

- `profiles.id` referencia `auth.users.id`.
- `events.location_id` referencia `locations.id`.
- `events.created_by` referencia `profiles.id`.
- `paths.from_location_id` y `paths.to_location_id` referencian `locations.id`.
- `event_registrations` y `event_waitlist` relacionan estudiantes con eventos.

Las ubicaciones no se eliminan si tienen eventos o caminos. Los eventos eliminados eliminan sus inscripciones y entradas de espera mediante `CASCADE`. El borrado de un usuario elimina su perfil y sus registros asociados.

## Reglas

- Las coordenadas SVG `x` e `y` están entre `0` y `100`.
- `paths.weight` es no negativo. `is_bidirectional` permite representar el comportamiento actual y futuras rutas unidireccionales.
- Un evento exige `ends_at > starts_at`, capacidad positiva y una ubicación.
- Solo `published` y `active` futuros con `registration_open = true` aceptan inscripciones.
- Un estudiante solo puede tener una inscripción `confirmed` por evento; las canceladas se conservan.
- La espera se ordena por `joined_at, id`, que proporciona FIFO determinista.

## Seguridad

RLS está habilitado en todas las tablas públicas. Visitantes leen ubicaciones, caminos y catálogo público de eventos. Los estudiantes leen su propio perfil, inscripciones y entradas de espera. `staff` y `admin` administran contenido. El rol se protege con `current_profile_role()` y no puede ser cambiado por el propio estudiante.

Las RPC `register_for_event` y `cancel_event_registration` son `SECURITY DEFINER`, validan `auth.uid()`, bloquean la fila del evento y realizan la operación dentro de la transacción de PostgreSQL. La promoción FIFO se ejecuta al cancelar y no se concede acceso de ejecución directo a `assign_next_waitlisted_student`.

## Migraciones

No se deben editar migraciones aplicadas. Para un cambio nuevo, crear otro archivo con prefijo UTC `YYYYMMDDHHMMSS_descripcion.sql`, probarlo en una base local o rama aislada y revisar RLS antes de desplegar.
