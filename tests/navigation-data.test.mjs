import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const map = readJson('../src/features/map/data/uao-network.json')
const osm = readJson('../docs/maps/uao_senderos_overpass.geojson')
const source = readJson('../docs/maps/map_uao.geojson')
const umap = readJson('../docs/maps/umap_backup_map-uao.umap')
const sql = readFileSync(new URL('../supabase/seeds/uao_navigation.sql', import.meta.url), 'utf8')
const locations = new Map(map.locations.map((location) => [location.id, location]))
const ways = new Map(osm.features.map((feature) => [feature.id, feature]))
const samePosition = (a, b) => a[0] === b[1] && a[1] === b[0]
const originalNames = new Set([
  'Porteria 1', 'Biblioteca - CRAI', 'Cafetería D´Cafe',
  'Oficinas Edificio Central - Ala Norte', 'Oficinas Edificio Central - Ala Sur',
  'UaoLabs', 'Aulas 1', 'Aulas 2', 'Aulas 3', 'Aulas 4', 'Cafeterías', 'Portería 3',
])

function inside(point, ring) {
  let result = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]
    const b = ring[j]
    if ((a[1] > point[1]) !== (b[1] > point[1])
      && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) result = !result
  }
  return result
}

function crossesEdge(a, b, c, d) {
  const orient = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])
  return orient(a, b, c) * orient(a, b, d) < 0 && orient(c, d, a) * orient(c, d, b) < 0
}

test('los 48 puntos uMap aparecen una sola vez y conservan su categoría original', () => {
  const pois = map.locations.filter((location) => location.kind === 'poi')
  const sourcePoints = source.features.filter((feature) => feature.geometry.type === 'Point')
  assert.equal(pois.length, 48)
  assert.equal(sourcePoints.length, 48)
  assert.equal(new Set(pois.map((poi) => poi.id)).size, 48)
  assert.equal(new Set(pois.map((poi) => poi.slug)).size, 48)
  for (const feature of sourcePoints) {
    const matched = pois.filter((poi) => poi.name === feature.properties.name)
    assert.equal(matched.length, 1, `POI faltante o duplicado: ${feature.properties.name}`)
    assert.deepEqual([matched[0].lng, matched[0].lat], feature.geometry.coordinates)
    const category = umap.layers.find((layer) => layer.features.some((entry) =>
      entry.geometry.type === 'Point' && entry.properties.name === feature.properties.name))?.properties.name
    assert.equal(matched[0].category, category)
    assert.ok(sql.includes(`'${matched[0].id}'`))
  }
  assert.equal(new Set(pois.map((poi) => poi.category)).size, 11)
})

test('los doce IDs históricos permanecen estables', () => {
  const known = new Map([
    ['Porteria 1', 'uao-poi-porteria-1'], ['Biblioteca - CRAI', 'uao-poi-biblioteca-crai'],
    ['Cafetería D´Cafe', 'uao-poi-cafeteria-dcafe'],
    ['Oficinas Edificio Central - Ala Norte', 'uao-poi-edificio-central-norte'],
    ['Oficinas Edificio Central - Ala Sur', 'uao-poi-edificio-central-sur'],
    ['UaoLabs', 'uao-poi-uaolabs'], ['Aulas 1', 'uao-poi-aulas-1'],
    ['Aulas 2', 'uao-poi-aulas-2'], ['Aulas 3', 'uao-poi-aulas-3'],
    ['Aulas 4', 'uao-poi-aulas-4'], ['Cafeterías', 'uao-poi-cafeterias'],
    ['Portería 3', 'uao-poi-porteria-3'],
  ])
  for (const [name, slug] of known) {
    const hash = createHash('sha256').update(`campusmap-uao:v1:poi:${slug}`).digest('hex')
    const expectedId = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-8${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`
    const poi = map.locations.find((entry) => entry.name === name)
    assert.equal(poi?.slug, slug)
    assert.equal(poi?.id, expectedId)
  }
})

test('todos los tramos etiquetados OSM son segmentos consecutivos de su vía fuente', () => {
  for (const path of map.paths.filter((entry) => entry.source === 'osm')) {
    const coordinates = ways.get(path.sourceRef)?.geometry?.coordinates
    assert.ok(coordinates, `Vía OSM ausente: ${path.sourceRef}`)
    assert.ok(coordinates.some((point, index) => {
      if (index === 0) return false
      const previous = coordinates[index - 1]
      return (samePosition(path.coordinates[0], previous) && samePosition(path.coordinates[1], point))
        || (samePosition(path.coordinates[1], previous) && samePosition(path.coordinates[0], point))
    }), `Tramo ajeno a la vía OSM: ${path.id}`)
  }
})

test('los conectores simulados quedan identificados y dentro del límite académico', () => {
  const simulated = map.paths.filter((path) => path.source === 'simulated')
  const pois = map.locations.filter((location) => location.kind === 'poi')
  assert.equal(simulated.length, 30)
  assert.equal(pois.length, 48)
  for (const path of simulated) {
    assert.equal(locations.get(path.from)?.kind, 'poi')
    assert.equal(locations.get(path.to)?.kind, 'node')
    assert.ok(path.weight <= 30, `Conector demasiado largo: ${path.id}`)
    assert.ok(path.sourceRef.startsWith('nearest-vertex:'))
    assert.ok(sql.includes(`'${path.id}'`), `Conector no está en el seed: ${path.id}`)
  }
  assert.ok(sql.includes('-- Conexiones SIMULADAS:'))
})

test('los conectores nuevos no atraviesan contornos uMap ni salen de ellos', () => {
  const polygons = source.features.filter((feature) => feature.geometry.type === 'Polygon')
  for (const path of map.paths.filter((entry) => entry.source === 'simulated')) {
    if (originalNames.has(locations.get(path.from)?.name)) continue
    const [from, to] = path.coordinates.map(([lat, lng]) => [lng, lat])
    for (const polygon of polygons) {
      const ring = polygon.geometry.coordinates[0]
      assert.equal(inside(from, ring), inside(to, ring), `${locations.get(path.from).name} sale/entra a ${polygon.properties.name}`)
      for (let i = 1; i < ring.length; i++) {
        assert.equal(crossesEdge(from, to, ring[i - 1], ring[i]), false,
          `${locations.get(path.from).name} atraviesa ${polygon.properties.name}`)
      }
    }
  }
})

test('30 lugares tienen ruta y 18 permanecen visibles sin conexión', () => {
  const adjacency = new Map(map.locations.map((location) => [location.id, []]))
  for (const path of map.paths) {
    assert.ok(locations.has(path.from) && locations.has(path.to))
    assert.ok(path.weight >= 0)
    adjacency.get(path.from).push(path.to)
    adjacency.get(path.to).push(path.from)
  }
  const pois = map.locations.filter((location) => location.kind === 'poi')
  const visited = new Set([pois[0].id])
  const queue = [pois[0].id]
  for (const current of queue) {
    for (const neighbor of adjacency.get(current)) {
      if (!visited.has(neighbor)) { visited.add(neighbor); queue.push(neighbor) }
    }
  }
  assert.equal(pois.filter((poi) => visited.has(poi.id)).length, 30)
  assert.equal(pois.filter((poi) => !visited.has(poi.id)).length, 18)
  assert.ok(pois.some((poi) => poi.name === 'Parqueadero de Bicicletas' && !visited.has(poi.id)))
})
