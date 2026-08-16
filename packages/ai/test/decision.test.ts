import { describe, expect, it } from 'vitest';
import { decideSurvivalMove } from '../src/decision.js';
import { makeObservation } from './fixtures.js';

const strategy = { mode: 'explore' as const, ticksInMode: 10 };
const config = { lookaheadDepth: 5, lookaheadNodeBudget: 400, minimumSafeAreaRatio: 0.3, highOccupancyThreshold: 0.72, strategyMinDwellTicks: 2 };

describe('survival decision engine', () => {
  it('evaluates all canonical directions and chooses a legal move', () => {
    const result = decideSurvivalMove(makeObservation(), strategy, config);
    expect(result.evaluations.map((e) => e.direction)).toEqual(['up', 'right', 'down', 'left']);
    expect(result.direction).not.toBeNull();
    expect(result.evaluations.find((e) => e.direction === result.direction)?.legal).toBe(true);
  });

  it('selects the only legal escape and reports critical pressure', () => {
    const observation = makeObservation({
      head: { x: 2, y: 2 }, tail: { x: 2, y: 2 }, body: [{ x: 2, y: 2 }], direction: 'right',
      obstacles: [
        { id: 'u', position: { x: 2, y: 1 } },
        { id: 'r', position: { x: 3, y: 2 } },
        { id: 'd', position: { x: 2, y: 3 } },
      ],
    });
    const result = decideSurvivalMove(observation, strategy, config);
    expect(result.direction).toBe('left');
    expect(result.strategy.mode).toBe('escape');
    expect(result.risk.level).toBe('critical');
  });

  it('owns decision evidence and is deep deterministic', () => {
    const observation = makeObservation({ food: [{ id: 'f', type: 'normal', value: 1, position: { x: 4, y: 2 } }] });
    const first = decideSurvivalMove(observation, strategy, config);
    expect(decideSurvivalMove(observation, strategy, config)).toEqual(first);
    const mutable = first as any;
    mutable.evaluations[0].reasons.push({ code: 'x', message: 'x', severity: 'info' });
    expect(decideSurvivalMove(observation, strategy, config)).not.toEqual(mutable);
  });
});
