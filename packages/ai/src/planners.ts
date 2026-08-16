import type { Vec2 } from '@snake/shared';
import { findPathAStar } from './astar.js';
import { findPathBfs } from './bfs.js';
import type { AiFood, AiObservation } from './observation.js';
import type { SearchAlgorithm, SearchResult } from './path.js';

export interface PlannerOptions {
  readonly algorithm?: SearchAlgorithm;
}

export interface FoodPlanResult {
  readonly target: AiFood | null;
  readonly search: SearchResult | null;
}

export interface TailPlanResult {
  readonly target: Vec2;
  readonly search: SearchResult;
}

function search(
  observation: AiObservation,
  start: Vec2,
  target: Vec2,
  algorithm: SearchAlgorithm,
  traversableTarget?: Vec2,
): SearchResult {
  const options = traversableTarget ? { traversableTarget } : undefined;
  return algorithm === 'astar'
    ? findPathAStar(observation, start, target, options)
    : findPathBfs(observation, start, target, options);
}

function compareFoodTargets(a: AiFood, b: AiFood): number {
  return a.position.y - b.position.y || a.position.x - b.position.x || a.id.localeCompare(b.id);
}

export function planPathToFood(observation: AiObservation, options: PlannerOptions = {}): FoodPlanResult {
  if (observation.food.length === 0) return { target: null, search: null };
  const algorithm = options.algorithm ?? 'bfs';

  let bestTarget: AiFood | null = null;
  let bestSearch: SearchResult | null = null;

  for (const target of [...observation.food].sort(compareFoodTargets)) {
    const result = search(observation, observation.head, target.position, algorithm);
    if (result.telemetry.outcome !== 'found' || result.telemetry.pathLength === null) continue;

    if (
      !bestSearch ||
      bestSearch.telemetry.pathLength === null ||
      result.telemetry.pathLength < bestSearch.telemetry.pathLength ||
      (result.telemetry.pathLength === bestSearch.telemetry.pathLength && bestTarget && compareFoodTargets(target, bestTarget) < 0)
    ) {
      bestTarget = {
        id: target.id,
        type: target.type,
        value: target.value,
        position: { ...target.position },
      };
      bestSearch = result;
    }
  }

  return bestTarget && bestSearch ? { target: bestTarget, search: bestSearch } : { target: null, search: null };
}

export function planPathToTail(observation: AiObservation, options: PlannerOptions = {}): TailPlanResult {
  const target = { ...observation.tail };
  const algorithm = options.algorithm ?? 'bfs';
  return {
    target,
    search: search(observation, observation.head, target, algorithm, target),
  };
}
