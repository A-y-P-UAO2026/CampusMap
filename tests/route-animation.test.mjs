import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { animationDurationMs, buildAnimationTrack, positionAtProgress } from '../src/features/map/lib/route-animation.ts'
import { buildCampusGraph, planCampusRoute } from '../src/features/map/lib/route-planner.ts'

const segment = (pathId, coordinates) => ({ pathId, from: pathId, to: pathId, source: 'osm', coordinates })

test('la animación une geometrías consecutivas sin saltar de origen a destino', () => {
  const track = buildAnimationTrack([
    segment('uno', [[3, -76], [3, -75.9995], [3, -75.999]]),
    segment('dos', [[3, -75.999], [3.0005, -75.999], [3.001, -75.999]]),
  ])
  assert.equal(track.points.length, 5)
  assert.deepEqual(positionAtProgress(track, 0), [3, -76])
  assert.deepEqual(positionAtProgress(track, 1), [3.001, -75.999])
  const junction = track.points[2]
  assert.deepEqual(positionAtProgress(track, junction.distance / track.totalMeters), [3, -75.999])
  const between = positionAtProgress(track, 0.25)
  assert.ok(between[1] > -76 && between[1] < -75.999)
  assert.equal(between[0], 3)
  assert.deepEqual(positionAtProgress(track, -1), [3, -76])
  assert.deepEqual(positionAtProgress(track, 2), [3.001, -75.999])
})

test('no inventa puntos para ruta vacía, desconectada o de longitud cero', () => {
  const empty = buildAnimationTrack([])
  assert.equal(positionAtProgress(empty, 0.5), null)
  assert.throws(() => buildAnimationTrack([
    segment('uno', [[1, 1], [2, 2]]), segment('dos', [[3, 3], [4, 4]]),
  ]), /continúa/)
  assert.throws(() => buildAnimationTrack([segment('roto', [[1, 1]])]), /geometría/)
  const stationary = buildAnimationTrack([segment('cero', [[1, 1], [1, 1]])])
  assert.equal(stationary.totalMeters, 0)
  assert.deepEqual(positionAtProgress(stationary, 1), [1, 1])
})

test('duración visual acotada: no representa tiempo real de caminata', () => {
  assert.equal(animationDurationMs(1), 4000)
  assert.equal(animationDurationMs(300), 9000)
  assert.equal(animationDurationMs(1000), 18000)
})

test('la reproducción de la ruta UAO atraviesa cada coordenada de Dijkstra', () => {
  const data = JSON.parse(readFileSync(new URL('../src/features/map/data/uao-network.json', import.meta.url), 'utf8'))
  const locations = data.locations.map((entry) => ({ ...entry, is_public: true }))
  const paths = data.paths.map((entry) => ({
    ...entry, from_location_id: entry.from, to_location_id: entry.to,
    is_bidirectional: true, is_public: true,
  }))
  const network = { locations, paths }
  const graph = buildCampusGraph(locations, paths)
  const from = locations.find((entry) => entry.slug === 'uao-poi-porteria-1').id
  const to = locations.find((entry) => entry.slug === 'uao-poi-biblioteca-crai').id
  const planned = planCampusRoute(network, graph, from, to)
  const track = buildAnimationTrack(planned.segments)
  assert.ok(planned.segments.length > 1)
  assert.ok(track.points.length > planned.segments.length)
  assert.deepEqual(positionAtProgress(track, 0), [locations.find((entry) => entry.id === from).lat,
    locations.find((entry) => entry.id === from).lng])
  assert.deepEqual(positionAtProgress(track, 1), [locations.find((entry) => entry.id === to).lat,
    locations.find((entry) => entry.id === to).lng])
  for (const part of planned.segments) {
    assert.ok(track.points.some((point) => point.coordinates[0] === part.coordinates[0][0]
      && point.coordinates[1] === part.coordinates[0][1]))
  }
})
