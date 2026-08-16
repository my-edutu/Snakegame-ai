import { equalVec, type Direction } from '@snake/shared';
import type { EngineConfig } from './config.js';
import type { EngineEvent } from './events.js';
import { foodAt, spawnFood } from './food.js';
import { occupancyPercent } from './occupancy.js';
import type { DeterministicRng } from './rng.js';
import { computeNextHead, detectCollision, moveSnake, resolveDirection } from './snake.js';
import type { GameState } from './state.js';

export interface StepResult {
  readonly state: GameState;
  readonly events: readonly EngineEvent[];
}

export function reduceTick(state: GameState, config: EngineConfig, rng: DeterministicRng, requestedDirection?: Direction): StepResult {
  if (state.lifecycle !== 'playing' || !state.snake.alive) return { state, events: [] };

  const head = state.snake.body[0]!;
  const direction = resolveDirection(state.snake.direction, requestedDirection, state.snake.body.length);
  const nextHead = computeNextHead(head, direction);
  const targetFood = foodAt(state.food, nextHead);
  const growsFromExistingQueue = state.snake.pendingGrowth > 0;
  const tailWillVacate = !growsFromExistingQueue && !targetFood;
  const collision = detectCollision(nextHead, state.snake.body, config.board.width, config.board.height, tailWillVacate);
  const nextTick = state.tick + 1;

  if (collision) {
    const death = { tick: nextTick, cause: collision, position: nextHead } as const;
    const nextState: GameState = {
      ...state,
      tick: nextTick,
      lifecycle: 'death',
      snake: { ...state.snake, direction, alive: false },
      lastDeath: death,
      rng: rng.serialize(),
    };
    return {
      state: nextState,
      events: [
        { type: 'SnakeDied', tick: nextTick, cause: collision, position: nextHead },
        { type: 'LifecycleChanged', tick: nextTick, from: 'playing', to: 'death' },
        { type: 'RunEnded', tick: nextTick, cause: collision },
      ],
    };
  }

  let workingSnake = { ...state.snake, direction };
  if (targetFood) workingSnake = { ...workingSnake, pendingGrowth: workingSnake.pendingGrowth + config.growthPerFood };
  const moved = moveSnake(workingSnake, nextHead);
  let food = state.food;
  const events: EngineEvent[] = [{ type: 'SnakeMoved', tick: nextTick, from: head, to: nextHead }];
  let score = state.score;
  let boardFilled = state.progression.boardFilled;

  if (targetFood) {
    score = { score: score.score + config.scorePerFood, foodEaten: score.foodEaten + 1 };
    food = food.filter((item) => !equalVec(item.position, targetFood.position));
    events.push({ type: 'FoodConsumed', tick: nextTick, foodId: targetFood.id, position: targetFood.position });
    const spawn = spawnFood(config.board.width, config.board.height, moved.body, rng);
    if (spawn.kind === 'spawned') {
      food = [spawn.food];
      events.push({ type: 'FoodSpawned', tick: nextTick, food: spawn.food });
    } else {
      boardFilled = true;
      food = [];
    }
  }

  const occupancy = occupancyPercent(moved.body.length, config.board.width, config.board.height);
  const nextState: GameState = {
    ...state,
    tick: nextTick,
    snake: moved,
    food,
    score,
    progression: { occupancyPercent: occupancy, boardFilled },
    ai: { ...state.ai, decisionSequence: state.ai.decisionSequence + 1 },
    run: {
      ticksSurvived: state.run.ticksSurvived + 1,
      maxLength: Math.max(state.run.maxLength, moved.body.length),
      maxOccupancyPercent: Math.max(state.run.maxOccupancyPercent, occupancy),
    },
    rng: rng.serialize(),
  };

  return { state: nextState, events };
}
