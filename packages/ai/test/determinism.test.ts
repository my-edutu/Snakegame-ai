import { describe, expect, it } from 'vitest';
import * as ai from '../src/index.js';
import { makeObservation } from './fixtures.js';

describe('pathfinding determinism', () => {
  it('returns deep-equal BFS and A* results across repeated calls', () => {
    const api = ai as any;
    expect(typeof api.findPathBfs).toBe('function');
    expect(typeof api.findPathAStar).toBe('function');
    if (typeof api.findPathBfs !== 'function' || typeof api.findPathAStar !== 'function') return;
    const observation = makeObservation({
      obstacles: [{ id: 'center-right', position: { x: 3, y: 2 } }],
    });
    const target = { x: 4, y: 4 };
    const bfs = api.findPathBfs(observation, observation.head, target);
    const astar = api.findPathAStar(observation, observation.head, target);
    for (let i = 0; i < 25; i += 1) {
      expect(api.findPathBfs(observation, observation.head, target)).toEqual(bfs);
      expect(api.findPathAStar(observation, observation.head, target)).toEqual(astar);
    }
  });

  it('measures elapsed time only through an injected clock', () => {
    const api = ai as any;
    expect(typeof api.withTiming).toBe('function');
    if (typeof api.withTiming !== 'function') return;
    const values = [10, 17];
    const clock = { now: () => values.shift() ?? 17 };
    const result = api.withTiming(() => ({ route: 'stable' }), clock);
    expect(result).toEqual({ value: { route: 'stable' }, elapsedMs: 7 });
  });
});
