import type { Direction, Vec2 } from '@snake/shared';

export interface ActiveBounds {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

export interface EngineObstacleConfig { readonly id: string; readonly position: Vec2 }
export interface EngineHazardConfig { readonly id: string; readonly position: Vec2 }
export interface EnginePortalConfig { readonly id: string; readonly a: Vec2; readonly b: Vec2 }
export interface EngineFoodConfig {
  readonly id: string;
  readonly type: string;
  readonly position: Vec2;
  readonly value: number;
  readonly growthDelta?: number;
  readonly scoreDelta?: number;
}

export interface EngineConfig {
  readonly board: Readonly<{ width: number; height: number }>;
  readonly seed: number;
  readonly initialSnake: Readonly<{
    body: readonly Vec2[];
    direction: Direction;
  }>;
  readonly growthPerFood: number;
  readonly scorePerFood: number;
  readonly wrap?: boolean;
  readonly obstacles?: readonly EngineObstacleConfig[];
  readonly hazards?: readonly EngineHazardConfig[];
  readonly portals?: readonly EnginePortalConfig[];
  readonly food?: readonly EngineFoodConfig[];
  readonly activeBounds?: ActiveBounds;
}

export class EngineConfigError extends Error {
  override readonly name = 'EngineConfigError';
}

export function createBaselineConfig(seed = 1): EngineConfig {
  return {
    board: { width: 12, height: 8 },
    seed,
    initialSnake: {
      body: [
        { x: 3, y: 3 },
        { x: 2, y: 3 },
        { x: 1, y: 3 },
      ],
      direction: 'right',
    },
    growthPerFood: 1,
    scorePerFood: 10,
  };
}

const integerCell = (cell: Vec2): boolean => Number.isInteger(cell.x) && Number.isInteger(cell.y);
const inBoard = (cell: Vec2, width: number, height: number): boolean => integerCell(cell) && cell.x >= 0 && cell.x < width && cell.y >= 0 && cell.y < height;

export function validateConfig(config: EngineConfig): void {
  const { width, height } = config.board;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new EngineConfigError('Board dimensions must be positive integers.');
  }
  if (!Number.isInteger(config.seed)) throw new EngineConfigError('Seed must be an integer.');
  if (!Number.isInteger(config.growthPerFood) || config.growthPerFood < 0) {
    throw new EngineConfigError('growthPerFood must be a non-negative integer.');
  }
  if (!Number.isFinite(config.scorePerFood)) throw new EngineConfigError('scorePerFood must be finite.');
  if (config.initialSnake.body.length === 0) throw new EngineConfigError('Initial snake body cannot be empty.');

  const seen = new Set<number>();
  for (const cell of config.initialSnake.body) {
    if (!integerCell(cell)) throw new EngineConfigError('Snake coordinates must be integers.');
    if (!inBoard(cell, width, height)) throw new EngineConfigError('Initial snake is outside the board.');
    const key = cell.y * width + cell.x;
    if (seen.has(key)) throw new EngineConfigError('Initial snake body overlaps itself.');
    seen.add(key);
  }

  const validateEntity = (label: string, id: string, position: Vec2): void => {
    if (id.length === 0) throw new EngineConfigError(`${label} id cannot be empty.`);
    if (!inBoard(position, width, height)) throw new EngineConfigError(`${label} is outside the board.`);
  };
  for (const obstacle of config.obstacles ?? []) validateEntity('Obstacle', obstacle.id, obstacle.position);
  for (const hazard of config.hazards ?? []) validateEntity('Hazard', hazard.id, hazard.position);
  for (const food of config.food ?? []) {
    validateEntity('Food', food.id, food.position);
    if (!Number.isFinite(food.value)) throw new EngineConfigError('Food value must be finite.');
    if (food.growthDelta !== undefined && !Number.isInteger(food.growthDelta)) throw new EngineConfigError('Food growthDelta must be an integer.');
    if (food.scoreDelta !== undefined && !Number.isFinite(food.scoreDelta)) throw new EngineConfigError('Food scoreDelta must be finite.');
  }
  for (const portal of config.portals ?? []) {
    if (portal.id.length === 0) throw new EngineConfigError('Portal id cannot be empty.');
    if (!inBoard(portal.a, width, height) || !inBoard(portal.b, width, height)) throw new EngineConfigError('Portal endpoint is outside the board.');
    if (portal.a.x === portal.b.x && portal.a.y === portal.b.y) throw new EngineConfigError('Portal endpoints must differ.');
  }
  if (config.activeBounds) {
    const bounds = config.activeBounds;
    if (![bounds.minX, bounds.minY, bounds.maxX, bounds.maxY].every(Number.isInteger)) throw new EngineConfigError('Active bounds must use integers.');
    if (bounds.minX < 0 || bounds.minY < 0 || bounds.maxX >= width || bounds.maxY >= height || bounds.minX > bounds.maxX || bounds.minY > bounds.maxY) {
      throw new EngineConfigError('Active bounds must be ordered inside the board.');
    }
  }
}
