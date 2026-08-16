import { describe, expect, it } from 'vitest';
import * as failure from '../src/index.js';

const evaluation = (direction: string, legal: boolean, totalScore: number, trapProbability: number, overrides: Record<string, unknown> = {}) => ({
  direction, legal, hardRejected: false, reachableArea: 20, reachableAreaRatio: 0.7, tailReachable: true, escapeRouteCount: 3, corridorDepth: 1,
  foodDistance: 4, foodSafe: true, predictedSurvivalTicks: 8, hamiltonianPenalty: 0, trapProbability, totalScore, reasons: [], ...overrides,
});

const decision = {
  direction: 'right', strategy: { mode: 'explore', ticksInMode: 10 }, risk: { level: 'moderate', score: 45, contributors: { safeMoves: 3 } }, summary: 'baseline', nodesEvaluated: 12, budgetExhausted: false,
  evaluations: [evaluation('right', true, 100, 0.1), evaluation('down', true, 90, 0.16), evaluation('left', false, -1_000_000_000, 1), evaluation('up', true, 10, 0.95)],
};

describe('Phase 6 deviation policy registry', () => {
  it('exports application API', () => {
    expect(typeof Reflect.get(failure, 'applyConfiguredDeviation')).toBe('function');
  });

  it('selects only legal alternatives and preserves baseline evidence', () => {
    const apply = Reflect.get(failure, 'applyConfiguredDeviation') as any;
    if (typeof apply !== 'function') return;
    const result = apply({ decision, deviationType: 'second-best-route', naturalLookingOnly: false, draw01: 0 });
    expect(result.applied).toBe(true);
    expect(result.direction).toBe('down');
    expect(result.direction).not.toBe('left');
    expect(result.baselineDirection).toBe('right');
    expect(result.baselineScore).toBe(100);
  });

  it('rejects materially suicidal alternatives in natural-looking mode', () => {
    const apply = Reflect.get(failure, 'applyConfiguredDeviation') as any;
    if (typeof apply !== 'function') return;
    const result = apply({ decision, deviationType: 'risky-corridor', naturalLookingOnly: true, draw01: 0.99 });
    expect(result.direction).not.toBe('up');
    expect(result.direction).toBe('down');
  });

  it('is deterministic for every supported policy and draw', () => {
    const apply = Reflect.get(failure, 'applyConfiguredDeviation') as any;
    if (typeof apply !== 'function') return;
    const types = ['second-best-route', 'reduced-lookahead', 'food-over-weight', 'delayed-tail-follow', 'risky-corridor', 'temporary-scoring-bias'];
    for (const deviationType of types) expect(apply({ decision, deviationType, naturalLookingOnly: false, draw01: 0.37 })).toEqual(apply({ decision, deviationType, naturalLookingOnly: false, draw01: 0.37 }));
  });
});
