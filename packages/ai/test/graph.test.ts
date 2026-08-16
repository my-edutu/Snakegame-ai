import { describe, expect, it } from 'vitest';
import * as ai from '../src/index.js';
import { makeObservation } from './fixtures.js';

describe('deterministic board graph', () => {
  it('exports canonical graph functions', () => {
    const api = ai as Record<string, unknown>;
    expect(typeof api.enumerateNeighbors).toBe('function');
    expect(api.CANONICAL_DIRECTIONS).toEqual(['up', 'right', 'down', 'left']);
  });

  it('enumerates legal neighbors in canonical order and respects edges', () => {
    const api = ai as any;
    if (typeof api.enumerateNeighbors !== 'function') return;
    const observation = makeObservation();
    expect(api.enumerateNeighbors(observation, { x: 2, y: 2 }).map((item: any) => item.direction))
      .toEqual(['up', 'right', 'down', 'left']);
    expect(api.enumerateNeighbors(observation, { x: 0, y: 0 }).map((item: any) => item.direction))
      .toEqual(['right', 'down']);
  });

  it('blocks body, obstacles, and hazards while allowing an explicit target cell', () => {
    const api = ai as any;
    if (typeof api.enumerateNeighbors !== 'function') return;
    const observation = makeObservation({
      body: [{ x: 2, y: 2 }, { x: 2, y: 1 }],
      tail: { x: 2, y: 1 },
      obstacles: [{ id: 'wall', position: { x: 3, y: 2 } }],
      hazards: [{ id: 'hazard', position: { x: 2, y: 3 } }],
    });
    expect(api.enumerateNeighbors(observation, observation.head).map((item: any) => item.direction)).toEqual(['left']);
    expect(api.enumerateNeighbors(observation, observation.head, { traversableTarget: { x: 2, y: 1 } }).map((item: any) => item.direction))
      .toEqual(['up', 'left']);
  });
});
