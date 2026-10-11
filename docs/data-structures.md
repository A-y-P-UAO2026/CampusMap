# CampusMap — contratos de estructuras

Los contratos están en `src/types/structures.ts`. En esta fase no hay implementaciones.

## Graph

`Graph<T>` administra vértices y aristas ponderadas. `addEdge` debe rechazar pesos negativos y soportar aristas bidireccionales por defecto. `getNeighbors` debe devolver una colección de solo lectura; consultar un vértice inexistente devuelve una colección vacía o la implementación debe documentar una excepción.

## Trie

`Trie` recibe texto normalizado por la capa de dominio. `search` distingue una palabra completa de un prefijo; `startsWith` consulta prefijos; `suggestions` devuelve como máximo `limit` resultados deterministas; eliminar una palabra inexistente devuelve `false`.

## MinHeap

`MinHeap<T>` debe recibir un comparador en su implementación. `peek` y `extractMin` devuelven `undefined` si está vacío. Se usa para ordenar eventos por fecha/prioridad.

## Queue

`Queue<T>` es FIFO: `enqueue` agrega al final y `dequeue` retira el elemento más antiguo. Operaciones de lectura o retiro sobre una cola vacía devuelven `undefined`.

## Stack

`Stack<T>` es LIFO: `push` agrega arriba y `pop` retira el último elemento. `peek` y `pop` devuelven `undefined` si está vacío. Se usará para historial de navegación.

## Pruebas mínimas

Cada implementación debe cubrir colección vacía, un elemento, duplicados, eliminación, orden esperado y entradas límite. Graph y Dijkstra deben cubrir rutas inexistentes y pesos cero.
