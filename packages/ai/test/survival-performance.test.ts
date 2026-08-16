import { describe, expect, it } from 'vitest';
import { decideSurvivalMove } from '../src/decision.js';
import { makeObservation } from './fixtures.js';

describe('survival reasoning structural budgets', () => {
  it('stays finite and deterministic on a 100x100 board', () => {
    const observation = makeObservation({ board: { width: 100, height: 100 }, head: { x: 50, y: 50 }, tail: { x: 50, y: 50 }, body: [{ x: 50, y: 50 }] });
    const config = { lookaheadDepth: 8, lookaheadNodeBudget: 6000, minimumSafeAreaRatio: 0.35, highOccupancyThreshold: 0.72, strategyMinDwellTicks: 6 };
    const previous = { mode: 'explore' as const, ticksInMode: 10 };
    const first = decideSurvivalMove(observation, previous, config);
    expect(first.nodesEvaluated).toBeLessThanOrEqual(6000);
    expect(first.direction).not.toBeNull();
    expect(decideSurvivalMove(observation, previous, config)).toEqual(first);
  });

  it('honors tiny production budgets without returning an illegal move', () => {
    const observation = makeObservation({ board: { width: 30, height: 30 } });
    const result = decideSurvivalMove(observation, { mode: 'explore', ticksInMode: 0 }, { lookaheadDepth: 20, lookaheadNodeBudget: 12, minimumSafeAreaRatio: 0.35, highOccupancyThreshold: 0.72, strategyMinDwellTicks: 6 });
    expect(result.nodesEvaluated).toBeLessThanOrEqual(12);
    expect(result.budgetExhausted).toBe(true);
    expect(result.evaluations.find((e) => e.direction === result.direction)?.legal).toBe(true);
  });
});
