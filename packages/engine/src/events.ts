import type { Vec2 } from '@snake/shared';
import type { DeathCause, FoodEntity, LifecycleState } from './state.js';

export type EngineEvent =
  | Readonly<{ type: 'RunStarted'; tick: number; runId: string; seed: number }>
  | Readonly<{ type: 'LevelStarted'; tick: number; levelId: string }>
  | Readonly<{ type: 'SnakeMoved'; tick: number; from: Vec2; to: Vec2 }>
  | Readonly<{ type: 'FoodConsumed'; tick: number; foodId: string; position: Vec2 }>
  | Readonly<{ type: 'FoodSpawned'; tick: number; food: FoodEntity }>
  | Readonly<{ type: 'SnakeDied'; tick: number; cause: DeathCause; position: Vec2 }>
  | Readonly<{ type: 'RunEnded'; tick: number; cause: DeathCause }>
  | Readonly<{ type: 'LifecycleChanged'; tick: number; from: LifecycleState; to: LifecycleState }>;
