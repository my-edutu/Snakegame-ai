import type { Vec2 } from '@snake/shared';
import {
  buildBlockedCellSet,
  coordinateKey,
  enumerateNeighborsWithBlocked,
  isInsideObservation,
  type GraphOptions,
} from './graph.js';
import type { AiObservation } from './observation.js';
import { reconstructRoute, type PredecessorStep, type SearchResult } from './path.js';

export interface AStarOptions extends GraphOptions {}

interface FrontierNode {
  readonly position: Vec2;
  readonly g: number;
  readonly h: number;
  readonly f: number;
  readonly sequence: number;
}

function compareNodes(a: FrontierNode, b: FrontierNode): number {
  return a.f - b.f || a.h - b.h || a.sequence - b.sequence;
}

class MinHeap {
  private readonly values: FrontierNode[] = [];

  get size(): number {
    return this.values.length;
  }

  push(value: FrontierNode): void {
    this.values.push(value);
    let index = this.values.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (compareNodes(this.values[parent]!, value) <= 0) break;
      this.values[index] = this.values[parent]!;
      index = parent;
    }
    this.values[index] = value;
  }

  pop(): FrontierNode | undefined {
    if (this.values.length === 0) return undefined;
    const root = this.values[0]!;
    const last = this.values.pop()!;
    if (this.values.length === 0) return root;

    let index = 0;
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      if (left >= this.values.length) break;
      let child = left;
      if (right < this.values.length && compareNodes(this.values[right]!, this.values[left]!) < 0) child = right;
      if (compareNodes(last, this.values[child]!) <= 0) break;
      this.values[index] = this.values[child]!;
      index = child;
    }
    this.values[index] = last;
    return root;
  }
}

function manhattan(a: Vec2, b: Vec2): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function invalidResult(): SearchResult {
  return {
    route: null,
    telemetry: {
      algorithm: 'astar',
      outcome: 'invalid-target',
      nodesExplored: 0,
      frontierPeak: 0,
      pathLength: null,
    },
  };
}

export function findPathAStar(
  observation: AiObservation,
  start: Vec2,
  target: Vec2,
  options?: AStarOptions,
): SearchResult {
  if (!isInsideObservation(observation, start) || !isInsideObservation(observation, target)) return invalidResult();
  if (coordinateKey(start) === coordinateKey(target)) {
    return {
      route: { coordinates: [{ ...start }], directions: [] },
      telemetry: { algorithm: 'astar', outcome: 'found', nodesExplored: 0, frontierPeak: 1, pathLength: 0 },
    };
  }

  const blocked = buildBlockedCellSet(observation, options);
  const frontier = new MinHeap();
  const gScore = new Map<string, number>();
  const predecessors = new Map<string, PredecessorStep>();
  const closed = new Set<string>();
  let sequence = 0;
  let nodesExplored = 0;
  let frontierPeak = 1;

  const startH = manhattan(start, target);
  frontier.push({ position: { ...start }, g: 0, h: startH, f: startH, sequence: sequence++ });
  gScore.set(coordinateKey(start), 0);

  while (frontier.size > 0) {
    const current = frontier.pop()!;
    const currentKey = coordinateKey(current.position);
    if (closed.has(currentKey)) continue;
    closed.add(currentKey);
    nodesExplored += 1;

    if (currentKey === coordinateKey(target)) {
      const route = reconstructRoute(start, target, predecessors);
      return {
        route,
        telemetry: {
          algorithm: 'astar',
          outcome: route ? 'found' : 'unreachable',
          nodesExplored,
          frontierPeak,
          pathLength: route?.directions.length ?? null,
        },
      };
    }

    for (const neighbor of enumerateNeighborsWithBlocked(observation, current.position, blocked)) {
      const key = coordinateKey(neighbor.position);
      if (closed.has(key)) continue;
      const tentativeG = current.g + 1;
      const knownG = gScore.get(key);
      if (knownG !== undefined && tentativeG >= knownG) continue;

      gScore.set(key, tentativeG);
      predecessors.set(key, { previous: current.position, direction: neighbor.direction });
      const h = manhattan(neighbor.position, target);
      frontier.push({ position: neighbor.position, g: tentativeG, h, f: tentativeG + h, sequence: sequence++ });
      frontierPeak = Math.max(frontierPeak, frontier.size);
    }
  }

  return {
    route: null,
    telemetry: { algorithm: 'astar', outcome: 'unreachable', nodesExplored, frontierPeak, pathLength: null },
  };
}
