/**
 * Min-Heap (montículo mínimo) genérico.
 *
 * Es un árbol binario guardado en un arreglo donde cada padre es menor o
 * igual que sus hijos, así que la raíz (posición 0) es siempre el mínimo.
 *
 * Para el nodo en la posición i:
 *   - padre:        Math.floor((i - 1) / 2)
 *   - hijo izq.:    2 * i + 1
 *   - hijo der.:    2 * i + 2
 *
 * Complejidad: insert O(log n), extract O(log n), peek O(1).
 *
 * Desempate determinista: si el comparador dice que dos elementos son
 * iguales (devuelve 0), sale primero el que se insertó antes.
 *
 * Uso en CampusMap: ordenar eventos por fecha de inicio.
 */

interface HeapNode<T> {
  value: T;
  order: number; // orden de inserción, sirve para desempatar
}

export class MinHeap<T> {
  private heap: HeapNode<T>[] = [];
  private counter = 0;
  private readonly compare: (a: T, b: T) => number;

  /**
   * @param compare Devuelve negativo si a va antes que b, positivo si va
   *                después, y 0 si son equivalentes.
   */
  constructor(compare: (a: T, b: T) => number) {
    this.compare = compare;
  }

  /** Inserta un elemento. O(log n). */
  insert(value: T): void {
    this.heap.push({ value, order: this.counter++ });
    this.siftUp(this.heap.length - 1);
  }

  /** Devuelve el mínimo sin sacarlo. O(1). */
  peek(): T | undefined {
    return this.heap[0]?.value;
  }

  /** Saca y devuelve el mínimo. O(log n). */
  extract(): T | undefined {
    if (this.heap.length === 0) return undefined;

    const min = this.heap[0];
    const last = this.heap.pop()!;

    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.siftDown(0);
    }

    return min.value;
  }

  size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  clear(): void {
    this.heap = [];
    this.counter = 0;
  }

  /** Extrae todo en orden ascendente (vacía el heap). */
  extractAll(): T[] {
    const result: T[] = [];
    while (!this.isEmpty()) {
      result.push(this.extract() as T);
    }
    return result;
  }

  // ---- Métodos internos ----

  /** true si el nodo en i debe ir antes que el nodo en j. */
  private isBefore(i: number, j: number): boolean {
    const a = this.heap[i];
    const b = this.heap[j];
    const result = this.compare(a.value, b.value);
    return result !== 0 ? result < 0 : a.order < b.order;
  }

  private swap(i: number, j: number): void {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  /** Sube el nodo mientras sea menor que su padre. */
  private siftUp(index: number): void {
    let i = index;
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (!this.isBefore(i, parent)) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  /** Baja el nodo mientras tenga un hijo menor que él. */
  private siftDown(index: number): void {
    let i = index;
    const n = this.heap.length;

    while (true) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      let smallest = i;

      if (left < n && this.isBefore(left, smallest)) smallest = left;
      if (right < n && this.isBefore(right, smallest)) smallest = right;
      if (smallest === i) break;

      this.swap(i, smallest);
      i = smallest;
    }
  }
}