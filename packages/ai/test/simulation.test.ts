import { describe, expect, it } from 'vitest';
import { createSimulatedState, simulateMove } from '../src/simulation.js';
import { makeObservation } from './fixtures.js';

describe('survival simulation', () => {
  it('rejects reversal, wall, body, obstacle, and hazard collisions', () => {
    const base = createSimulatedState(makeObservation({
      head: { x: 2, y: 2 }, tail: { x: 1, y: 2 }, body: [{ x: 2, y: 2 }, { x: 1, y: 2 }], direction: 'right',
      obstacles: [{ id: 'o', position: { x: 3, y: 2 } }], hazards: [{ id: 'h', position: { x: 2, y: 1 } }],
    }));
    expect(simulateMove(base, 'left').legal).toBe(false);
    expect(simulateMove(base, 'right').legal).toBe(false);
    expect(simulateMove(base, 'up').legal).toBe(false);
    const edge = createSimulatedState(makeObservation({ head: { x: 0, y: 0 }, tail: { x: 0, y: 0 }, body: [{ x: 0, y: 0 }], direction: 'up' }));
    expect(simulateMove(edge, 'up').legal).toBe(false);
  });

  it('allows a vacating tail but blocks it while growth is pending', () => {
    const obs = makeObservation({ head: { x: 2, y: 2 }, tail: { x: 2, y: 1 }, body: [{ x: 2, y: 2 }, { x: 2, y: 1 }], direction: 'right', pendingGrowth: 0 });
    expect(simulateMove(createSimulatedState(obs), 'up').legal).toBe(true);
    expect(simulateMove(createSimulatedState({ ...obs, pendingGrowth: 1 }), 'up').legal).toBe(false);
  });

  it('matches configurable engine growth queues after food consumption', () => {
    const state = createSimulatedState(makeObservation({
      head: { x: 2, y: 2 }, tail: { x: 1, y: 2 }, body: [{ x: 2, y: 2 }, { x: 1, y: 2 }], direction: 'right',
      growthPerFood: 3,
      food: [{ id: 'f', type: 'normal', value: 1, position: { x: 3, y: 2 } }],
    }));
    const eaten = simulateMove(state, 'right');
    expect(eaten.legal).toBe(true);
    expect(eaten.state?.body).toHaveLength(3);
    expect(eaten.state?.pendingGrowth).toBe(2);
    expect(eaten.state?.growthPerFood).toBe(3);
  });

  it('matches engine collision semantics when zero-growth food occupies the vacating tail', () => {
    const state = createSimulatedState(makeObservation({
      head: { x: 2, y: 2 }, tail: { x: 2, y: 1 }, body: [{ x: 2, y: 2 }, { x: 2, y: 1 }], direction: 'right',
      growthPerFood: 0,
      food: [{ id: 'f', type: 'normal', value: 1, position: { x: 2, y: 1 } }],
    }));
    expect(simulateMove(state, 'up').legal).toBe(false);
  });

  it('deeply owns successor data', () => {
    const obs = makeObservation({ food: [{ id: 'f', type: 'normal', value: 1, position: { x: 3, y: 2 } }] });
    const state = createSimulatedState(obs);
    const step = simulateMove(state, 'right');
    expect(step.legal).toBe(true);
    const successor = step.state! as any;
    successor.body[0].x = 99;
    expect(state.body[0]).toEqual({ x: 2, y: 2 });
    expect(obs.head).toEqual({ x: 2, y: 2 });
  });
});
