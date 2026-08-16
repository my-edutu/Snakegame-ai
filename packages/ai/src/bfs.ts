import type { Vec2 } from '@snake/shared';
import {
  buildBlockedCellSet,
  coordinateKey,
  enumerateNeighborsWithBlocked,
  isInsideObservation,
  type GraphOptions,
} from './graph.js';
import type { AiObservation } from './observation.js';
import {
  classifySearchEndpoints,
  reconstructRoute,
  type PredecessorStep,
  type SearchOutcome,
  type SearchResult,
} from './path.js';

export interface SearchOptions extends GraphOptions {}

function emptyResult(outcome: Exclude<SearchOutcome, 'found'>): SearchResult {
  return {
    route: null,
    telemetry: {
      algorithm: 'bfs',
      outcome,
      nodesExplored: 0,
      frontierPeak: 0,
      pathLength: null,
    },
  };
}

export function buildDistanceMap(
  observation: AiObservation,
  start: Vec2,
  options?: SearchOptions,
): ReadonlyMap<string, number> {
  if (!isInsideObservation(observation, start)) return new Map();

  const blocked = buildBlockedCellSet(observation, options);
  const distances = new Map<string, number>();
  const queue: Vec2[] = [{ ...start }];
  let cursor = 0;
  distances.set(coordinateKey(start), 0);

  while (cursor < queue.length) {
    const current = queue[cursor++]!;
    const distance = distances.get(coordinateKey(current))!;
    for (const neighbor of enumerateNeighborsWithBlocked(observation, current, blocked)) {
      const key = coordinateKey(neighbor.position);
      if (distances.has(key)) continue;
      distances.set(key, distance + 1);
      queue.push(neighbor.position);
    }
  }

  return distances;
}

export function findPathBfs(
  observation: AiObservation,
  start: Vec2,
  target: Vec2,
  options?: SearchOptions,
): SearchResult {
  const blocked = buildBlockedCellSet(observation, options);
  const endpointOutcome = classifySearchEndpoints(observation, start, target, blocked);
  if (endpointOutcome) return emptyResult(endpointOutcome);

  if (coordinateKey(start) === coordinateKey(target)) {
    return {
      route: { coordinates: [{ ...start }], directions: [] },
      telemetry: { algorithm: 'bfs', outcome: 'found', nodesExplored: 0, frontierPeak: 1, pathLength: 0 },
    };
  }

  const queue: Vec2[] = [{ ...start }];
  const visited = new Set<string>([coordinateKey(start)]);
  const predecessors = new Map<string, PredecessorStep>();
  let cursor = 0;
  let nodesExplored = 0;
  let frontierPeak = 1;

  while (cursor < queue.length) {
    const current = queue[cursor++]!;
    nodesExplored += 1;

    for (const neighbor of enumerateNeighborsWithBlocked(observation, current, blocked)) {
      const key = coordinateKey(neighbor.position);
      if (visited.has(key)) continue;
      visited.add(key);
      predecessors.set(key, { previous: current, direction: neighbor.direction });

      if (key === coordinateKey(target)) {
        const route = reconstructRoute(start, target, predecessors);
        return {
          route,
          telemetry: {
            algorithm: 'bfs',
            outcome: route ? 'found' : 'unreachable',
            nodesExplored,
            frontierPeak: Math.max(frontierPeak, queue.length - cursor + 1),
            pathLength: route?.directions.length ?? null,
          },
        };
      }

      queue.push(neighbor.position);
      frontierPeak = Math.max(frontierPeak, queue.length - cursor);
    }
  }

  return {
    route: null,
    telemetry: { algorithm: 'bfs', outcome: 'unreachable', nodesExplored, frontierPeak, pathLength: null },
  };
}
