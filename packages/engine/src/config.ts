import type { Direction, Vec2 } from '@snake/shared';

export interface EngineConfig {
  readonly board: Readonly<{ width: number; height: number }>;
  readonly seed: number;
  readonly initialSnake: Readonly<{
    body: readonly Vec2[];
    direction: Direction;
  }>;
  readonly growthPerFood: number;
  readonly scorePerFood: number;
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
    if (!Number.isInteger(cell.x) || !Number.isInteger(cell.y)) throw new EngineConfigError('Snake coordinates must be integers.');
    if (cell.x < 0 || cell.x >= width || cell.y < 0 || cell.y >= height) {
      throw new EngineConfigError('Initial snake is outside the board.');
    }
    const key = cell.y * width + cell.x;
    if (seen.has(key)) throw new EngineConfigError('Initial snake body overlaps itself.');
    seen.add(key);
  }
}
