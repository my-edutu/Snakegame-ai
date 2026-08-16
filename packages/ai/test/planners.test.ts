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
    expect(api.planPathToFood(makeObservation())).toEqual({ target: null, search: null });
  });

  it('allows the current tail target but not other body cells', () => {
    const api = ai as any;
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

  it('returns detached target coordinates owned by planner results', () => {
    const api = ai as any;
    const foodObservation = makeObservation({
      food: [{ id: 'f', type: 'normal', value: 1, position: { x: 4, y: 2 } }],
    });
    const foodPlan = api.planPathToFood(foodObservation);
    foodObservation.food[0].position.x = 0;
    expect(foodPlan.target.position).toEqual({ x: 4, y: 2 });

    const tailObservation = makeObservation({
      head: { x: 2, y: 2 },
      body: [{ x: 2, y: 2 }, { x: 1, y: 2 }],
      tail: { x: 1, y: 2 },
    });
    const tailPlan = api.planPathToTail(tailObservation);
    tailObservation.tail.x = 4;
    expect(tailPlan.target).toEqual({ x: 1, y: 2 });
  });
});
