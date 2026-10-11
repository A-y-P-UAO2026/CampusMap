# CAMP-01 — backlog propuesto

Las tareas siguientes son propuestas para GitHub Issues; no se crean automáticamente.

## Desarrollador 1 — Navegación

### NAV-01 — Implementar Graph<T>

- **Objetivo:** implementar el grafo ponderado y bidireccional.
- **Archivos:** `src/structures/Graph.ts`, `src/types/structures.ts`.
- **Dependencias:** CAMP-01.
- **Aceptación:** CRUD de vértices, aristas no negativas, vecinos inmutables y soporte unidireccional.
- **Pruebas:** grafo vacío, aristas duplicadas, peso cero y rutas dirigidas.
- **Complejidad:** media.

### NAV-02 — Implementar Dijkstra

- **Objetivo:** obtener `ShortestPathResult` desde el grafo.
- **Archivos:** `src/algorithms/dijkstra.ts`, `src/types/campus.ts`.
- **Dependencias:** NAV-01.
- **Aceptación:** ruta mínima, distancia, nodos visitados y caso inalcanzable.
- **Pruebas:** ruta directa, múltiples alternativas, empate y peso cero.
- **Complejidad:** media.

### NAV-03 — Implementar Trie de ubicaciones

- **Objetivo:** autocompletado determinista para nombres y slugs.
- **Archivos:** `src/structures/Trie.ts`, `src/features/navigation/`.
- **Dependencias:** contratos CAMP-01.
- **Aceptación:** insertar, buscar, prefijos, sugerencias limitadas y eliminar.
- **Pruebas:** mayúsculas normalizadas, prefijo inexistente y duplicados.
- **Complejidad:** media.

### NAV-04 — Implementar Stack e integración de mapa

- **Objetivo:** historial de navegación e integración con el mapa SVG.
- **Archivos:** `src/structures/Stack.ts`, `src/pages/MapPage.tsx`, `src/features/navigation/`.
- **Dependencias:** NAV-01, NAV-02, NAV-03.
- **Aceptación:** viewBox responsive, coordenadas sin mutar, búsqueda y navegación de vuelta.
- **Pruebas:** viewport móvil/escritorio, ubicación inexistente y ruta no disponible.
- **Complejidad:** alta.

## Desarrollador 2 — Eventos

### EVT-01 — Implementar MinHeap y Queue

- **Objetivo:** ordenar próximos eventos y modelar espera en memoria cuando corresponda.
- **Archivos:** `src/structures/MinHeap.ts`, `src/structures/Queue.ts`.
- **Dependencias:** CAMP-01.
- **Aceptación:** contratos completos, casos vacíos y orden estable documentado.
- **Pruebas:** fechas iguales, extracción completa y cola FIFO.
- **Complejidad:** media.

### EVT-02 — Consultar agenda pública

- **Objetivo:** crear servicio tipado para catálogo de eventos.
- **Archivos:** `src/services/events.ts`, `src/features/events/`, `src/types/campus.ts`.
- **Dependencias:** migración CAMP-01.
- **Aceptación:** usa RLS, filtra eventos públicos próximos y no expone datos privados.
- **Pruebas:** estados no públicos, evento pasado y error de Supabase.
- **Complejidad:** media.

### EVT-03 — Integrar inscripción, cancelación y espera

- **Objetivo:** consumir las RPC transaccionales.
- **Archivos:** `src/services/eventRegistrations.ts`, `src/features/events/`.
- **Dependencias:** EVT-01, EVT-02, migración CAMP-01.
- **Aceptación:** muestra confirmación/espera, cancela sin borrar historial y refleja promoción FIFO.
- **Pruebas:** cupo disponible, lleno, duplicado, cancelación y concurrencia simulada.
- **Complejidad:** alta.

### EVT-04 — Integrar agenda y detalle de eventos

- **Objetivo:** reemplazar placeholders por datos tipados sin alterar el layout compartido.
- **Archivos:** `src/pages/EventsPage.tsx`, `src/pages/EventDetailPage.tsx`, `src/features/events/`.
- **Dependencias:** EVT-02, EVT-03.
- **Aceptación:** responsive, estados de carga/error/vacío y detalle asociado a ubicación.
- **Pruebas:** navegación, evento inexistente y accesibilidad básica.
- **Complejidad:** media.

## Integración

Las tareas de contratos y migración se revisan primero. NAV-01/NAV-02 y EVT-01 pueden avanzar en paralelo. Las integraciones de UI esperan a sus servicios y estructuras respectivas.
