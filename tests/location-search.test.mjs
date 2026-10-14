import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { LocationSearchIndex, MAX_LOCATION_SUGGESTIONS } from '../src/features/map/lib/location-search.ts'

const location = (id, name, kind = 'poi', is_public = true) => ({
  id, name, slug: id, kind, is_public, lat: 3, lng: -76, x: 50, y: 50,
  description: null, created_at: '', updated_at: '',
})

test('las sugerencias preservan ID y nombre original aunque se busque sin tildes', () => {
  const places = [
    location('id-1', 'Bibliotéca - CRAI'),
    location('id-2', 'BIBLIOTECA - CRAI'),
    location('node-1', 'Biblioteca técnica', 'node'),
    location('private-1', 'Biblioteca privada', 'poi', false),
  ]
  const index = new LocationSearchIndex(places)
  assert.deepEqual(index.suggest('BIBLI').map(({ id, name }) => ({ id, name })), [
    { id: 'id-1', name: 'Bibliotéca - CRAI' },
    { id: 'id-2', name: 'BIBLIOTECA - CRAI' },
  ])
  assert.deepEqual(index.suggest('bíblI').map((place) => place.id), ['id-1', 'id-2'])
  assert.deepEqual(index.suggest('biblioteca tecnica'), [])
  assert.deepEqual(index.suggest('biblioteca privada'), [])
})

test('el índice no duplica IDs y limita sugerencias sin filtrar linealmente', () => {
  const places = Array.from({ length: 9 }, (_, index) => location(`id-${index}`, `Aulas ${index}`))
  places.push(places[0])
  const index = new LocationSearchIndex(places)
  assert.equal(index.suggest('AUL').length, MAX_LOCATION_SUGGESTIONS)
  assert.deepEqual(index.suggest('aulas', 2).map((place) => place.id), ['id-0', 'id-1'])
  assert.deepEqual(index.suggest('aulas', 0), [])
  assert.deepEqual(index.suggest(''), [])
  assert.deepEqual(index.suggest('no existe'), [])
})

test('el índice de los datos UAO encuentra POI, no los 74 nodos técnicos', () => {
  const data = JSON.parse(readFileSync(new URL('../src/features/map/data/uao-network.json', import.meta.url), 'utf8'))
  const locations = data.locations.map((entry) => ({ ...entry, is_public: true }))
  const index = new LocationSearchIndex(locations)
  const expected = locations.find((entry) => entry.slug === 'uao-poi-biblioteca-crai')
  assert.deepEqual(index.suggest('BIBLI').map((place) => place.id), [expected.id])
  assert.equal(locations.filter((place) => place.kind === 'node').length, 74)
  assert.equal(index.suggest('Nodo peatonal').length, 0)
  assert.equal(locations.filter((place) => place.kind === 'poi').length, 48)
  assert.equal(index.suggest('AUDITORIO').length, 4)
  assert.equal(index.suggest('porterIA', 6).length, 6)
  assert.equal(index.suggest('cancha', 6).length, 4)
})
