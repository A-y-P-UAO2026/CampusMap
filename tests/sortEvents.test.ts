import { describe, expect, it } from 'vitest';
import { sortEventsByStart } from '../src/features/events/sortEvents';

const ev = (id: string, starts_at: string) => ({ id, starts_at });

describe('sortEventsByStart (Min-Heap)', () => {
  it('devuelve lista vacía si no hay eventos', () => {
    expect(sortEventsByStart([])).toEqual([]);
  });

  it('ordena eventos desordenados por fecha de inicio', () => {
    const result = sortEventsByStart([
      ev('c', '2026-12-01T10:00:00Z'),
      ev('a', '2026-10-20T08:00:00Z'),
      ev('b', '2026-11-05T15:00:00Z'),
    ]);
    expect(result.map((e) => e.id)).toEqual(['a', 'b', 'c']);
  });

  it('desempata por id cuando las fechas son iguales', () => {
    const result = sortEventsByStart([
      ev('z', '2026-11-05T15:00:00Z'),
      ev('m', '2026-11-05T15:00:00Z'),
      ev('a', '2026-11-05T15:00:00Z'),
    ]);
    expect(result.map((e) => e.id)).toEqual(['a', 'm', 'z']);
  });

  it('no modifica el arreglo original', () => {
    const input = [ev('b', '2026-11-05T15:00:00Z'), ev('a', '2026-10-20T08:00:00Z')];
    sortEventsByStart(input);
    expect(input.map((e) => e.id)).toEqual(['b', 'a']);
  });
});