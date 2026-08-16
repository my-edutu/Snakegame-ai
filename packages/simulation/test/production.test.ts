import { describe, expect, it } from 'vitest';
import { createBaselineConfig } from '@snake/engine';
import { runBatch } from '../src/batch.js';
import { stableReportJson } from '../src/report.js';
import { generateSeedCorpus } from '../src/seed-corpus.js';

describe('Phase 4 production regression corpus', () => {
  it('runs 100 deterministic seeds with bounded retention and finite aggregate evidence', () => {
    const request = {
      seeds: generateSeedCorpus(0x51a7e, 100),
      execution: {
        engine: createBaselineConfig(1),
        ai: { lookaheadDepth: 1, lookaheadNodeBudget: 16, strategyMinDwellTicks: 1 },
        harness: { maxTicks: 8 },
      },
      topFailures: 5,
    } as const;
    const first = runBatch(request);
    const second = runBatch(request);
    expect(stableReportJson(second)).toBe(stableReportJson(first));
    expect(first.runCount).toBe(100);
    expect(first.runs).toBeUndefined();
    expect(first.topFailures.length).toBeLessThanOrEqual(5);
    expect(Object.values(first.terminalCounts).reduce((sum, count) => sum + count, 0)).toBe(100);
    expect(Number.isFinite(first.decisionNodes.meanPerRun)).toBe(true);
    expect(first.ticks.max).toBeLessThanOrEqual(8);
  });
});
