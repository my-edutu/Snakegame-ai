import { describe, expect, it } from 'vitest';
import * as ai from '../src/index.js';
import { makeObservation } from './fixtures.js';

describe('candidate move ranking', () => {
  it('exports deterministic candidate ranking', () => {
    expect(typeof (ai as Record<string, unknown>).rankCandidateMoves).toBe('function');
  });

  it('prefers legal reachable moves with lower static target distance', () => {
    const api = ai as any;
    const observation = makeObservation();
    const ranked = api.rankCandidateMoves(observation, { x: 4, y: 2 });
    expect(ranked[0]).toMatchObject({ direction: 'right', legal: true, staticTargetDistance: 1 });
    expect(ranked[0]).not.toHaveProperty('targetDistance');
    expect(ranked.map((item: any) => item.direction)).toHaveLength(4);
  });

  it('labels distance as static-board telemetry rather than predictive survivability', () => {
    const api = ai as any;
    const observation = makeObservation({
      head: { x: 2, y: 2 },
      body: [{ x: 2, y: 2 }, { x: 1, y: 2 }, { x: 1, y: 3 }],
      tail: { x: 1, y: 3 },
      direction: 'right',
      pendingGrowth: 0,
    });
    const ranked = api.rankCandidateMoves(observation, { x: 4, y: 2 });
    for (const candidate of ranked) {
      expect(candidate).toHaveProperty('staticTargetDistance');
      expect(candidate).not.toHaveProperty('targetDistance');
    }
  });

  it('marks reversal and blocked moves illegal and keeps deterministic order', () => {
    const api = ai as any;
    const observation = makeObservation({
      head: { x: 2, y: 2 },
      body: [{ x: 2, y: 2 }, { x: 1, y: 2 }, { x: 0, y: 2 }],
      tail: { x: 0, y: 2 },
      direction: 'right',
      obstacles: [{ id: 'right-block', position: { x: 3, y: 2 } }],
    });
    const ranked = api.rankCandidateMoves(observation, { x: 4, y: 2 });
    const right = ranked.find((item: any) => item.direction === 'right');
    const left = ranked.find((item: any) => item.direction === 'left');
    expect(right.legal).toBe(false);
    expect(left.legal).toBe(false);
    expect(api.rankCandidateMoves(observation, { x: 4, y: 2 })).toEqual(ranked);
  });

  it('matches engine tail-vacate legality when growth is or is not pending', () => {
    const api = ai as any;
    const base = makeObservation({
      head: { x: 2, y: 2 },
      body: [{ x: 2, y: 2 }, { x: 2, y: 1 }],
      tail: { x: 2, y: 1 },
      direction: 'right',
      pendingGrowth: 0,
    });
    const vacating = api.rankCandidateMoves(base).find((item: any) => item.direction === 'up');
    expect(vacating.legal).toBe(true);

    const growing = api.rankCandidateMoves({ ...base, pendingGrowth: 1 }).find((item: any) => item.direction === 'up');
    expect(growing.legal).toBe(false);
  });
});
