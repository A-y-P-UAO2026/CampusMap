# CampusMap — arquitectura compartida

## Capas

- `src/pages/`: composición de pantallas y rutas.
- `src/layouts/`: shell responsive compartido.
- `src/components/`: componentes reutilizables; `components/ui/` contiene shadcn/Base UI.
- `src/features/`: módulos por dominio (`navigation`, `events`) cuando se implemente la lógica.
- `src/types/`: contratos comunes de datos y estructuras.
- `src/structures/`: implementaciones manuales de Graph, Trie, MinHeap, Queue y Stack.
- `src/algorithms/`: algoritmos de navegación, incluyendo Dijkstra.
- `src/services/`: acceso a Supabase y RPC; las operaciones sensibles se delegan a PostgreSQL.
- `src/hooks/`: hooks de UI y dominio reutilizables.
- `src/lib/`: configuración y utilidades transversales.

## Dependencias entre módulos

La navegación depende de `CampusLocation`, `CampusPath`, `Graph` y Dijkstra. Eventos depende de `CampusEvent`, `EventRegistration`, `EventWaitlistEntry`, `MinHeap`, `Queue` y las RPC de Supabase. Ambos dominios comparten `StudentProfile` y el cliente Supabase, pero no deben importar componentes internos del otro dominio.

## Convenciones

- TypeScript estricto, sin `any`.
- Nombres de tablas y propiedades de datos en `snake_case`; nombres de componentes, interfaces y funciones en `camelCase`/`PascalCase`.
- La base de datos es la fuente de verdad para cupos, estados e inscripciones.
- Las funciones RPC son la única entrada de escritura para registrar y cancelar inscripciones.
- Ninguna clave privilegiada llega al navegador.

## Git

Cada desarrollador trabaja en una rama de funcionalidad a partir de `main`, por ejemplo `feat/navigation-graph` o `feat/events-registration`. Los cambios de migración deben revisarse junto con sus contratos y documentación. No se deben hacer commits directamente sobre `main`.
