import { describe, expect, it } from 'vitest';
import { aggregateRunResults } from '../src/aggregate.js';
import { nearestRank, summarizeNumbers } from '../src/percentiles.js';
import { stableReportJson } from '../src/report.js';
import type { SimulationRunResult } from '../src/types.js';

function row(seed: number, overrides: Partial<SimulationRunResult> = {}): SimulationRunResult {
  return {
    seed,
    terminalReason: 'death',
    deathCause: 'wall-collision',
    ticksSurvived: seed,
    maxLength: 3 + seed,
    maxOccupancyPercent: seed * 10,
    score: seed * 10,
    foodConsumed: seed,
    strategyTicks: { hunt: seed, escape: 1 },
    strategyTransitions: [{ from: 'explore', to: 'hunt', tick: 0 }],
    averageRisk: seed * 5,
    peakRisk: seed * 10,
    totalDecisionNodes: seed * 100,
    averageDecisionNodes: seed * 10,
    peakDecisionNodes: seed * 20,
    nearDeathCount: seed,
    hamiltonianEntries: 0,
    hamiltonianTicks: 0,
    levelReached: 1,
    levelCompleted: false,
    ...overrides,
  };
}

describe('aggregateRunResults', () => {
  it('computes deterministic summaries, counts and bounded top failures', () => {
    const report = aggregateRunResults([
      row(1),
      row(2, { deathCause: 'self-collision' }),
      row(3, { terminalReason: 'simulation-cap', deathCause: null }),
      row(4, { terminalReason: 'board-filled', deathCause: null, levelCompleted: true }),
    ], { topFailures: 2, retainRuns: false });

    expect(report.runCount).toBe(4);
    expect(report.terminalCounts).toEqual({ death: 2, 'board-filled': 1, 'simulation-cap': 1, 'no-move': 0 });
    expect(report.deathCauses).toEqual({ 'self-collision': 1, 'wall-collision': 1 });
    expect(report.ticks).toEqual({ min: 1, max: 4, mean: 2.5, p50: 2, p95: 4, p99: 4 });
    expect(report.topFailures.map((item) => item.seed)).toEqual([3, 2]);
    expect(report.levelFunnel).toEqual([{ level: 1, reached: 4, completed: 1 }]);
    expect(report.runs).toBeUndefined();
    expect(stableReportJson(report)).not.toMatch(/NaN|Infinity/);
  });

  it('uses deterministic nearest-rank percentiles and validates finite values', () => {
    expect(nearestRank([5, 1, 3, 2, 4], 0.5)).toBe(3);
    expect(nearestRank([5, 1, 3, 2, 4], 0.95)).toBe(5);
    expect(summarizeNumbers([])).toEqual({ min: 0, max: 0, mean: 0, p50: 0, p95: 0, p99: 0 });
    expect(() => summarizeNumbers([1, Number.POSITIVE_INFINITY])).toThrow();
  });
});
