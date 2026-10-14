import type { Stack as StackContract } from '../types/structures'

interface StackNode<T> {
  value: T
  next: StackNode<T> | undefined
}

/** Pila LIFO enlazada, con operaciones O(1) y sin dependencias externas. */
export class Stack<T> implements StackContract<T> {
  private top: StackNode<T> | undefined
  private length = 0

  push(value: T): void {
    this.top = { value, next: this.top }
    this.length += 1
  }

  pop(): T | undefined {
    const node = this.top
    if (!node) return undefined
    this.top = node.next
    this.length -= 1
    return node.value
  }

  peek(): T | undefined {
    return this.top?.value
  }

  size(): number {
    return this.length
  }

  isEmpty(): boolean {
    return this.length === 0
  }

  clear(): void {
    this.top = undefined
    this.length = 0
  }
}
