import { describe, expect, it } from 'vitest';
import * as ai from '../src/index.js';
import { makeObservation } from './fixtures.js';

describe('A* pathfinding', () => {
  it('exports deterministic A* search', () => {
    expect(typeof (ai as Record<string, unknown>).findPathAStar).toBe('function');
  });

  it('matches BFS shortest-path length and canonical route on representative boards', () => {
    const api = ai as any;
    if (typeof api.findPathAStar !== 'function' || typeof api.findPathBfs !== 'function') return;
    const observation = makeObservation({
      obstacles: [
        { id: 'a', position: { x: 3, y: 2 } },
        { id: 'b', position: { x: 3, y: 1 } },
      ],
    });
    const target = { x: 4, y: 2 };
    const bfs = api.findPathBfs(observation, observation.head, target);
    const astar = api.findPathAStar(observation, observation.head, target);
    expect(astar.telemetry.pathLength).toBe(bfs.telemetry.pathLength);
    expect(astar.route).toEqual(bfs.route);
  });

  it('is stable across repeated tie-heavy searches', () => {
    const api = ai as any;
    if (typeof api.findPathAStar !== 'function') return;
    const observation = makeObservation();
    const target = { x: 4, y: 4 };
    const first = api.findPathAStar(observation, observation.head, target);
    for (let i = 0; i < 20; i += 1) expect(api.findPathAStar(observation, observation.head, target)).toEqual(first);
  });
});
