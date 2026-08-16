import { describe, expect, it } from 'vitest';
import { probabilityPerEligibleDecision, shouldApplyDeviation, FAILURE_PRESETS } from '../src/index.js';

describe('Phase 6 statistical production verification', () => {
  it('emits zero deviations when disabled over a large deterministic sample', () => {
    const config = FAILURE_PRESETS['Record Attempt'];
    const probability = probabilityPerEligibleDecision(config, 10, { tick: 500, level: 5, risk: 0.8, length: 20, occupancyPercent: 0.5 });
    let applied = 0;
    for (let i = 0; i < 100_000; i += 1) if (shouldApplyDeviation(probability, ((i * 2654435761) >>> 0) / 0x1_0000_0000)) applied += 1;
    expect(applied).toBe(0);
  });

  it('tracks configured Bernoulli hazard probability within deterministic tolerance', () => {
    const probability = 0.013;
    let applied = 0;
    const count = 100_000;
    let state = 0x12345678;
    for (let i = 0; i < count; i += 1) {
      state ^= state << 13; state ^= state >>> 17; state ^= state << 5; state >>>= 0;
      if (shouldApplyDeviation(probability, state / 0x1_0000_0000)) applied += 1;
    }
    const observed = applied / count;
    expect(Math.abs(observed - probability)).toBeLessThan(0.0015);
  });

  it('never exceeds the configured per-decision cap', () => {
    const config = { ...FAILURE_PRESETS.Demo, probabilityPerMinute: 600, maximumProbabilityPerDecision: 0.017 };
    for (let level = 1; level <= 20; level += 1) {
      const value = probabilityPerEligibleDecision(config, 1, { tick: 1000, level, risk: 1, length: 300, occupancyPercent: 0.99 });
      expect(value).toBeLessThanOrEqual(0.017);
    }
  });
});
