import { describe, expect, it } from 'vitest';
import * as ai from '../src/index.js';
import { makeObservation } from './fixtures.js';

describe('candidate move ranking', () => {
  it('exports deterministic candidate ranking', () => {
    expect(typeof (ai as Record<string, unknown>).rankCandidateMoves).toBe('function');
  });

  it('prefers legal reachable moves with lower target distance', () => {
    const api = ai as any;
    if (typeof api.rankCandidateMoves !== 'function') return;
    const observation = makeObservation();
    const ranked = api.rankCandidateMoves(observation, { x: 4, y: 2 });
    expect(ranked[0]).toMatchObject({ direction: 'right', legal: true, targetDistance: 1 });
    expect(ranked.map((item: any) => item.direction)).toHaveLength(4);
  });

  it('marks reversal and blocked moves illegal and keeps deterministic order', () => {
    const api = ai as any;
    if (typeof api.rankCandidateMoves !== 'function') return;
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
});
