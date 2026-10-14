import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { LocationHistory } from '../src/features/map/lib/location-history.ts'

test('Biblioteca → Cafetería → Central → Volver → Cafetería → Volver → Biblioteca', () => {
  const history = new LocationHistory()
  assert.equal(history.visit('biblioteca'), true)
  assert.equal(history.visit('cafeteria'), true)
  assert.equal(history.visit('central'), true)
  assert.equal(history.current(), 'central')
  assert.equal(history.back(), 'cafeteria')
  assert.equal(history.current(), 'cafeteria')
  assert.equal(history.back(), 'biblioteca')
  assert.equal(history.current(), 'biblioteca')
  assert.equal(history.canGoBack(), false)
  assert.equal(history.back(), undefined)
  assert.equal(history.current(), 'biblioteca')
})

test('seleccionar la misma ubicación repetidamente no crea entradas duplicadas', () => {
  const history = new LocationHistory()
  assert.equal(history.visit('biblioteca'), true)
  assert.equal(history.visit('biblioteca'), false)
  assert.equal(history.canGoBack(), false)
  assert.equal(history.visit('cafeteria'), true)
  assert.equal(history.visit('cafeteria'), false)
  assert.equal(history.back(), 'biblioteca')
  assert.equal(history.back(), undefined)
})

test('Volver no reintroduce el lugar abandonado y visitar uno nuevo crea una rama', () => {
  const history = new LocationHistory()
  for (const id of ['A', 'B', 'C']) history.visit(id)
  assert.equal(history.back(), 'B')
  assert.equal(history.visit('D'), true)
  assert.equal(history.back(), 'B')
  assert.equal(history.back(), 'A')
  assert.equal(history.canGoBack(), false)
})

test('historial vacío y recarga borran la selección y la pila', () => {
  const history = new LocationHistory()
  assert.equal(history.back(), undefined)
  assert.equal(history.current(), undefined)
  history.visit('A')
  history.visit('B')
  history.clear()
  assert.equal(history.current(), undefined)
  assert.equal(history.canGoBack(), false)
  assert.equal(history.back(), undefined)
  assert.equal(history.visit('C'), true)
  assert.equal(history.canGoBack(), false)
})

test('Stack recuerda ubicaciones nuevas y aisladas del catálogo de 48 POI', () => {
  const data = JSON.parse(readFileSync(new URL('../src/features/map/data/uao-network.json', import.meta.url), 'utf8'))
  const poi = data.locations.filter((place) => place.kind === 'poi')
  assert.equal(poi.length, 48)
  const history = new LocationHistory()
  for (const place of poi) assert.equal(history.visit(place.id), true)
  for (let index = poi.length - 2; index >= 0; index--) assert.equal(history.back(), poi[index].id)
  assert.equal(history.canGoBack(), false)
})
