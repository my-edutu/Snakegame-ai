import { describe, expect, it } from 'vitest';
import { encodeCell, enumerateFreeCells, occupancyPercent } from '../src/occupancy.js';

describe('board occupancy', () => {
  it('encodes coordinates in deterministic row-major order', () => {
    expect(encodeCell({ x: 2, y: 3 }, 10)).toBe(32);
  });

  it('enumerates free cells in row-major order while excluding occupied cells', () => {
    expect(enumerateFreeCells(3, 2, [{ x: 1, y: 0 }])).toEqual([
      { x: 0, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
    ]);
  });

  it('calculates occupancy as snake cells divided by board cells', () => {
    expect(occupancyPercent(5, 5, 4)).toBe(25);
  });
});
