export interface WeightedEdge<T> {
  to: T
  weight: number
}

export interface Graph<T> {
  addVertex(vertex: T): void
  addEdge(from: T, to: T, weight: number, bidirectional?: boolean): void
  removeVertex(vertex: T): boolean
  getNeighbors(vertex: T): readonly WeightedEdge<T>[]
  hasVertex(vertex: T): boolean
  vertices(): readonly T[]
}

export interface Trie {
  insert(word: string): void
  search(word: string): boolean
  startsWith(prefix: string): boolean
  suggestions(prefix: string, limit?: number): string[]
  remove(word: string): boolean
}

export interface MinHeap<T> {
  insert(value: T): void
  peek(): T | undefined
  extractMin(): T | undefined
  size(): number
  isEmpty(): boolean
}

export interface Queue<T> {
  enqueue(value: T): void
  dequeue(): T | undefined
  peek(): T | undefined
  size(): number
  isEmpty(): boolean
  clear(): void
}

export interface Stack<T> {
  push(value: T): void
  pop(): T | undefined
  peek(): T | undefined
  size(): number
  isEmpty(): boolean
  clear(): void
}
