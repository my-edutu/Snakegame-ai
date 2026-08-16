import { describe, expect, it } from 'vitest';
import { createHamiltonianOrder } from '../src/hamiltonian.js';

describe('Hamiltonian ordering', () => {
  it('covers every cell exactly once and closes by adjacency', () => {
    for (const [width, height] of [[6, 5], [5, 6], [4, 4]] as const) {
      const order = createHamiltonianOrder(width, height)!;
      expect(order).not.toBeNull();
      expect(order.size).toBe(width * height);
      const inverse = [...order.indexByCell.entries()].sort((a, b) => a[1] - b[1]).map(([k]) => k.split(',').map(Number));
      for (let i = 0; i < inverse.length; i += 1) {
        const [x1, y1] = inverse[i]!;
        const [x2, y2] = inverse[(i + 1) % inverse.length]!;
        expect(Math.abs(x1! - x2!) + Math.abs(y1! - y2!)).toBe(1);
      }
    }
  });

  it('rejects odd by odd and degenerate rectangles', () => {
    expect(createHamiltonianOrder(5, 5)).toBeNull();
    expect(createHamiltonianOrder(1, 6)).toBeNull();
    expect(createHamiltonianOrder(6, 1)).toBeNull();
  });
});
