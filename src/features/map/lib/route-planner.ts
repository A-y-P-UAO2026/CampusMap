import { dijkstra } from '../../../algorithms/dijkstra.ts'
import { Graph } from '../../../structures/Graph.ts'
import type { CampusLocation, CampusPath, ShortestPathResult } from '../../../types/campus'
import type { MapLocation, MapNetwork, MapPath } from './navigation-geometry'

export interface RouteSegment {
  pathId: string
  from: string
  to: string
  source: MapPath['source']
  coordinates: [number, number][]
}

export interface PlannedRoute {
  result: ShortestPathResult<string>
  segments: RouteSegment[]
}

/** Convierte únicamente las filas recibidas de Supabase, respetando el sentido de cada camino. */
export function buildCampusGraph(locations: CampusLocation[], paths: CampusPath[]): Graph<string> {
  const graph = new Graph<string>()
  for (const location of locations) graph.addVertex(location.id)

  // Si dos filas ofrecen el mismo sentido, la arista usa el menor peso.
  const edges = new Map<string, Map<string, number>>()
  const addDirection = (from: string, to: string, weight: number) => {
    let neighbors = edges.get(from)
    if (!neighbors) {
      neighbors = new Map()
      edges.set(from, neighbors)
    }
    const previous = neighbors.get(to)
    if (previous === undefined || weight < previous) neighbors.set(to, weight)
  }

  for (const path of paths) {
    if (!graph.hasVertex(path.from_location_id) || !graph.hasVertex(path.to_location_id)) {
      throw new Error(`El camino ${path.id} apunta a una ubicación ausente.`)
    }
    if (!Number.isFinite(path.weight) || path.weight < 0) {
      throw new RangeError(`El camino ${path.id} tiene un peso inválido.`)
    }
    addDirection(path.from_location_id, path.to_location_id, path.weight)
    if (path.is_bidirectional) addDirection(path.to_location_id, path.from_location_id, path.weight)
  }

  for (const [from, neighbors] of edges) {
    for (const [to, weight] of neighbors) graph.addEdge(from, to, weight, false)
  }
  return graph
}

const samePoint = (point: [number, number], location: MapLocation) =>
  point[0] === location.lat && point[1] === location.lng

/** Traduce los pares consecutivos de Dijkstra a geometrías versionadas, sin inventar trazos. */
export function routeSegments(network: MapNetwork, result: ShortestPathResult<string>): RouteSegment[] {
  if (!result.reachable || result.path.length < 2) return []
  const locations = new Map(network.locations.map((location) => [location.id, location]))
  const segments: RouteSegment[] = []

  for (let index = 1; index < result.path.length; index += 1) {
    const from = result.path[index - 1]
    const to = result.path[index]
    const fromLocation = locations.get(from)
    const toLocation = locations.get(to)
    if (!fromLocation || !toLocation) throw new Error('La ruta contiene una ubicación sin geometría.')

    const candidates = network.paths.filter((path) =>
      (path.from_location_id === from && path.to_location_id === to)
      || (path.is_bidirectional && path.from_location_id === to && path.to_location_id === from))
    const path = candidates.reduce<MapPath | undefined>((best, candidate) =>
      !best || candidate.weight < best.weight ? candidate : best, undefined)
    if (!path || path.coordinates.length < 2) {
      throw new Error(`No hay geometría de camino para el tramo ${from} → ${to}.`)
    }

    const forward = path.from_location_id === from && path.to_location_id === to
    const coordinates = forward ? path.coordinates : [...path.coordinates].reverse()
    if (!samePoint(coordinates[0], fromLocation) || !samePoint(coordinates.at(-1)!, toLocation)) {
      throw new Error(`La geometría del camino ${path.id} no coincide con sus extremos.`)
    }
    segments.push({ pathId: path.id, from, to, source: path.source, coordinates })
  }
  return segments
}

export function planCampusRoute(network: MapNetwork, graph: Graph<string>, from: string, to: string): PlannedRoute {
  const result = dijkstra(graph, from, to)
  return { result, segments: routeSegments(network, result) }
}
