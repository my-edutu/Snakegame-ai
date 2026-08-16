import type { Vec2 } from '@snake/shared';
import type { LevelDefinition } from './schema.js';
import { initialSnakeCells } from './validate.js';

export function buildInitialSnake(level: LevelDefinition): readonly Vec2[] {
  return initialSnakeCells(level).map((cell) => ({ x: cell.x, y: cell.y }));
}

export function enumerateLevelCells(width: number, height: number): readonly Vec2[] {
  const cells: Vec2[] = [];
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) cells.push({ x, y });
  return cells;
}
