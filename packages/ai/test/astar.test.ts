import { describe, expect, it } from 'vitest';
import * as ai from '../src/index.js';
import { makeObservation } from './fixtures.js';

describe('A* pathfinding', () => {
  it('exports deterministic A* search', () => {
    expect(typeof (ai as Record<string, unknown>).findPathAStar).toBe('function');
  });

  it('matches BFS shortest-path length and canonical route on representative boards', () => {
    const api = ai as any;
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

  it('shares BFS endpoint validation semantics', () => {
    const api = ai as any;
    const observation = makeObservation({
      body: [{ x: 2, y: 2 }, { x: 1, y: 2 }],
      tail: { x: 1, y: 2 },
      obstacles: [{ id: 'wall', position: { x: 3, y: 2 } }],
      hazards: [{ id: 'hazard', position: { x: 2, y: 3 } }],
    });

    const cases = [
      [{ x: -1, y: 0 }, { x: 4, y: 4 }, undefined, 'invalid-start'],
      [observation.head, { x: 99, y: 99 }, undefined, 'invalid-target'],
      [observation.head, { x: 1, y: 2 }, undefined, 'blocked-target'],
      [observation.head, { x: 3, y: 2 }, undefined, 'blocked-target'],
      [observation.head, { x: 2, y: 3 }, undefined, 'blocked-target'],
      [observation.head, { x: 1, y: 2 }, { traversableTarget: { x: 1, y: 2 } }, 'found'],
    ] as const;

    for (const [start, target, options, outcome] of cases) {
      expect(api.findPathAStar(observation, start, target, options).telemetry.outcome).toBe(outcome);
    }
  });

  it('is stable across repeated tie-heavy searches', () => {
    const api = ai as any;
    const observation = makeObservation();
    const target = { x: 4, y: 4 };
    const first = api.findPathAStar(observation, observation.head, target);
    for (let i = 0; i < 20; i += 1) expect(api.findPathAStar(observation, observation.head, target)).toEqual(first);
  });
});
