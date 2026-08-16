import { describe, expect, it } from 'vitest';
import * as ai from '../src/index.js';
import { makeObservation } from './fixtures.js';

describe('food and tail planners', () => {
  it('exports planner APIs', () => {
    const api = ai as Record<string, unknown>;
    expect(typeof api.planPathToFood).toBe('function');
    expect(typeof api.planPathToTail).toBe('function');
  });

  it('selects the shortest reachable food with deterministic target ties', () => {
    const api = ai as any;
    if (typeof api.planPathToFood !== 'function') return;
    const observation = makeObservation({
      food: [
        { id: 'later-row', type: 'normal', value: 1, position: { x: 4, y: 2 } },
        { id: 'earlier-row', type: 'normal', value: 1, position: { x: 2, y: 0 } },
      ],
    });
    const result = api.planPathToFood(observation);
    expect(result.target.id).toBe('earlier-row');
    expect(result.search.telemetry.pathLength).toBe(2);
  });

  it('uses locale-independent code-unit ordering as the final food tie-break', () => {
    const api = ai as any;
    if (typeof api.planPathToFood !== 'function') return;
    const observation = makeObservation({
      food: [
        { id: 'a-food', type: 'normal', value: 1, position: { x: 4, y: 2 } },
        { id: 'Z-food', type: 'normal', value: 1, position: { x: 4, y: 2 } },
      ],
    });
    expect(api.planPathToFood(observation).target.id).toBe('Z-food');
  });

  it('returns no target when food is absent', () => {
    const api = ai as any;
    if (typeof api.planPathToFood !== 'function') return;
    expect(api.planPathToFood(makeObservation())).toEqual({ target: null, search: null });
  });

  it('allows the current tail target but not other body cells', () => {
    const api = ai as any;
    if (typeof api.planPathToTail !== 'function') return;
    const observation = makeObservation({
      head: { x: 2, y: 2 },
      body: [{ x: 2, y: 2 }, { x: 2, y: 3 }, { x: 1, y: 3 }, { x: 1, y: 2 }],
      tail: { x: 1, y: 2 },
      direction: 'up',
    });
    const result = api.planPathToTail(observation);
    expect(result.target).toEqual({ x: 1, y: 2 });
    expect(result.search.route.directions).toEqual(['left']);
    expect(result.search.route.coordinates).not.toContainEqual({ x: 2, y: 3 });
  });
});
