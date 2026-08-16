import { describe, expect, it } from 'vitest';
import * as ai from '../src/index.js';
import { makeObservation } from './fixtures.js';

describe('large-board pathfinding budgets', () => {
  it('bounds BFS and A* by board size on a 100x100 open board', () => {
    const api = ai as any;
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

  it('terminates deterministically within structural bounds on a dense 100x100 board', () => {
    const api = ai as any;
    const obstacles: Array<{ id: string; position: { x: number; y: number } }> = [];
    let id = 0;
    for (let x = 2; x < 99; x += 3) {
      const gapY = (x * 17) % 100;
      for (let y = 0; y < 100; y += 1) {
        if (y === gapY || y === Math.min(99, gapY + 1)) continue;
        obstacles.push({ id: `dense-${id++}`, position: { x, y } });
      }
    }

    const observation = makeObservation({
      board: { width: 100, height: 100 },
      head: { x: 0, y: 0 },
      tail: { x: 0, y: 0 },
      body: [{ x: 0, y: 0 }],
      obstacles,
    });
    const target = { x: 99, y: 99 };

    const bfsA = api.findPathBfs(observation, observation.head, target);
    const bfsB = api.findPathBfs(observation, observation.head, target);
    const astarA = api.findPathAStar(observation, observation.head, target);
    const astarB = api.findPathAStar(observation, observation.head, target);

    expect(bfsB).toEqual(bfsA);
    expect(astarB).toEqual(astarA);
    for (const result of [bfsA, astarA]) {
      expect(result.telemetry.nodesExplored).toBeLessThanOrEqual(10000);
      expect(result.telemetry.frontierPeak).toBeLessThanOrEqual(10000);
      for (const coordinate of result.route?.coordinates ?? []) {
        expect(coordinate.x).toBeGreaterThanOrEqual(0);
        expect(coordinate.x).toBeLessThan(100);
        expect(coordinate.y).toBeGreaterThanOrEqual(0);
        expect(coordinate.y).toBeLessThan(100);
      }
    }
  });
});
