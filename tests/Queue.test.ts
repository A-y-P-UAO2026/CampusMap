import { describe, expect, it } from 'vitest';
import { Queue } from './Queue';

describe('Queue (FIFO)', () => {
  it('empieza vacía', () => {
    const q = new Queue<string>();
    expect(q.isEmpty()).toBe(true);
    expect(q.size()).toBe(0);
    expect(q.peek()).toBeUndefined();
    expect(q.dequeue()).toBeUndefined();
  });

  it('respeta el orden de llegada: primero en entrar, primero en salir', () => {
    const q = new Queue<string>();
    q.enqueue('Ana');
    q.enqueue('Luis');
    q.enqueue('Marta');

    expect(q.dequeue()).toBe('Ana');
    expect(q.dequeue()).toBe('Luis');
    expect(q.dequeue()).toBe('Marta');
    expect(q.dequeue()).toBeUndefined();
  });

  it('peek devuelve el frente sin sacarlo', () => {
    const q = new Queue<number>();
    q.enqueue(1);
    q.enqueue(2);

    expect(q.peek()).toBe(1);
    expect(q.size()).toBe(2);
  });

  it('size e isEmpty se actualizan', () => {
    const q = new Queue<number>();
    q.enqueue(10);
    expect(q.size()).toBe(1);
    expect(q.isEmpty()).toBe(false);

    q.dequeue();
    expect(q.size()).toBe(0);
    expect(q.isEmpty()).toBe(true);
  });

  it('clear vacía la fila y se puede reutilizar', () => {
    const q = new Queue<number>();
    q.enqueue(1);
    q.enqueue(2);
    q.clear();

    expect(q.isEmpty()).toBe(true);
    q.enqueue(3);
    expect(q.dequeue()).toBe(3);
  });

  it('mantiene el orden al intercalar enqueue y dequeue', () => {
    const q = new Queue<number>();
    q.enqueue(1);
    q.enqueue(2);
    expect(q.dequeue()).toBe(1);
    q.enqueue(3);
    expect(q.dequeue()).toBe(2);
    expect(q.dequeue()).toBe(3);
  });

  it('mantiene el orden con muchos elementos (compactación interna)', () => {
    const q = new Queue<number>();
    for (let i = 0; i < 200; i++) q.enqueue(i);

    for (let i = 0; i < 150; i++) {
      expect(q.dequeue()).toBe(i);
    }

    expect(q.size()).toBe(50);
    expect(q.peek()).toBe(150);
    expect(q.toArray()[0]).toBe(150);
  });

  it('toArray devuelve el orden de salida sin modificar la cola', () => {
    const q = new Queue<string>();
    q.enqueue('a');
    q.enqueue('b');

    expect(q.toArray()).toEqual(['a', 'b']);
    expect(q.size()).toBe(2);
  });
});