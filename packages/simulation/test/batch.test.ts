import { describe, expect, it } from 'vitest';
import { createBaselineConfig } from '@snake/engine';
import { runBatch, runBatchRows } from '../src/batch.js';
import { generateSeedCorpus } from '../src/seed-corpus.js';
import { stableReportJson } from '../src/report.js';

const request = {
  seeds: generateSeedCorpus(42, 12),
  execution: {
    engine: createBaselineConfig(1),
    ai: { lookaheadDepth: 1, lookaheadNodeBudget: 24, strategyMinDwellTicks: 1 },
    harness: { maxTicks: 12 },
  },
  topFailures: 3,
} as const;

describe('runBatch', () => {
  it('is byte deterministic and preserves canonical seed order when rows are retained', () => {
    const first = runBatch({ ...request, retainRuns: true });
    const second = runBatch({ ...request, retainRuns: true });
    expect(stableReportJson(second)).toBe(stableReportJson(first));
    expect(first.runs?.map((row) => row.seed)).toEqual(request.seeds);
  });

  it('does not retain full run rows unless explicitly requested', () => {
    const report = runBatch(request);
    expect(report.runs).toBeUndefined();
    expect(report.topFailures.length).toBeLessThanOrEqual(3);
  });

  it('returns one row per seed', () => {
    expect(runBatchRows(request)).toHaveLength(request.seeds.length);
  });
});
