import type { Direction } from '@snake/shared';
import type { EngineCommand } from './commands.js';
import { validateConfig, type EngineConfig } from './config.js';
import type { EngineEvent } from './events.js';
import { spawnFood } from './food.js';
import { applyLifecycleCommand } from './lifecycle.js';
import { occupancyPercent } from './occupancy.js';
import { reduceTick, type StepResult } from './reducer.js';
import { createRng, restoreRng, type DeterministicRng } from './rng.js';
import type { EngineSnapshot, GameState } from './state.js';

export interface EngineRuntime {
  getState(): GameState;
  dispatch(command: EngineCommand): readonly EngineEvent[];
  step(requestedDirection?: Direction): StepResult;
  snapshot(): EngineSnapshot;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function initialState(config: EngineConfig, rng: DeterministicRng): Readonly<{ state: GameState; initialEvents: readonly EngineEvent[] }> {
  const body = config.initialSnake.body.map((cell) => ({ ...cell }));
  const spawn = spawnFood(config.board.width, config.board.height, body, rng);
  const food = spawn.kind === 'spawned' ? [spawn.food] : [];
  const occupancy = occupancyPercent(body.length, config.board.width, config.board.height);
  const runId = `run-${config.seed}`;
  const state: GameState = {
    schemaVersion: 1,
    runId,
    seed: config.seed,
    tick: 0,
    lifecycle: 'playing',
    level: { id: 'baseline', name: 'Genesis Baseline', width: config.board.width, height: config.board.height },
    snake: { body, direction: config.initialSnake.direction, pendingGrowth: 0, alive: true },
    food,
    obstacles: [],
    hazards: [],
    score: { score: 0, foodEaten: 0 },
    progression: { occupancyPercent: occupancy, boardFilled: spawn.kind === 'board-filled' },
    ai: { strategy: 'manual-input', decisionSequence: 0 },
    risk: { score: 0, band: 'low', safeMoveCount: 0, accessibleTiles: 0, escapeRoutes: 0, projectedTrapProbability: 0, contributors: [] },
    run: { ticksSurvived: 0, maxLength: body.length, maxOccupancyPercent: occupancy },
    rng: rng.serialize(),
  };
  const initialEvents: EngineEvent[] = [
    { type: 'RunStarted', tick: 0, runId, seed: config.seed },
    { type: 'LevelStarted', tick: 0, levelId: 'baseline' },
  ];
  if (spawn.kind === 'spawned') initialEvents.push({ type: 'FoodSpawned', tick: 0, food: spawn.food });
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

  getState(): GameState {
    return clone(this.state);
  }

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

  snapshot(): EngineSnapshot {
    return clone({ schemaVersion: 1, config: this.config, state: this.state });
  }
}

export function createEngine(config: EngineConfig): EngineRuntime {
  return new Runtime(config);
}

export function restoreEngine(snapshot: EngineSnapshot): EngineRuntime {
  if (snapshot.schemaVersion !== 1) throw new Error(`Unsupported snapshot version: ${String(snapshot.schemaVersion)}`);
  return new Runtime(snapshot.config, snapshot.state);
}
