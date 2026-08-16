import { describe, expect, it } from 'vitest';
import { createHamiltonianOrder, isHamiltonianBodyOrdered } from '../src/hamiltonian.js';
import { createSimulatedState } from '../src/simulation.js';
import { makeObservation } from './fixtures.js';

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

  it('requires the existing body to follow predecessor order before Hamiltonian mode is eligible', () => {
    const order = createHamiltonianOrder(6, 5)!;
    const cells = [...order.indexByCell.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(([k]) => { const [x, y] = k.split(',').map(Number); return { x: x!, y: y! }; });
    const body = [cells[8]!, cells[7]!, cells[6]!, cells[5]!, cells[4]!];
    const ordered = createSimulatedState(makeObservation({ board: { width: 6, height: 5 }, head: body[0], tail: body.at(-1), body }));
    expect(isHamiltonianBodyOrdered(order, ordered)).toBe(true);
    const scrambledBody = [body[0]!, body[2]!, body[1]!, body[3]!, body[4]!];
    const scrambled = createSimulatedState(makeObservation({ board: { width: 6, height: 5 }, head: scrambledBody[0], tail: scrambledBody.at(-1), body: scrambledBody }));
    expect(isHamiltonianBodyOrdered(order, scrambled)).toBe(false);
  });

  it('rejects odd by odd and degenerate rectangles', () => {
    expect(createHamiltonianOrder(5, 5)).toBeNull();
    expect(createHamiltonianOrder(1, 6)).toBeNull();
    expect(createHamiltonianOrder(6, 1)).toBeNull();
  });
});
