import assert from 'node:assert/strict'
import test from 'node:test'
import { Stack } from '../src/structures/Stack.ts'

test('una pila vacía devuelve undefined y puede limpiarse repetidamente', () => {
  const stack = new Stack()
  assert.equal(stack.isEmpty(), true)
  assert.equal(stack.size(), 0)
  assert.equal(stack.peek(), undefined)
  assert.equal(stack.pop(), undefined)
  stack.clear()
  assert.equal(stack.size(), 0)
})

test('push, peek y pop mantienen el orden LIFO y el tamaño', () => {
  const stack = new Stack()
  stack.push('Biblioteca')
  stack.push('Cafetería')
  stack.push('Edificio Central')
  assert.equal(stack.size(), 3)
  assert.equal(stack.peek(), 'Edificio Central')
  assert.equal(stack.size(), 3)
  assert.equal(stack.pop(), 'Edificio Central')
  assert.equal(stack.pop(), 'Cafetería')
  assert.equal(stack.pop(), 'Biblioteca')
  assert.equal(stack.pop(), undefined)
  assert.equal(stack.isEmpty(), true)
})

test('acepta valores repetidos y clear descarta todos los nodos', () => {
  const stack = new Stack()
  stack.push(1)
  stack.push(1)
  stack.push(2)
  assert.equal(stack.pop(), 2)
  stack.clear()
  assert.equal(stack.peek(), undefined)
  assert.equal(stack.size(), 0)
  stack.push(3)
  assert.equal(stack.pop(), 3)
})

test('admite tipos genéricos por referencia sin alterar los valores', () => {
  const stack = new Stack()
  const location = { id: 'a', name: 'Biblioteca' }
  stack.push(location)
  assert.equal(stack.peek(), location)
  assert.equal(stack.pop(), location)
})
