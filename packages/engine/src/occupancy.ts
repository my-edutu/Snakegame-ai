import type { Vec2 } from '@snake/shared';

export function encodeCell(cell: Vec2, width: number): number {
  return cell.y * width + cell.x;
}

export function isInsideBoard(cell: Vec2, width: number, height: number): boolean {
  return cell.x >= 0 && cell.x < width && cell.y >= 0 && cell.y < height;
}

export function enumerateFreeCells(width: number, height: number, occupied: readonly Vec2[]): readonly Vec2[] {
  const occupiedKeys = new Set(occupied.map((cell) => encodeCell(cell, width)));
  const free: Vec2[] = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const cell = { x, y };
      if (!occupiedKeys.has(encodeCell(cell, width))) free.push(cell);
    }
  }
  return free;
}

export function occupancyPercent(snakeLength: number, width: number, height: number): number {
  return (snakeLength / (width * height)) * 100;
}
