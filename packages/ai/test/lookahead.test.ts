import { describe, expect, it } from 'vitest';
import { evaluateSurvivalLookahead } from '../src/lookahead.js';
import { createSimulatedState } from '../src/simulation.js';
import { makeObservation } from './fixtures.js';

describe('bounded survival lookahead', () => {
  it('detects forced death when no legal successor exists', () => {
    const state = createSimulatedState(makeObservation({
      head: { x: 2, y: 2 }, tail: { x: 2, y: 2 }, body: [{ x: 2, y: 2 }],
      obstacles: [
        { id: 'u', position: { x: 2, y: 1 } }, { id: 'r', position: { x: 3, y: 2 } },
        { id: 'd', position: { x: 2, y: 3 } }, { id: 'l', position: { x: 1, y: 2 } },
      ],
    }));
    const result = evaluateSurvivalLookahead(state, { depth: 4, nodeBudget: 100 });
    expect(result.predictedSurvivalTicks).toBe(0);
    expect(result.forcedDeath).toBe(true);
  });

  it('uses moving-tail space and remains deterministic', () => {
    const state = createSimulatedState(makeObservation({
      board: { width: 4, height: 4 }, head: { x: 2, y: 1 }, tail: { x: 1, y: 1 },
      body: [{ x: 2, y: 1 }, { x: 2, y: 2 }, { x: 1, y: 2 }, { x: 1, y: 1 }], direction: 'up',
    }));
    const first = evaluateSurvivalLookahead(state, { depth: 5, nodeBudget: 200 });
    expect(first.predictedSurvivalTicks).toBeGreaterThan(0);
    expect(evaluateSurvivalLookahead(state, { depth: 5, nodeBudget: 200 })).toEqual(first);
  });

  it('never exceeds its structural node budget', () => {
    const result = evaluateSurvivalLookahead(createSimulatedState(makeObservation({ board: { width: 100, height: 100 } })), { depth: 20, nodeBudget: 37 });
    expect(result.nodesEvaluated).toBeLessThanOrEqual(37);
    expect(result.budgetExhausted).toBe(true);
  });
});
