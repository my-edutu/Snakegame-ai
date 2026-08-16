import type { Direction } from '@snake/shared';
import type { EngineCommand } from './commands.js';
import { validateConfig, type ActiveBounds, type EngineConfig, type EngineFoodConfig, type EngineHazardConfig, type EngineObstacleConfig, type EnginePortalConfig } from './config.js';
import type { EngineEvent } from './events.js';
import { spawnFood } from './food.js';
import { applyLifecycleCommand } from './lifecycle.js';
import { occupancyPercent } from './occupancy.js';
import { reduceTick, type StepResult } from './reducer.js';
import { createRng, restoreRng, type DeterministicRng } from './rng.js';
import type { EngineSnapshot, FoodEntity, GameState } from './state.js';

export interface EngineEnvironmentFrame {
  readonly obstacles?: readonly EngineObstacleConfig[];
  readonly hazards?: readonly EngineHazardConfig[];
  readonly portals?: readonly EnginePortalConfig[];
  readonly food?: readonly EngineFoodConfig[];
  readonly activeBounds?: ActiveBounds | null;
}

export interface EngineRuntime {
  getState(): GameState;
  dispatch(command: EngineCommand): readonly EngineEvent[];
  step(requestedDirection?: Direction): StepResult;
  applyEnvironment(frame: EngineEnvironmentFrame): void;
  snapshot(): EngineSnapshot;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

const toFood = (food: EngineFoodConfig): FoodEntity => ({
  id: food.id,
  type: food.type,
  position: { ...food.position },
  value: food.value,
  ...(food.growthDelta === undefined ? {} : { growthDelta: food.growthDelta }),
  ...(food.scoreDelta === undefined ? {} : { scoreDelta: food.scoreDelta }),
});

function initialState(config: EngineConfig, rng: DeterministicRng): Readonly<{ state: GameState; initialEvents: readonly EngineEvent[] }> {
  const body = config.initialSnake.body.map((cell) => ({ ...cell }));
  const blocked = [...body, ...(config.obstacles ?? []).map((item) => item.position), ...(config.hazards ?? []).map((item) => item.position)];
  const legacySpawn = config.food === undefined ? spawnFood(config.board.width, config.board.height, blocked, rng) : null;
  const food = config.food === undefined ? (legacySpawn?.kind === 'spawned' ? [legacySpawn.food] : []) : config.food.map(toFood);
  const occupancy = occupancyPercent(body.length, config.board.width, config.board.height);
  const runId = `run-${config.seed}`;
  const level = {
    id: 'baseline',
    name: 'Genesis Baseline',
    width: config.board.width,
    height: config.board.height,
    growthPerFood: config.growthPerFood,
    ...(config.wrap === undefined ? {} : { wrap: config.wrap }),
  } as const;
  const state: GameState = {
    schemaVersion: 1,
    runId,
    seed: config.seed,
    tick: 0,
    lifecycle: 'playing',
    level,
    snake: { body, direction: config.initialSnake.direction, pendingGrowth: 0, alive: true },
    food,
    obstacles: clone(config.obstacles ?? []),
    hazards: clone(config.hazards ?? []),
    portals: clone(config.portals ?? []),
    ...(config.activeBounds === undefined ? {} : { activeBounds: clone(config.activeBounds) }),
    score: { score: 0, foodEaten: 0 },
    progression: { occupancyPercent: occupancy, boardFilled: legacySpawn?.kind === 'board-filled' },
    ai: { strategy: 'manual-input', decisionSequence: 0 },
    risk: { score: 0, band: 'low', safeMoveCount: 0, accessibleTiles: 0, escapeRoutes: 0, projectedTrapProbability: 0, contributors: [] },
    run: { ticksSurvived: 0, maxLength: body.length, maxOccupancyPercent: occupancy },
    rng: rng.serialize(),
  };
  const initialEvents: EngineEvent[] = [
    { type: 'RunStarted', tick: 0, runId, seed: config.seed },
    { type: 'LevelStarted', tick: 0, levelId: 'baseline' },
  ];
  for (const item of food) initialEvents.push({ type: 'FoodSpawned', tick: 0, food: item });
  return { state, initialEvents };
}

class Runtime implements EngineRuntime {
  private state: GameState;
  private rng: DeterministicRng;
  private readonly config: EngineConfig;

  constructor(config: EngineConfig, restoredState?: GameState) {
    validateConfig(config);
    this.config = clone(config);
    if (restoredState) {
      this.state = clone(restoredState);
      this.rng = restoreRng(restoredState.rng);
    } else {
      this.rng = createRng(config.seed);
      this.state = initialState(this.config, this.rng).state;
    }
  }

  getState(): GameState { return clone(this.state); }

  dispatch(command: EngineCommand): readonly EngineEvent[] {
    if (command.type === 'StartNewGame' || command.type === 'RestartLevel') {
      this.rng = createRng(this.config.seed);
      const previous = this.state.lifecycle;
      const reset = initialState(this.config, this.rng);
      this.state = reset.state;
      return [
        { type: 'LifecycleChanged', tick: 0, from: previous, to: 'new-game' },
        { type: 'LifecycleChanged', tick: 0, from: 'new-game', to: 'level-start' },
        { type: 'LifecycleChanged', tick: 0, from: 'level-start', to: 'playing' },
        ...reset.initialEvents,
      ];
    }
    const result = applyLifecycleCommand(this.state, command);
    this.state = result.state;
    return clone(result.events);
  }

  step(requestedDirection?: Direction): StepResult {
    const result = reduceTick(this.state, this.config, this.rng, requestedDirection);
    this.state = result.state;
    return clone(result);
  }

  applyEnvironment(frame: EngineEnvironmentFrame): void {
    this.state = {
      ...this.state,
      ...(frame.obstacles === undefined ? {} : { obstacles: clone(frame.obstacles) }),
      ...(frame.hazards === undefined ? {} : { hazards: clone(frame.hazards) }),
      ...(frame.portals === undefined ? {} : { portals: clone(frame.portals) }),
      ...(frame.food === undefined ? {} : { food: frame.food.map(toFood) }),
    };
    if (frame.activeBounds !== undefined) {
      if (frame.activeBounds === null) {
        const { activeBounds: _removed, ...withoutBounds } = this.state;
        this.state = withoutBounds as GameState;
      } else {
        this.state = { ...this.state, activeBounds: clone(frame.activeBounds) };
      }
    }
  }

  snapshot(): EngineSnapshot { return clone({ schemaVersion: 1, config: this.config, state: this.state }); }
}

export function createEngine(config: EngineConfig): EngineRuntime { return new Runtime(config); }
export function restoreEngine(snapshot: EngineSnapshot): EngineRuntime {
  if (snapshot.schemaVersion !== 1) throw new Error(`Unsupported snapshot version: ${String(snapshot.schemaVersion)}`);
  return new Runtime(snapshot.config, snapshot.state);
}
