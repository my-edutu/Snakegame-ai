import { DIRECTION_DELTAS, addVec, equalVec, isOpposite, type Direction, type Vec2 } from '@snake/shared';
import type { AiFood, AiHazard, AiObservation, AiObstacle } from './observation.js';

export interface SimulatedState {
  readonly board: Readonly<{ width: number; height: number }>;
  readonly body: readonly Vec2[];
  readonly direction: Direction;
  readonly pendingGrowth: number;
  readonly growthPerFood: number;
  readonly food: readonly AiFood[];
  readonly obstacles: readonly AiObstacle[];
  readonly hazards: readonly AiHazard[];
}

export interface SimulationStep {
  readonly legal: boolean;
  readonly consumedFoodId: string | null;
  readonly state: SimulatedState | null;
}

const cloneVec = (v: Vec2): Vec2 => ({ x: v.x, y: v.y });
const key = (v: Vec2): string => `${v.x},${v.y}`;

function cloneFood(food: AiFood): AiFood {
  return { ...food, position: cloneVec(food.position) };
}

export function createSimulatedState(observation: AiObservation): SimulatedState {
  return {
    board: { ...observation.board },
    body: observation.body.map(cloneVec),
    direction: observation.direction,
    pendingGrowth: observation.pendingGrowth,
    growthPerFood: observation.growthPerFood,
    food: observation.food.map(cloneFood),
    obstacles: observation.obstacles.map((o) => ({ ...o, position: cloneVec(o.position) })),
    hazards: observation.hazards.map((h) => ({ ...h, position: cloneVec(h.position) })),
  };
}

export function simulateMove(state: SimulatedState, direction: Direction): SimulationStep {
  const head = state.body[0];
  if (!head || (state.body.length > 1 && isOpposite(state.direction, direction))) {
    return { legal: false, consumedFoodId: null, state: null };
  }

  const next = addVec(head, DIRECTION_DELTAS[direction]);
  if (next.x < 0 || next.y < 0 || next.x >= state.board.width || next.y >= state.board.height) {
    return { legal: false, consumedFoodId: null, state: null };
  }

  const eaten = state.food.find((item) => equalVec(item.position, next));
  const tailWillVacate = state.pendingGrowth === 0 && !eaten;
  const tailIndexExcluded = tailWillVacate ? Math.max(0, state.body.length - 1) : state.body.length;
  const occupied = new Set(state.body.slice(0, tailIndexExcluded).map(key));
  if (occupied.has(key(next))) return { legal: false, consumedFoodId: null, state: null };
  if (state.obstacles.some((o) => equalVec(o.position, next))) return { legal: false, consumedFoodId: null, state: null };
  if (state.hazards.some((h) => equalVec(h.position, next))) return { legal: false, consumedFoodId: null, state: null };

  const nextBody = [cloneVec(next), ...state.body.map(cloneVec)];
  let nextPendingGrowth = state.pendingGrowth + (eaten ? state.growthPerFood : 0);
  if (nextPendingGrowth > 0) nextPendingGrowth -= 1;
  else nextBody.pop();

  return {
    legal: true,
    consumedFoodId: eaten?.id ?? null,
    state: {
      board: { ...state.board },
      body: nextBody,
      direction,
      pendingGrowth: nextPendingGrowth,
      growthPerFood: state.growthPerFood,
      food: state.food.filter((f) => f.id !== eaten?.id).map(cloneFood),
      obstacles: state.obstacles.map((o) => ({ ...o, position: cloneVec(o.position) })),
      hazards: state.hazards.map((h) => ({ ...h, position: cloneVec(h.position) })),
    },
  };
}
