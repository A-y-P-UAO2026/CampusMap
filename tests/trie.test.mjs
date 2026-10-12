import assert from 'node:assert/strict'
import test from 'node:test'
import { Trie, normalizeTrieText } from '../src/structures/Trie.ts'

test('normaliza tildes, mayúsculas y espacios de forma consistente', () => {
  assert.equal(normalizeTrieText('  BÍBLIOTECA   CRAI  '), 'biblioteca crai')
  const trie = new Trie()
  trie.insert('Bibliotéca CRAI')
  assert.equal(trie.search('BIBLIOTECA CRAI'), true)
  assert.equal(trie.search('bibli'), false)
  assert.equal(trie.startsWith('bíblI'), true)
  assert.deepEqual(trie.suggestions('BIBLI'), ['biblioteca crai'])
})

test('devuelve sugerencias por prefijo en orden determinista y respeta el límite', () => {
  const trie = new Trie()
  for (const name of ['Biblioteca Sur', 'Biblioteca Norte', 'Biblioteca', 'Biblioteca Centro']) trie.insert(name)
  assert.deepEqual(trie.suggestions('bibli', 3), [
    'biblioteca', 'biblioteca centro', 'biblioteca norte',
  ])
  assert.deepEqual(trie.suggestions('bibli', 1), ['biblioteca'])
  assert.deepEqual(trie.suggestions('bibli', 0), [])
  assert.deepEqual(trie.suggestions('bibli', -1), [])
  assert.deepEqual(trie.suggestions('bibli', Infinity), [])
  assert.deepEqual(trie.suggestions('bibli', 1.9), ['biblioteca'])
})

test('maneja consultas vacías, inexistentes e inserciones repetidas', () => {
  const trie = new Trie()
  assert.equal(trie.startsWith(''), false)
  assert.equal(trie.search(''), false)
  assert.deepEqual(trie.suggestions(''), [])
  trie.insert('  ')
  assert.deepEqual(trie.suggestions('a'), [])
  trie.insert('Aulas')
  trie.insert('ÁULAS')
  assert.equal(trie.startsWith(''), true)
  assert.deepEqual(trie.suggestions('au'), ['aulas'])
  assert.equal(trie.search('desconocido'), false)
  assert.deepEqual(trie.suggestions('xyz'), [])
})

test('remove borra solo la palabra completa y limpia prefijos sin otras ramas', () => {
  const trie = new Trie()
  trie.insert('Aula')
  trie.insert('Aulas')
  trie.insert('Auditorio')
  assert.equal(trie.remove('aulas'), true)
  assert.equal(trie.search('AULA'), true)
  assert.equal(trie.search('aulas'), false)
  assert.equal(trie.remove('aulas'), false)
  assert.equal(trie.remove('au'), false)
  assert.equal(trie.remove('aula'), true)
  assert.equal(trie.startsWith('aul'), false)
  assert.equal(trie.startsWith('audi'), true)
  assert.deepEqual(trie.suggestions('au'), ['auditorio'])
})
