import { describe, expect, it } from 'vitest';
import * as ai from '../src/index.js';
import { makeObservation } from './fixtures.js';

describe('BFS pathfinding', () => {
  it('exports BFS and distance-map APIs', () => {
    const api = ai as Record<string, unknown>;
    expect(typeof api.findPathBfs).toBe('function');
    expect(typeof api.buildDistanceMap).toBe('function');
  });

  it('finds the canonical shortest path on an open board', () => {
    const api = ai as any;
    if (typeof api.findPathBfs !== 'function') return;
    const observation = makeObservation();
    const result = api.findPathBfs(observation, { x: 2, y: 2 }, { x: 4, y: 1 });
    expect(result.telemetry.outcome).toBe('found');
    expect(result.route.coordinates).toEqual([
      { x: 2, y: 2 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 },
    ]);
    expect(result.route.directions).toEqual(['up', 'right', 'right']);
    expect(result.telemetry.pathLength).toBe(3);
  });

  it('detours around obstacles without crossing blocked cells', () => {
    const api = ai as any;
    if (typeof api.findPathBfs !== 'function') return;
    const observation = makeObservation({
      obstacles: [
        { id: 'a', position: { x: 3, y: 2 } },
        { id: 'b', position: { x: 3, y: 1 } },
      ],
    });
    const result = api.findPathBfs(observation, observation.head, { x: 4, y: 2 });
    expect(result.telemetry.outcome).toBe('found');
    expect(result.route.coordinates).not.toContainEqual({ x: 3, y: 2 });
    expect(result.route.coordinates).not.toContainEqual({ x: 3, y: 1 });
    expect(result.telemetry.pathLength).toBe(6);
  });

  it('handles zero-length, unreachable, and invalid targets explicitly', () => {
    const api = ai as any;
    if (typeof api.findPathBfs !== 'function') return;
    const observation = makeObservation();
    const same = api.findPathBfs(observation, observation.head, observation.head);
    expect(same.route.coordinates).toEqual([observation.head]);
    expect(same.route.directions).toEqual([]);
    expect(same.telemetry.pathLength).toBe(0);

    const sealed = makeObservation({
      obstacles: [
        { id: 'u', position: { x: 2, y: 1 } },
        { id: 'r', position: { x: 3, y: 2 } },
        { id: 'd', position: { x: 2, y: 3 } },
        { id: 'l', position: { x: 1, y: 2 } },
      ],
    });
    expect(api.findPathBfs(sealed, sealed.head, { x: 4, y: 4 }).telemetry.outcome).toBe('unreachable');
    expect(api.findPathBfs(observation, observation.head, { x: 99, y: 99 }).telemetry.outcome).toBe('invalid-target');
  });

  it('builds deterministic shortest-distance maps', () => {
    const api = ai as any;
    if (typeof api.buildDistanceMap !== 'function') return;
    const map = api.buildDistanceMap(makeObservation(), { x: 2, y: 2 });
    expect(map.get('2,2')).toBe(0);
    expect(map.get('2,1')).toBe(1);
    expect(map.get('4,4')).toBe(4);
  });
});
