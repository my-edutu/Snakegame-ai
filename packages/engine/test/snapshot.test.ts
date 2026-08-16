import { describe, expect, it } from 'vitest';
import { createBaselineConfig } from '../src/config.js';
import { createEngine, restoreEngine } from '../src/runtime.js';

describe('snapshot restore', () => {
  it('continues identically after restore', () => {
    const a = createEngine(createBaselineConfig(99));
    for (const input of ['right', 'down', 'left'] as const) a.step(input);
    const b = restoreEngine(JSON.parse(JSON.stringify(a.snapshot())));
    for (const input of ['up', 'right', 'down'] as const) {
      expect(a.step(input)).toEqual(b.step(input));
    }
  });
});
