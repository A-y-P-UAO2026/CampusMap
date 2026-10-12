# CampusMap — contratos de estructuras

Los contratos están en `src/types/structures.ts`. `Graph<T>`, Dijkstra, Trie y Stack ya tienen implementación; MinHeap y Queue permanecen pendientes.

## Graph

`Graph<T>` administra vértices y aristas ponderadas en memoria, comparando IDs con la semántica de `Map`. `addEdge(from, to, weight, bidirectional = true)` crea los vértices ausentes y añade o actualiza las direcciones indicadas; **no borra** la dirección contraria si existía antes. El peso debe ser finito y no negativo (cero es válido); un peso inválido lanza `RangeError` sin modificar el grafo. Una arista repetida reemplaza su peso, sin duplicarse. `removeEdge(from, to, bidirectional = true)` elimina una o ambas direcciones y devuelve si se eliminó alguna; `removeVertex` elimina también todas las aristas entrantes. `getNeighbors` y `vertices` devuelven copias; un vértice inexistente tiene vecinos vacíos. Para que un camino previamente bidireccional pase a un solo sentido, se debe eliminar la dirección inversa explícitamente.

`dijkstra(graph, source, target)` usa el contrato `Graph<T>` y devuelve `ShortestPathResult<T>`: `path` desde origen hasta destino, `distance` como suma de pesos y `visited_nodes` en el orden en que el algoritmo fija sus distancias. Si no existe alguno de los vértices o el destino es inalcanzable, devuelve `reachable: false`, `path: []` y `distance: Infinity`. Si origen y destino son el mismo vértice existente, la ruta contiene solo ese vértice y la distancia es cero. Los empates conservan el orden de inserción de vértices y vecinos; no se promete una ruta única entre alternativas de igual peso. Esta versión usa búsqueda lineal de la próxima distancia mínima, con complejidad `O(V² + E)`, suficiente para los 86 nodos actuales. Las pruebas independientes de React se ejecutan con `node tests/graph-dijkstra.test.mjs` (Node 24).

## Trie

`Trie` normaliza internamente mayúsculas, tildes y espacios. `insert` ignora cadenas vacías y es idempotente para una misma palabra normalizada. `search` distingue una palabra completa de un prefijo; `startsWith` consulta prefijos (`''` indica si hay alguna palabra); `suggestions` devuelve palabras **normalizadas** en orden lexicográfico hasta `limit`, y devuelve `[]` para prefijo vacío o límite no positivo. `remove` borra solo la palabra completa, conserva ramas compartidas y devuelve `false` si no existía.

`src/features/map/lib/location-search.ts` asocia esas palabras normalizadas con los **IDs y nombres originales** recibidos de Supabase. Solo indexa POI públicos, no nodos técnicos; limita la interfaz a seis sugerencias. El buscador de `/mapa` usa el Trie, y la lista completa aparece únicamente cuando el campo está vacío. Las pruebas se ejecutan con `node tests/trie.test.mjs` y `node tests/location-search.test.mjs`.

## MinHeap

`MinHeap<T>` debe recibir un comparador en su implementación. `peek` y `extractMin` devuelven `undefined` si está vacío. Se usa para ordenar eventos por fecha/prioridad.

## Queue

`Queue<T>` es FIFO: `enqueue` agrega al final y `dequeue` retira el elemento más antiguo. Operaciones de lectura o retiro sobre una cola vacía devuelven `undefined`.

## Stack

`Stack<T>` es una pila enlazada LIFO propia: `push` agrega arriba y `pop` retira el último elemento; ambas operaciones, `peek`, `size` e `isEmpty` son `O(1)`. `peek` y `pop` devuelven `undefined` si está vacía. `clear` descarta todas las entradas en `O(1)`. `LocationHistory` en `src/features/map/lib/location-history.ts` usa esta pila para guardar IDs anteriores: `visit(id)` ignora repeticiones consecutivas y apila la ubicación actual antes de cambiar; `back()` hace `pop()` y cambia la ubicación actual sin apilarla otra vez. El botón **Volver** de `/mapa` se deshabilita cuando no hay entradas. El historial vive en memoria durante la sesión de la página y se limpia al recargar la red del mapa. Pruebas: `node tests/stack.test.mjs` y `node tests/location-history.test.mjs`.

## Pruebas mínimas

Cada implementación debe cubrir colección vacía, un elemento, duplicados, eliminación, orden esperado y entradas límite. Graph y Dijkstra deben cubrir rutas inexistentes y pesos cero.
