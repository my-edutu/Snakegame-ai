import { describe, expect, it } from 'vitest';
import { generateSeedCorpus, validateExplicitSeeds } from '../src/seed-corpus.js';

describe('seed corpus', () => {
  it('is deterministic, bounded, unique for representative corpora, and caller-owned', () => {
    const first = generateSeedCorpus(845732916, 1000);
    const second = generateSeedCorpus(845732916, 1000);
    expect(second).toEqual(first);
    expect(new Set(first).size).toBe(1000);
    expect(first.every((seed) => Number.isInteger(seed) && seed >= 0 && seed <= 0xffff_ffff)).toBe(true);
    const mutable = first as number[];
    mutable[0] = 7;
    expect(generateSeedCorpus(845732916, 1000)[0]).not.toBe(7);
  });

  it('normalizes explicit signed integers to uint32 without mutating input', () => {
    const input = [-1, 1, 2] as const;
    expect(validateExplicitSeeds(input)).toEqual([0xffff_ffff, 1, 2]);
    expect(input).toEqual([-1, 1, 2]);
  });

  it('rejects invalid corpus sizes and non-integer seeds', () => {
    expect(() => generateSeedCorpus(1, 0)).toThrow();
    expect(() => generateSeedCorpus(1.2, 1)).toThrow();
    expect(() => validateExplicitSeeds([1, 2.2])).toThrow();
  });
});
