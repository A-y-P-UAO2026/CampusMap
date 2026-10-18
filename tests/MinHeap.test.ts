import { describe, expect, it } from 'vitest';
import { MinHeap } from '../src/structures/MinHeap';

const numeric = (a: number, b: number) => a - b;

interface FakeEvent {
    id: string;
    startsAt: string; // fecha ISO
}

// Comparador de ejemplo: fecha de inicio y, si empatan, id.
const byStartDate = (a: FakeEvent, b: FakeEvent) => {
    const diff = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    return diff !== 0 ? diff : a.id.localeCompare(b.id);
};

describe('MinHeap', () => {
    it('sin elementos: peek y extract devuelven undefined', () => {
        const heap = new MinHeap<number>(numeric);
        expect(heap.isEmpty()).toBe(true);
        expect(heap.size()).toBe(0);
        expect(heap.peek()).toBeUndefined();
        expect(heap.extract()).toBeUndefined();
        expect(heap.extractAll()).toEqual([]);
    });

    it('peek devuelve el mínimo sin sacarlo', () => {
        const heap = new MinHeap<number>(numeric);
        [5, 3, 8].forEach((n) => heap.insert(n));

        expect(heap.peek()).toBe(3);
        expect(heap.size()).toBe(3);
    });

    it('extrae los números en orden ascendente', () => {
        const heap = new MinHeap<number>(numeric);
        [9, 4, 7, 1, 8, 2, 6, 3, 5].forEach((n) => heap.insert(n));

        expect(heap.extractAll()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        expect(heap.isEmpty()).toBe(true);
    });

    it('funciona con valores repetidos', () => {
        const heap = new MinHeap<number>(numeric);
        [3, 1, 3, 1, 2].forEach((n) => heap.insert(n));

        expect(heap.extractAll()).toEqual([1, 1, 2, 3, 3]);
    });

    it('ordena eventos desordenados por fecha de inicio', () => {
        const heap = new MinHeap<FakeEvent>(byStartDate);
        heap.insert({ id: 'c', startsAt: '2026-11-20T10:00:00Z' });
        heap.insert({ id: 'a', startsAt: '2026-10-25T15:00:00Z' });
        heap.insert({ id: 'b', startsAt: '2026-11-02T09:00:00Z' });

        expect(heap.extractAll().map((e) => e.id)).toEqual(['a', 'b', 'c']);
    });

    it('desempata con el id cuando las fechas son iguales', () => {
        const heap = new MinHeap<FakeEvent>(byStartDate);
        heap.insert({ id: 'z', startsAt: '2026-11-02T09:00:00Z' });
        heap.insert({ id: 'm', startsAt: '2026-11-02T09:00:00Z' });
        heap.insert({ id: 'a', startsAt: '2026-11-02T09:00:00Z' });

        expect(heap.extractAll().map((e) => e.id)).toEqual(['a', 'm', 'z']);
    });

    it('si el comparador devuelve 0, sale primero el insertado antes', () => {
        const heap = new MinHeap<{ name: string; key: number }>(
            (a, b) => a.key - b.key,
        );
        heap.insert({ name: 'primero', key: 1 });
        heap.insert({ name: 'segundo', key: 1 });
        heap.insert({ name: 'tercero', key: 1 });

        expect(heap.extractAll().map((x) => x.name)).toEqual([
            'primero',
            'segundo',
            'tercero',
        ]);
    });

    it('permite intercalar inserciones y extracciones', () => {
        const heap = new MinHeap<number>(numeric);
        heap.insert(5);
        heap.insert(2);
        expect(heap.extract()).toBe(2);

        heap.insert(1);
        heap.insert(9);
        expect(heap.extract()).toBe(1);
        expect(heap.extract()).toBe(5);
        expect(heap.extract()).toBe(9);
    });

    it('ordena correctamente un volumen grande de datos', () => {
        const heap = new MinHeap<number>(numeric);
        const data = Array.from({ length: 500 }, (_, i) => (i * 37) % 501);
        data.forEach((n) => heap.insert(n));

        const expected = [...data].sort((a, b) => a - b);
        expect(heap.extractAll()).toEqual(expected);
    });

    it('clear deja el heap vacío y reutilizable', () => {
        const heap = new MinHeap<number>(numeric);
        [3, 2, 1].forEach((n) => heap.insert(n));
        heap.clear();

        expect(heap.isEmpty()).toBe(true);
        heap.insert(7);
        expect(heap.peek()).toBe(7);
    });
});