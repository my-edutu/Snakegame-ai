import { describe, expect, it } from 'vitest';
import { partitionSeedRanges } from '../src/parallel.js';

const seeds = [10, 20, 30, 40, 50, 60, 70];

describe('parallel partitioning', () => {
  it('uses deterministic contiguous ranges and reassembles to the original order', () => {
    const parts = partitionSeedRanges(seeds, 3);
    expect(parts).toEqual([
      { startIndex: 0, seeds: [10, 20, 30] },
      { startIndex: 3, seeds: [40, 50] },
      { startIndex: 5, seeds: [60, 70] },
    ]);
    expect(parts.flatMap((part) => part.seeds)).toEqual(seeds);
  });

  it('caps workers to seed count and rejects unsafe counts', () => {
    expect(partitionSeedRanges([1, 2], 8)).toHaveLength(2);
    expect(() => partitionSeedRanges(seeds, 0)).toThrow();
    expect(() => partitionSeedRanges(seeds, 65)).toThrow();
  });
});
