/**
 * Cola FIFO (First In, First Out): el primero en entrar es el primero en salir.
 *
 * IMPORTANTE: esta cola es solo una DEMOSTRACIÓN académica. Los cupos reales
 * los asigna PostgreSQL mediante las RPC `register_for_event` y
 * `cancel_event_registration`.
 *
 * Implementación: arreglo + índice `head`. Así `dequeue` es O(1) amortizado
 * (usar `Array.shift()` sería O(n) porque mueve todos los elementos).
 */
export class Queue<T> {
  private items: T[] = [];
  private head = 0;

  /** Agrega un elemento al final de la fila. O(1). */
  enqueue(item: T): void {
    this.items.push(item);
  }

  /** Saca y devuelve el elemento del frente. Devuelve undefined si está vacía. */
  dequeue(): T | undefined {
    if (this.isEmpty()) return undefined;

    const item = this.items[this.head];
    this.head++;

    // Compactación: cuando la parte ya usada es grande, se libera memoria.
    if (this.head > 32 && this.head * 2 >= this.items.length) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }

    return item;
  }

  /** Devuelve el elemento del frente sin sacarlo. */
  peek(): T | undefined {
    return this.isEmpty() ? undefined : this.items[this.head];
  }

  /** Cantidad de elementos en la fila. */
  size(): number {
    return this.items.length - this.head;
  }

  isEmpty(): boolean {
    return this.size() === 0;
  }

  /** Vacía la fila. */
  clear(): void {
    this.items = [];
    this.head = 0;
  }

  /** Copia de los elementos en orden de salida (útil para dibujar la demo). */
  toArray(): T[] {
    return this.items.slice(this.head);
  }
}