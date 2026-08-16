import { DIRECTION_DELTAS, addVec, equalVec, type Direction, type Vec2 } from '@snake/shared';
import type { AiObservation } from './observation.js';

export const CANONICAL_DIRECTIONS = ['up', 'right', 'down', 'left'] as const satisfies readonly Direction[];

export interface GraphOptions {
  readonly traversableTarget?: Vec2;
}

export interface Neighbor {
  readonly direction: Direction;
  readonly position: Vec2;
}

export function coordinateKey(cell: Vec2): string {
  return `${cell.x},${cell.y}`;
}

export function cellIndex(cell: Vec2, width: number): number {
  return cell.y * width + cell.x;
}

export function isInsideObservation(observation: AiObservation, cell: Vec2): boolean {
  return cell.x >= 0 && cell.x < observation.board.width && cell.y >= 0 && cell.y < observation.board.height;
}

function isExplicitTarget(cell: Vec2, options?: GraphOptions): boolean {
  return options?.traversableTarget !== undefined && equalVec(cell, options.traversableTarget);
}

export function isTraversable(observation: AiObservation, cell: Vec2, options?: GraphOptions): boolean {
  if (!isInsideObservation(observation, cell)) return false;
  if (isExplicitTarget(cell, options)) return true;

  if (observation.body.some((item) => equalVec(item, cell))) return false;
  if (observation.obstacles.some((item) => equalVec(item.position, cell))) return false;
  if (observation.hazards.some((item) => equalVec(item.position, cell))) return false;
  return true;
}

export function enumerateNeighbors(observation: AiObservation, cell: Vec2, options?: GraphOptions): readonly Neighbor[] {
  const result: Neighbor[] = [];
  for (const direction of CANONICAL_DIRECTIONS) {
    const position = addVec(cell, DIRECTION_DELTAS[direction]);
    if (isTraversable(observation, position, options)) result.push({ direction, position });
  }
  return result;
}
