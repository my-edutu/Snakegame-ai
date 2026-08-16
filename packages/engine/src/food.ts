import { equalVec, type Vec2 } from '@snake/shared';
import type { DeterministicRng } from './rng.js';
import { enumerateFreeCells } from './occupancy.js';
import type { FoodEntity } from './state.js';

export type FoodSpawnResult = Readonly<{ kind: 'spawned'; food: FoodEntity }> | Readonly<{ kind: 'board-filled' }>;

export function spawnFood(width: number, height: number, occupied: readonly Vec2[], rng: DeterministicRng): FoodSpawnResult {
  const free = enumerateFreeCells(width, height, occupied);
  if (free.length === 0) return { kind: 'board-filled' };
  const position = free[rng.nextInt(free.length)]!;
  return { kind: 'spawned', food: { id: `food-${position.y}-${position.x}`, type: 'normal', position, value: 1 } };
}

export function foodAt(food: readonly FoodEntity[], position: Vec2): FoodEntity | undefined {
  return food.find((entity) => equalVec(entity.position, position));
}
