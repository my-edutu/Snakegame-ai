import { describe, expect, it } from 'vitest';
import * as ai from '../src/index.js';
import { makeObservation } from './fixtures.js';

describe('large-board pathfinding budgets', () => {
  it('bounds BFS and A* by board size on a 100x100 open board', () => {
    const api = ai as any;
    expect(typeof api.findPathBfs).toBe('function');
    expect(typeof api.findPathAStar).toBe('function');
    if (typeof api.findPathBfs !== 'function' || typeof api.findPathAStar !== 'function') return;

    const observation = makeObservation({
      board: { width: 100, height: 100 },
      head: { x: 0, y: 0 },
      tail: { x: 0, y: 0 },
      body: [{ x: 0, y: 0 }],
    });
    const target = { x: 99, y: 99 };
    const bfs = api.findPathBfs(observation, observation.head, target);
    const astar = api.findPathAStar(observation, observation.head, target);

    expect(bfs.telemetry.outcome).toBe('found');
    expect(astar.telemetry.outcome).toBe('found');
    expect(bfs.telemetry.pathLength).toBe(198);
    expect(astar.telemetry.pathLength).toBe(198);
    expect(bfs.telemetry.nodesExplored).toBeLessThanOrEqual(10000);
    expect(astar.telemetry.nodesExplored).toBeLessThanOrEqual(bfs.telemetry.nodesExplored);
  });
});
