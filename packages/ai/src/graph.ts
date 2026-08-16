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

export function buildBlockedCellSet(observation: AiObservation, options?: GraphOptions): ReadonlySet<string> {
  const blocked = new Set<string>();
  for (const cell of observation.body) blocked.add(coordinateKey(cell));
  for (const item of observation.obstacles) blocked.add(coordinateKey(item.position));
  for (const item of observation.hazards) blocked.add(coordinateKey(item.position));
  if (options?.traversableTarget) blocked.delete(coordinateKey(options.traversableTarget));
  return blocked;
}

export function isTraversableWithBlocked(observation: AiObservation, cell: Vec2, blocked: ReadonlySet<string>): boolean {
  return isInsideObservation(observation, cell) && !blocked.has(coordinateKey(cell));
}

export function isTraversable(observation: AiObservation, cell: Vec2, options?: GraphOptions): boolean {
  if (!isInsideObservation(observation, cell)) return false;
  if (options?.traversableTarget && equalVec(cell, options.traversableTarget)) return true;
  return !buildBlockedCellSet(observation, options).has(coordinateKey(cell));
}

export function enumerateNeighborsWithBlocked(
  observation: AiObservation,
  cell: Vec2,
  blocked: ReadonlySet<string>,
): readonly Neighbor[] {
  const result: Neighbor[] = [];
  for (const direction of CANONICAL_DIRECTIONS) {
    const position = addVec(cell, DIRECTION_DELTAS[direction]);
    if (isTraversableWithBlocked(observation, position, blocked)) result.push({ direction, position });
  }
  return result;
}

export function enumerateNeighbors(observation: AiObservation, cell: Vec2, options?: GraphOptions): readonly Neighbor[] {
  return enumerateNeighborsWithBlocked(observation, cell, buildBlockedCellSet(observation, options));
}
