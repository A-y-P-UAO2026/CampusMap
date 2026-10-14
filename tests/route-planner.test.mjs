import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { buildCampusGraph, planCampusRoute, routeSegments } from '../src/features/map/lib/route-planner.ts'

const location = (id, lat, lng) => ({
  id, name: id, slug: id, description: null, x: 50, y: 50, lat, lng, kind: 'poi',
  is_public: true, created_at: '', updated_at: '',
})
const path = (id, from, to, weight, coordinates, is_bidirectional = true, source = 'osm') => ({
  id, from_location_id: from, to_location_id: to, weight, is_bidirectional,
  is_public: true, created_at: '', updated_at: '', source, sourceRef: id,
  highway: null, layer: null, coordinates,
})

test('convierte filas Supabase en vértices, pesos y sentidos correctos', () => {
  const locations = [location('A', 1, 1), location('B', 2, 2), location('C', 3, 3), location('aislado', 4, 4)]
  const paths = [
    path('AB', 'A', 'B', 7, [[1, 1], [2, 2]], false),
    path('BC', 'B', 'C', 0, [[2, 2], [3, 3]]),
    path('AB-mejor', 'A', 'B', 2, [[1, 1], [1.5, 1.5], [2, 2]], false),
  ]
  const graph = buildCampusGraph(locations, paths)
  assert.deepEqual(graph.vertices(), ['A', 'B', 'C', 'aislado'])
  assert.deepEqual(graph.getNeighbors('A'), [{ to: 'B', weight: 2 }])
  assert.deepEqual(graph.getNeighbors('B'), [{ to: 'C', weight: 0 }])
  assert.deepEqual(graph.getNeighbors('C'), [{ to: 'B', weight: 0 }])
  assert.deepEqual(graph.getNeighbors('aislado'), [])
  assert.equal(planCampusRoute({ locations, paths }, graph, 'C', 'A').result.reachable, false)
})

test('rechaza filas inconsistentes antes de calcular una ruta', () => {
  const locations = [location('A', 1, 1)]
  assert.throws(() => buildCampusGraph(locations, [path('roto', 'A', 'B', 1, [[1, 1], [2, 2]])]), /ausente/)
  assert.throws(() => buildCampusGraph(locations, [path('roto', 'A', 'A', -1, [[1, 1], [1, 1]])]), /peso inválido/)
})

test('dibuja todos los tramos de la ruta mínima, incluyendo vértices intermedios', () => {
  const locations = [location('A', 1, 1), location('B', 2, 2), location('C', 3, 3)]
  const paths = [
    path('AB', 'A', 'B', 2, [[1, 1], [1.5, 1.5], [2, 2]], true, 'simulated'),
    path('BC', 'B', 'C', 3, [[2, 2], [2.5, 2.5], [3, 3]]),
    path('AC', 'A', 'C', 12, [[1, 1], [3, 3]]),
  ]
  const network = { locations, paths }
  const graph = buildCampusGraph(locations, paths)
  const planned = planCampusRoute(network, graph, 'A', 'C')
  assert.deepEqual(planned.result.path, ['A', 'B', 'C'])
  assert.equal(planned.result.distance, 5)
  assert.deepEqual(planned.segments.map((segment) => segment.pathId), ['AB', 'BC'])
  assert.deepEqual(planned.segments[0].coordinates, [[1, 1], [1.5, 1.5], [2, 2]])
  assert.deepEqual(planned.segments[1].coordinates, [[2, 2], [2.5, 2.5], [3, 3]])
  assert.equal(planned.segments[0].source, 'simulated')
  assert.deepEqual(planCampusRoute(network, graph, 'C', 'A').segments.map((segment) => segment.coordinates), [
    [[3, 3], [2.5, 2.5], [2, 2]], [[2, 2], [1.5, 1.5], [1, 1]],
  ])
})

