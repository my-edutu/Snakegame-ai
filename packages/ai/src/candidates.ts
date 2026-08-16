import { DIRECTION_DELTAS, addVec, equalVec, isOpposite, type Direction, type Vec2 } from '@snake/shared';
import { findPathBfs } from './bfs.js';
import { CANONICAL_DIRECTIONS, isTraversable } from './graph.js';
import type { AiObservation } from './observation.js';

export interface CandidateMove {
  readonly direction: Direction;
  readonly legal: boolean;
  readonly targetDistance: number | null;
  readonly order: number;
}

function foodAt(observation: AiObservation, position: Vec2): boolean {
  return observation.food.some((food) => equalVec(food.position, position));
}

function candidateIsLegal(observation: AiObservation, direction: Direction, next: Vec2): boolean {
  if (observation.body.length > 1 && isOpposite(observation.direction, direction)) return false;

  const tailVacates = observation.pendingGrowth === 0 && !foodAt(observation, next);
  const enteringVacatingTail = tailVacates && equalVec(next, observation.tail);
  return isTraversable(
    observation,
    next,
    enteringVacatingTail ? { traversableTarget: observation.tail } : undefined,
  );
}

export function rankCandidateMoves(observation: AiObservation, target?: Vec2): readonly CandidateMove[] {
  const candidates: CandidateMove[] = CANONICAL_DIRECTIONS.map((direction, order) => {
    const next = addVec(observation.head, DIRECTION_DELTAS[direction]);
    const legal = candidateIsLegal(observation, direction, next);
    let targetDistance: number | null = null;

    if (legal && target) {
      if (equalVec(next, target)) {
        targetDistance = 0;
      } else {
        const result = findPathBfs(observation, next, target);
        targetDistance = result.telemetry.outcome === 'found' ? result.telemetry.pathLength : null;
      }
    }

    return { direction, legal, targetDistance, order };
  });

  return candidates.sort((a, b) => {
    if (a.legal !== b.legal) return a.legal ? -1 : 1;
    const aReachable = a.targetDistance !== null;
    const bReachable = b.targetDistance !== null;
    if (aReachable !== bReachable) return aReachable ? -1 : 1;
    if (a.targetDistance !== null && b.targetDistance !== null && a.targetDistance !== b.targetDistance) {
      return a.targetDistance - b.targetDistance;
    }
    return a.order - b.order;
  });
}
