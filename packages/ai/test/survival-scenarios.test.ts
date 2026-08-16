import { describe, expect, it } from 'vitest';
import { decideSurvivalMove } from '../src/decision.js';
import { makeObservation } from './fixtures.js';

const previous = { mode: 'explore' as const, ticksInMode: 10 };
const config = { lookaheadDepth: 6, lookaheadNodeBudget: 800, minimumSafeAreaRatio: 0.3, highOccupancyThreshold: 0.7, strategyMinDwellTicks: 2 };

describe('adversarial survival scenarios', () => {
  it('rejects food that sits in a post-growth pocket when safer space exists', () => {
    const observation = makeObservation({
      board: { width: 6, height: 5 }, head: { x: 2, y: 2 }, tail: { x: 1, y: 2 },
      body: [{ x: 2, y: 2 }, { x: 1, y: 2 }], direction: 'right',
      food: [{ id: 'trap-food', type: 'normal', value: 1, position: { x: 3, y: 2 } }],
      obstacles: [
        { id: 'u', position: { x: 3, y: 1 } },
        { id: 'r', position: { x: 4, y: 2 } },
        { id: 'd', position: { x: 3, y: 3 } },
      ],
    });
    const result = decideSurvivalMove(observation, previous, config);
    const right = result.evaluations.find((e) => e.direction === 'right')!;
    expect(right.foodSafe).toBe(false);
    expect(right.hardRejected).toBe(true);
    expect(result.direction).not.toBe('right');
    expect(result.summary).toContain('FOOD PATH REJECTED');
  });

  it('survives by entering a vacating tail cell when that is the only route', () => {
    const observation = makeObservation({
      board: { width: 4, height: 4 }, head: { x: 2, y: 2 }, tail: { x: 2, y: 1 },
      body: [{ x: 2, y: 2 }, { x: 2, y: 1 }], direction: 'right', pendingGrowth: 0,
      obstacles: [
        { id: 'r', position: { x: 3, y: 2 } },
        { id: 'd', position: { x: 2, y: 3 } },
        { id: 'l', position: { x: 1, y: 2 } },
      ],
    });
    const result = decideSurvivalMove(observation, previous, config);
    expect(result.direction).toBe('up');
  });

  it('uses Hamiltonian mode on a compatible high-occupancy board', () => {
    const body = [
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
      { x: 3, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 1 },
      { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 },
    ];
    const observation = makeObservation({ board: { width: 4, height: 4 }, head: body[0], tail: body.at(-1), body, direction: 'left' });
    const result = decideSurvivalMove(observation, previous, { ...config, highOccupancyThreshold: 0.7 });
    expect(['hamiltonian', 'escape', 'high-risk']).toContain(result.strategy.mode);
    if (result.strategy.mode === 'hamiltonian') expect(result.summary).toContain('HAMILTONIAN MODE');
  });

  it('returns the least-risk deterministic move when every option is dangerous', () => {
    const observation = makeObservation({
      board: { width: 5, height: 5 }, head: { x: 2, y: 2 }, tail: { x: 1, y: 2 },
      body: [{ x: 2, y: 2 }, { x: 1, y: 2 }], direction: 'right',
      obstacles: [{ id: 'u', position: { x: 2, y: 1 } }, { id: 'd', position: { x: 2, y: 3 } }],
    });
    const first = decideSurvivalMove(observation, previous, { ...config, minimumSafeAreaRatio: 0.95 });
    expect(first.direction).not.toBeNull();
    expect(decideSurvivalMove(observation, previous, { ...config, minimumSafeAreaRatio: 0.95 })).toEqual(first);
  });
});
