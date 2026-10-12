import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { dijkstra } from '../src/algorithms/dijkstra.ts'
import { Graph } from '../src/structures/Graph.ts'

test('el grafo agrega vértices y conexiones bidireccionales por defecto', () => {
  const graph = new Graph()
  graph.addEdge('A', 'B', 4)
  graph.addEdge('A', 'B', 2)
  graph.addVertex('aislado')
  graph.addVertex('aislado')

  assert.deepEqual(graph.vertices(), ['A', 'B', 'aislado'])
  assert.deepEqual(graph.getNeighbors('A'), [{ to: 'B', weight: 2 }])
  assert.deepEqual(graph.getNeighbors('B'), [{ to: 'A', weight: 2 }])
  assert.deepEqual(graph.getNeighbors('aislado'), [])
  assert.deepEqual(graph.getNeighbors('desconocido'), [])
})

test('el grafo permite sentido único y elimina conexiones o vértices sin dejar referencias', () => {
  const graph = new Graph()
  graph.addEdge('A', 'B', 1, false)
  graph.addEdge('C', 'B', 3)
  assert.deepEqual(graph.getNeighbors('B'), [{ to: 'C', weight: 3 }])
  assert.equal(graph.removeEdge('A', 'B', false), true)
  assert.equal(graph.removeEdge('A', 'B', false), false)
  assert.equal(graph.removeVertex('B'), true)
  assert.equal(graph.removeVertex('B'), false)
  assert.deepEqual(graph.getNeighbors('A'), [])
  assert.deepEqual(graph.getNeighbors('C'), [])
  assert.deepEqual(graph.vertices(), ['A', 'C'])
})

test('una eliminación bidireccional quita ambos sentidos y una unidireccional solo uno', () => {
  const graph = new Graph()
  graph.addEdge('A', 'B', 2)
  assert.equal(graph.removeEdge('A', 'B', false), true)
  assert.deepEqual(graph.getNeighbors('A'), [])
  assert.deepEqual(graph.getNeighbors('B'), [{ to: 'A', weight: 2 }])
  assert.equal(graph.removeEdge('A', 'B'), true)
  assert.deepEqual(graph.getNeighbors('B'), [])
})

test('rechaza pesos negativos y no finitos sin cambiar el grafo', () => {
  const graph = new Graph()
  for (const weight of [-1, NaN, Infinity, -Infinity]) {
    assert.throws(() => graph.addEdge('A', 'B', weight), RangeError)
  }
  assert.deepEqual(graph.vertices(), [])
  graph.addEdge('A', 'B', 0)
  assert.equal(graph.getNeighbors('A')[0].weight, 0)
})

test('las consultas devuelven copias que no pueden alterar el grafo', () => {
  const graph = new Graph()
  graph.addEdge('A', 'B', 1)
  graph.getNeighbors('A')[0].weight = 99
  graph.vertices().push('C')
  assert.deepEqual(graph.getNeighbors('A'), [{ to: 'B', weight: 1 }])
  assert.equal(graph.hasVertex('C'), false)
})

test('Dijkstra prefiere el menor peso aunque use más segmentos', () => {
  const graph = new Graph()
  graph.addEdge('A', 'D', 20)
  graph.addEdge('A', 'B', 2)
  graph.addEdge('B', 'C', 0)
  graph.addEdge('C', 'D', 3)
  const result = dijkstra(graph, 'A', 'D')
  assert.deepEqual(result.path, ['A', 'B', 'C', 'D'])
  assert.equal(result.distance, 5)
  assert.equal(result.reachable, true)
  assert.equal(result.visited_nodes[0], 'A')
  assert.equal(result.visited_nodes.at(-1), 'D')
})

test('Dijkstra respeta caminos dirigidos y recalcula después de eliminar', () => {
  const graph = new Graph()
  graph.addEdge('A', 'B', 2, false)
  graph.addEdge('B', 'C', 2, false)
  graph.addEdge('A', 'C', 9, false)
  assert.deepEqual(dijkstra(graph, 'A', 'C').path, ['A', 'B', 'C'])
  assert.equal(dijkstra(graph, 'C', 'A').reachable, false)
  graph.removeEdge('B', 'C', false)
  assert.deepEqual(dijkstra(graph, 'A', 'C').path, ['A', 'C'])
  assert.equal(dijkstra(graph, 'A', 'C').distance, 9)
})

test('Dijkstra trata correctamente origen=destino, aislados y vértices ausentes', () => {
  const graph = new Graph()
  graph.addVertex('A')
  graph.addVertex('aislado')
  assert.deepEqual(dijkstra(graph, 'A', 'A'), {
    path: ['A'], distance: 0, visited_nodes: ['A'], reachable: true,
  })
  assert.deepEqual(dijkstra(graph, 'A', 'aislado'), {
    path: [], distance: Infinity, visited_nodes: ['A'], reachable: false,
  })
  assert.deepEqual(dijkstra(graph, 'ausente', 'ausente'), {
    path: [], distance: Infinity, visited_nodes: [], reachable: false,
  })
})

test('Dijkstra funciona con los 122 vértices y 116 caminos versionados de UAO', () => {
  const data = JSON.parse(readFileSync(new URL('../src/features/map/data/uao-network.json', import.meta.url), 'utf8'))
  const graph = new Graph()
  for (const location of data.locations) graph.addVertex(location.id)
  for (const path of data.paths) graph.addEdge(path.from, path.to, path.weight)

  const from = data.locations.find((location) => location.slug === 'uao-poi-porteria-1').id
  const to = data.locations.find((location) => location.slug === 'uao-poi-biblioteca-crai').id
  const result = dijkstra(graph, from, to)
  assert.equal(graph.vertices().length, 122)
  assert.equal(result.reachable, true)
  assert.equal(result.path[0], from)
  assert.equal(result.path.at(-1), to)
  assert.ok(result.distance > 0)
  const distanceFromEdges = result.path.slice(1).reduce((sum, vertex, index) => {
    const edge = graph.getNeighbors(result.path[index]).find((neighbor) => neighbor.to === vertex)
    assert.ok(edge)
    return sum + edge.weight
  }, 0)
  assert.ok(Math.abs(result.distance - distanceFromEdges) < 1e-8)
})
