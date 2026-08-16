import type { GameState } from '@snake/engine';
import type { Direction, Vec2 } from '@snake/shared';

export interface AiFood {
  readonly id: string;
  readonly type: string;
  readonly position: Vec2;
  readonly value: number;
}

export interface AiObstacle { readonly id: string; readonly position: Vec2 }
export interface AiHazard { readonly id: string; readonly position: Vec2 }

export interface AiObservation {
  readonly board: Readonly<{ width: number; height: number }>;
  readonly head: Vec2;
  readonly tail: Vec2;
  readonly body: readonly Vec2[];
  readonly direction: Direction;
  readonly pendingGrowth: number;
  readonly food: readonly AiFood[];
  readonly obstacles: readonly AiObstacle[];
  readonly hazards: readonly AiHazard[];
  readonly tick: number;
  readonly runId: string;
}

const cloneVec = (cell: Vec2): Vec2 => ({ x: cell.x, y: cell.y });

export function createObservation(state: GameState): AiObservation {
  const body = state.snake.body.map(cloneVec);
  const head = body[0];
  const tail = body.at(-1);
  if (!head || !tail) throw new Error('Cannot create AI observation for an empty snake.');

  return {
    board: { width: state.level.width, height: state.level.height },
    head: cloneVec(head),
    tail: cloneVec(tail),
    body,
    direction: state.snake.direction,
    pendingGrowth: state.snake.pendingGrowth,
    food: state.food.map((item) => ({
      id: item.id,
      type: item.type,
      position: cloneVec(item.position),
      value: item.value,
    })),
    obstacles: state.obstacles.map((item) => ({ id: item.id, position: cloneVec(item.position) })),
    hazards: state.hazards.map((item) => ({ id: item.id, position: cloneVec(item.position) })),
    tick: state.tick,
    runId: state.runId,
  };
}
