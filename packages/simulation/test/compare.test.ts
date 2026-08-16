import { describe, expect, it } from 'vitest';
import { createBaselineConfig } from '@snake/engine';
import { compareAiConfigurations } from '../src/compare.js';
import { generateSeedCorpus } from '../src/seed-corpus.js';

describe('AI configuration comparisons', () => {
  it('uses the same seed corpus and stable variant ordering', () => {
    const seeds = generateSeedCorpus(17, 5);
    const report = compareAiConfigurations(
      seeds,
      createBaselineConfig(1),
      { maxTicks: 5 },
      [
        { name: 'deep', ai: { lookaheadDepth: 2, lookaheadNodeBudget: 32 } },
        { name: 'fast', ai: { lookaheadDepth: 1, lookaheadNodeBudget: 8 } },
      ],
      { topFailures: 1 },
    );
    expect(report.seeds).toEqual(seeds);
    expect(Object.keys(report.reports)).toEqual(['deep', 'fast']);
    expect(report.reports.deep?.runCount).toBe(5);
    expect(report.reports.fast?.runCount).toBe(5);
  });

  it('rejects duplicate or insufficient variants', () => {
    const seeds = [1];
    const engine = createBaselineConfig(1);
    expect(() => compareAiConfigurations(seeds, engine, { maxTicks: 1 }, [{ name: 'only', ai: {} }])).toThrow();
    expect(() => compareAiConfigurations(seeds, engine, { maxTicks: 1 }, [{ name: 'x', ai: {} }, { name: 'x', ai: {} }])).toThrow();
  });
});
