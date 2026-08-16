import type { Direction, LevelId, RunId, Vec2 } from '@snake/shared';
import type { ActiveBounds, EngineConfig } from './config.js';
import type { SerializedRngState } from './rng.js';

export type LifecycleState =
  | 'boot'
  | 'intro'
  | 'new-game'
  | 'level-start'
  | 'playing'
  | 'level-complete'
  | 'death'
  | 'run-summary'
  | 'countdown'
  | 'paused';

export interface SnakeState {
  readonly body: readonly Vec2[];
  readonly direction: Direction;
  readonly pendingGrowth: number;
  readonly alive: boolean;
}

export interface FoodEntity {
  readonly id: string;
  readonly type: string;
  readonly position: Vec2;
  readonly value: number;
  readonly growthDelta?: number;
  readonly scoreDelta?: number;
}

export interface ObstacleEntity { readonly id: string; readonly position: Vec2 }
export interface HazardEntity { readonly id: string; readonly position: Vec2 }
export interface PortalEntity { readonly id: string; readonly a: Vec2; readonly b: Vec2 }
export interface ScoreState { readonly score: number; readonly foodEaten: number }
export interface ProgressionState { readonly occupancyPercent: number; readonly boardFilled: boolean }
export interface AIState { readonly strategy: 'manual-input'; readonly decisionSequence: number }
export interface RiskState { readonly score: 0; readonly band: 'low'; readonly safeMoveCount: 0; readonly accessibleTiles: 0; readonly escapeRoutes: 0; readonly projectedTrapProbability: 0; readonly contributors: readonly [] }
export interface RunStats { readonly ticksSurvived: number; readonly maxLength: number; readonly maxOccupancyPercent: number }
export type DeathCause = 'wall-collision' | 'self-collision' | 'obstacle-collision' | 'hazard-collision' | 'bounds-collision';
export interface DeathRecord { readonly tick: number; readonly cause: DeathCause; readonly position: Vec2 }
export interface LevelRuntimeState {
  readonly id: LevelId;
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly growthPerFood?: number;
  readonly wrap?: boolean;
}

export interface GameState {
  readonly schemaVersion: 1;
  readonly runId: RunId;
  readonly seed: number;
  readonly tick: number;
  readonly lifecycle: LifecycleState;
  readonly level: LevelRuntimeState;
  readonly snake: SnakeState;
  readonly food: readonly FoodEntity[];
  readonly obstacles: readonly ObstacleEntity[];
  readonly hazards: readonly HazardEntity[];
  readonly portals: readonly PortalEntity[];
  readonly activeBounds?: ActiveBounds;
  readonly score: ScoreState;
  readonly progression: ProgressionState;
  readonly ai: AIState;
  readonly risk: RiskState;
  readonly run: RunStats;
  readonly rng: SerializedRngState;
  readonly lastDeath?: DeathRecord;
}

export interface EngineSnapshot {
  readonly schemaVersion: 1;
  readonly config: EngineConfig;
  readonly state: GameState;
}
