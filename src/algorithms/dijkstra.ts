import type { ShortestPathResult } from '../types/campus'
import type { Graph as GraphContract } from '../types/structures'

// Map/Set compare keys with SameValueZero (including NaN and undefined).
const sameVertex = <T>(left: T, right: T) => left === right || (left !== left && right !== right)

/** Dijkstra sin dependencias ni heap: O(V² + E), suficiente para el mapa MVP. */
export function dijkstra<T>(graph: GraphContract<T>, source: T, target: T): ShortestPathResult<T> {
  const unreachable = (visited_nodes: T[]): ShortestPathResult<T> => ({
    path: [], distance: Infinity, visited_nodes, reachable: false,
  })

  if (!graph.hasVertex(source) || !graph.hasVertex(target)) return unreachable([])

  const vertices = graph.vertices()
  const distances = new Map<T, number>(vertices.map((vertex) => [vertex, Infinity]))
  const previous = new Map<T, T>()
  const settled = new Set<T>()
  const visited: T[] = []
  distances.set(source, 0)

  while (settled.size < vertices.length) {
    let current: T | undefined
    let found = false
    let best = Infinity
    for (const vertex of vertices) {
      const distance = distances.get(vertex) ?? Infinity
      if (!settled.has(vertex) && distance < best) {
        current = vertex
        found = true
        best = distance
      }
    }
    if (!found) break
    const vertex = current as T

    settled.add(vertex)
    visited.push(vertex)
    if (sameVertex(vertex, target)) break

    for (const edge of graph.getNeighbors(vertex)) {
      if (!Number.isFinite(edge.weight) || edge.weight < 0) {
        throw new RangeError('Dijkstra requiere pesos finitos y no negativos.')
      }
      if (settled.has(edge.to)) continue
      const candidate = best + edge.weight
      if (candidate < (distances.get(edge.to) ?? Infinity)) {
        distances.set(edge.to, candidate)
        previous.set(edge.to, vertex)
      }
    }
  }

  const distance = distances.get(target) ?? Infinity
  if (!Number.isFinite(distance)) return unreachable(visited)

  const path: T[] = [target]
  let cursor = target
  while (!sameVertex(cursor, source)) {
    if (!previous.has(cursor)) return unreachable(visited)
    cursor = previous.get(cursor) as T
    path.unshift(cursor)
  }

  return { path, distance, visited_nodes: visited, reachable: true }
}
