import { MinHeap } from '../../structures/MinHeap'

interface Sortable {
  id: string
  starts_at: string
}

export function compareByStart(a: Sortable, b: Sortable): number {
  const diff = new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  return diff !== 0 ? diff : a.id.localeCompare(b.id)
}

export function sortEventsByStart<T extends Sortable>(events: T[]): T[] {
  const heap = new MinHeap<T>(compareByStart)
  events.forEach((event) => heap.insert(event))
  return heap.extractAll()
}