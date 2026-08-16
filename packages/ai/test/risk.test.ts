import { describe, expect, it } from 'vitest';
import { assessRisk } from '../src/risk.js';

describe('survival risk', () => {
  it('is clamped and monotonic for worsening evidence', () => {
    const safe = assessRisk({ safeMoves: 4, reachableAreaRatio: 1, escapeRouteCount: 4, occupancyRatio: 0, bodyPressure: 0, trapProbability: 0, lookaheadFailure: 0, topologyPressure: 0 });
    const mid = assessRisk({ safeMoves: 2, reachableAreaRatio: 0.5, escapeRouteCount: 2, occupancyRatio: 0.5, bodyPressure: 0.5, trapProbability: 0.5, lookaheadFailure: 0.5, topologyPressure: 0.5 });
    const danger = assessRisk({ safeMoves: 0, reachableAreaRatio: 0, escapeRouteCount: 0, occupancyRatio: 1, bodyPressure: 1, trapProbability: 1, lookaheadFailure: 1, topologyPressure: 1 });
    expect(safe.score).toBeGreaterThanOrEqual(0);
    expect(danger.score).toBeLessThanOrEqual(100);
    expect(mid.score).toBeGreaterThan(safe.score);
    expect(danger.score).toBeGreaterThan(mid.score);
    expect(danger.level).toBe('critical');
  });

  it('normalizes out-of-range inputs deterministically', () => {
    const result = assessRisk({ safeMoves: 99, reachableAreaRatio: 2, escapeRouteCount: 99, occupancyRatio: -1, bodyPressure: -2, trapProbability: 3, lookaheadFailure: 2, topologyPressure: -1 });
    expect(result.contributors.safeMoves).toBe(4);
    expect(result.contributors.reachableAreaRatio).toBe(1);
    expect(result.contributors.trapProbability).toBe(1);
    expect(assessRisk(result.contributors)).toEqual(result);
  });
});
