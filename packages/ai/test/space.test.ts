import { describe, expect, it } from 'vitest';
import { createSimulatedState } from '../src/simulation.js';
import { analyzeSpace } from '../src/space.js';
import { makeObservation } from './fixtures.js';

describe('space and topology analysis', () => {
  it('measures open reachable space and escapes', () => {
    const result = analyzeSpace(createSimulatedState(makeObservation()));
    expect(result.reachableArea).toBe(25);
    expect(result.reachableAreaRatio).toBe(1);
    expect(result.escapeRouteCount).toBe(4);
    expect(result.deadEnd).toBe(false);
  });

  it('recognizes the tail as a reachable target without counting body as free area', () => {
    const result = analyzeSpace(createSimulatedState(makeObservation({
      head: { x: 2, y: 2 }, tail: { x: 1, y: 2 },
      body: [{ x: 2, y: 2 }, { x: 2, y: 3 }, { x: 1, y: 3 }, { x: 1, y: 2 }], direction: 'up',
    })));
    expect(result.tailReachable).toBe(true);
    expect(result.reachableArea).toBeLessThan(25);
  });

  it('detects a one-exit corridor and raises topology pressure', () => {
    const result = analyzeSpace(createSimulatedState(makeObservation({
      head: { x: 2, y: 2 }, tail: { x: 2, y: 2 }, body: [{ x: 2, y: 2 }],
      obstacles: [
        { id: 'u', position: { x: 2, y: 1 } },
        { id: 'd', position: { x: 2, y: 3 } },
        { id: 'l', position: { x: 1, y: 2 } },
      ],
    })));
    expect(result.escapeRouteCount).toBe(1);
    expect(result.articulationPressure).toBeGreaterThan(0);
  });
});
