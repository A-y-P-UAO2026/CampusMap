# Services

Servicios de acceso a datos y APIs. La configuración existente de Supabase se mantiene en `src/lib/supabase.ts`.

- `locations.ts`: consultas públicas de ubicaciones y caminos.
- `events.ts`: consultas públicas de eventos próximos y detalle.

Estos servicios respetan RLS y no contienen credenciales privilegiadas.
