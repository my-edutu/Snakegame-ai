import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/runtime.js';
import { createBaselineConfig } from '../src/config.js';

describe('engine determinism', () => {
  it('produces identical state and events for identical seed/config/input', () => {
    const config = createBaselineConfig(1234);
    const a = createEngine(config);
    const b = createEngine(config);
    const inputs = ['right', 'down', 'left', 'left', 'up', 'right'] as const;
    for (const input of inputs) {
      const ra = a.step(input);
      const rb = b.step(input);
      expect(ra).toEqual(rb);
    }
  });
});
