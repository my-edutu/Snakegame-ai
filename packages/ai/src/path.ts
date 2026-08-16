import type { Direction, Vec2 } from '@snake/shared';
import { coordinateKey, isInsideObservation } from './graph.js';
import type { AiObservation } from './observation.js';

export type SearchAlgorithm = 'bfs' | 'astar';
export type SearchOutcome = 'found' | 'unreachable' | 'invalid-start' | 'invalid-target' | 'blocked-target';

export interface PathRoute {
  readonly coordinates: readonly Vec2[];
  readonly directions: readonly Direction[];
}

export interface SearchTelemetry {
  readonly algorithm: SearchAlgorithm;
  readonly outcome: SearchOutcome;
  readonly nodesExplored: number;
  readonly frontierPeak: number;
  readonly pathLength: number | null;
}

export interface SearchResult {
  readonly route: PathRoute | null;
  readonly telemetry: SearchTelemetry;
}

export interface PredecessorStep {
  readonly previous: Vec2;
  readonly direction: Direction;
}

export function classifySearchEndpoints(
  observation: AiObservation,
  start: Vec2,
  target: Vec2,
  blocked: ReadonlySet<string>,
): Exclude<SearchOutcome, 'found' | 'unreachable'> | null {
  if (!isInsideObservation(observation, start)) return 'invalid-start';
  if (!isInsideObservation(observation, target)) return 'invalid-target';
  if (coordinateKey(start) !== coordinateKey(target) && blocked.has(coordinateKey(target))) return 'blocked-target';
  return null;
}

export function reconstructRoute(start: Vec2, target: Vec2, predecessors: ReadonlyMap<string, PredecessorStep>): PathRoute | null {
  if (coordinateKey(start) === coordinateKey(target)) {
    return { coordinates: [{ ...start }], directions: [] };
  }

  const reverseCoordinates: Vec2[] = [{ ...target }];
  const reverseDirections: Direction[] = [];
  let cursor = { ...target };

  while (coordinateKey(cursor) !== coordinateKey(start)) {
    const predecessor = predecessors.get(coordinateKey(cursor));
    if (!predecessor) return null;
    reverseDirections.push(predecessor.direction);
    cursor = { ...predecessor.previous };
    reverseCoordinates.push(cursor);
  }

  return {
    coordinates: reverseCoordinates.reverse(),
    directions: reverseDirections.reverse(),
  };
}
