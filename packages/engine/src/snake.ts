import { addVec, DIRECTION_DELTAS, isOpposite, type Direction, type Vec2 } from '@snake/shared';
import type { DeathCause, SnakeState } from './state.js';
import { equalVec } from '@snake/shared';
import { isInsideBoard } from './occupancy.js';

export function resolveDirection(current: Direction, requested: Direction | undefined, bodyLength: number): Direction {
  if (!requested) return current;
  if (bodyLength > 1 && isOpposite(current, requested)) return current;
  return requested;
}

export function computeNextHead(head: Vec2, direction: Direction): Vec2 {
  return addVec(head, DIRECTION_DELTAS[direction]);
}

export function detectCollision(
  nextHead: Vec2,
  body: readonly Vec2[],
  width: number,
  height: number,
  tailWillVacate: boolean,
): DeathCause | null {
  if (!isInsideBoard(nextHead, width, height)) return 'wall-collision';
  const bodyToCheck = tailWillVacate ? body.slice(0, -1) : body;
  return bodyToCheck.some((cell) => equalVec(cell, nextHead)) ? 'self-collision' : null;
}

export function moveSnake(snake: SnakeState, nextHead: Vec2): SnakeState {
  const growsThisTick = snake.pendingGrowth > 0;
  const nextBody = [nextHead, ...snake.body];
  if (!growsThisTick) nextBody.pop();
  return {
    body: nextBody,
    direction: snake.direction,
    pendingGrowth: growsThisTick ? snake.pendingGrowth - 1 : 0,
    alive: snake.alive,
  };
}