test('origen igual a destino no inventa líneas; geometría inconsistente falla', () => {
  const locations = [location('A', 1, 1), location('B', 2, 2)]
  const valid = path('AB', 'A', 'B', 1, [[1, 1], [2, 2]])
  const graph = buildCampusGraph(locations, [valid])
  assert.deepEqual(planCampusRoute({ locations, paths: [valid] }, graph, 'A', 'A').segments, [])
  const invalid = path('AB', 'A', 'B', 1, [[9, 9], [2, 2]])
  assert.throws(() => planCampusRoute({ locations, paths: [invalid] }, graph, 'A', 'B'), /extremos/)
  assert.deepEqual(routeSegments({ locations, paths: [valid] }, {
    path: [], distance: Infinity, reachable: false, visited_nodes: [],
  }), [])
})

test('la ruta UAO usa solo conexiones versionadas, en el mismo orden que Dijkstra', () => {
  const data = JSON.parse(readFileSync(new URL('../src/features/map/data/uao-network.json', import.meta.url), 'utf8'))
  const locations = data.locations.map((entry) => ({ ...location(entry.id, entry.lat, entry.lng), slug: entry.slug }))
  const paths = data.paths.map((entry) => path(entry.id, entry.from, entry.to, entry.weight,
    entry.coordinates, true, entry.source))
  const network = { locations, paths }
  const graph = buildCampusGraph(locations, paths)
  const origin = locations.find((entry) => entry.slug === 'uao-poi-porteria-1').id
  const destination = locations.find((entry) => entry.slug === 'uao-poi-biblioteca-crai').id
  const planned = planCampusRoute(network, graph, origin, destination)
  assert.equal(locations.length, 122)
  assert.equal(paths.length, 116)
  assert.equal(planned.result.reachable, true)
  assert.equal(planned.segments.length, planned.result.path.length - 1)
  for (const [index, segment] of planned.segments.entries()) {
    assert.equal(segment.from, planned.result.path[index])
    assert.equal(segment.to, planned.result.path[index + 1])
    assert.deepEqual(segment.coordinates[0], [locations.find((entry) => entry.id === segment.from).lat,
      locations.find((entry) => entry.id === segment.from).lng])
    assert.deepEqual(segment.coordinates.at(-1), [locations.find((entry) => entry.id === segment.to).lat,
      locations.find((entry) => entry.id === segment.to).lng])
    assert.ok(paths.some((entry) => entry.id === segment.pathId))
  }
  const weight = planned.segments.reduce((sum, segment) => sum + paths.find((entry) => entry.id === segment.pathId).weight, 0)
  assert.ok(Math.abs(weight - planned.result.distance) < 1e-8)
})

test('rutas entre sectores y destino aislado conservan los casos de Dijkstra', () => {
  const data = JSON.parse(readFileSync(new URL('../src/features/map/data/uao-network.json', import.meta.url), 'utf8'))
  const locations = data.locations.map((entry) => ({ ...location(entry.id, entry.lat, entry.lng), name: entry.name, slug: entry.slug }))
  const paths = data.paths.map((entry) => path(entry.id, entry.from, entry.to, entry.weight,
    entry.coordinates, true, entry.source))
  const network = { locations, paths }
  const graph = buildCampusGraph(locations, paths)
  const id = (name) => locations.find((place) => place.name === name).id
  for (const [from, to] of [
    ['Porteria 1', 'Aulas 4'],
    ['Biblioteca - CRAI', 'Enfermeria'],
    ['Auditorio LILE', 'Tienda UAO'],
  ]) {
    const planned = planCampusRoute(network, graph, id(from), id(to))
    assert.equal(planned.result.reachable, true, `${from} → ${to}`)
    assert.ok(planned.result.distance > 0)
    assert.equal(planned.segments.length, planned.result.path.length - 1)
  }
  assert.equal(planCampusRoute(network, graph, id('Aulas 1'), id('Parqueadero de Bicicletas')).result.reachable, false)
})
