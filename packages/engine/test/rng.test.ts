import { describe, expect, it } from 'vitest';
import { createRng, restoreRng } from '../src/rng.js';

describe('deterministic rng', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createRng(845732916);
    const b = createRng(845732916);
    expect(Array.from({ length: 8 }, () => a.nextUint32())).toEqual(Array.from({ length: 8 }, () => b.nextUint32()));
  });

  it('continues identically after serialization', () => {
    const a = createRng(42);
    a.nextUint32();
    a.nextUint32();
    const b = restoreRng(a.serialize());
    expect(Array.from({ length: 5 }, () => a.nextUint32())).toEqual(Array.from({ length: 5 }, () => b.nextUint32()));
  });
});
