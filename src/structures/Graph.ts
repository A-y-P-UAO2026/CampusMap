import type { Graph as GraphContract, WeightedEdge } from '../types/structures'

/** Grafo ponderado en memoria. Los vértices se comparan como claves de Map. */
export class Graph<T> implements GraphContract<T> {
  private readonly adjacency = new Map<T, Map<T, number>>()

  addVertex(vertex: T): void {
    if (!this.adjacency.has(vertex)) this.adjacency.set(vertex, new Map())
  }

  /** Agrega vértices ausentes y crea/actualiza las direcciones indicadas. */
  addEdge(from: T, to: T, weight: number, bidirectional = true): void {
    if (!Number.isFinite(weight) || weight < 0) {
      throw new RangeError('El peso de una conexión debe ser finito y no negativo.')
    }

    this.addVertex(from)
    this.addVertex(to)
    this.adjacency.get(from)!.set(to, weight)
    if (bidirectional) this.adjacency.get(to)!.set(from, weight)
  }

  /** Quita una o ambas direcciones. Devuelve true si eliminó alguna arista. */
  removeEdge(from: T, to: T, bidirectional = true): boolean {
    const removedForward = this.adjacency.get(from)?.delete(to) ?? false
    const removedReverse = bidirectional && from !== to
      ? this.adjacency.get(to)?.delete(from) ?? false
      : false
    return removedForward || removedReverse
  }

  removeVertex(vertex: T): boolean {
    if (!this.adjacency.delete(vertex)) return false
    for (const neighbors of this.adjacency.values()) neighbors.delete(vertex)
    return true
  }

  /** Devuelve una copia; modificarla no altera el grafo. */
  getNeighbors(vertex: T): readonly WeightedEdge<T>[] {
    const neighbors = this.adjacency.get(vertex)
    return neighbors ? Array.from(neighbors, ([to, weight]) => ({ to, weight })) : []
  }

  hasVertex(vertex: T): boolean {
    return this.adjacency.has(vertex)
  }

  vertices(): readonly T[] {
    return Array.from(this.adjacency.keys())
  }
}
