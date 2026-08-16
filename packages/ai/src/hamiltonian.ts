import { DIRECTION_DELTAS, addVec, type Direction, type Vec2 } from '@snake/shared';
import type { SimulatedState } from './simulation.js';

export interface HamiltonianOrder { readonly size: number; readonly indexByCell: ReadonlyMap<string, number> }
const key = (v: Vec2): string => `${v.x},${v.y}`;

export function createHamiltonianOrder(width: number, height: number): HamiltonianOrder | null {
  if (width <= 1 || height <= 1 || (width % 2 !== 0 && height % 2 !== 0)) return null;
  const cells: Vec2[] = [];
  if (width % 2 === 0) {
    for (let x = 0; x < width; x += 1) cells.push({ x, y: 0 });
    for (let x = width - 1; x >= 0; x -= 1) {
      if (x % 2 === 1) for (let y = 1; y < height; y += 1) cells.push({ x, y });
      else if (x > 0) for (let y = height - 1; y >= 1; y -= 1) cells.push({ x, y });
    }
  } else {
    for (let y = 0; y < height; y += 1) cells.push({ x: 0, y });
    for (let y = height - 1; y >= 0; y -= 1) {
      if (y % 2 === 1) for (let x = 1; x < width; x += 1) cells.push({ x, y });
      else if (y > 0) for (let x = width - 1; x >= 1; x -= 1) cells.push({ x, y });
    }
  }
  if (cells.length !== width * height) return null;
  const map = new Map<string, number>();
  cells.forEach((cell, i) => map.set(key(cell), i));
  return { size: cells.length, indexByCell: map };
}

export function hamiltonianMovePenalty(order: HamiltonianOrder, state: SimulatedState, direction: Direction): number {
  const head = state.body[0];
  if (!head) return 1;
  const next = addVec(head, DIRECTION_DELTAS[direction]);
  const from = order.indexByCell.get(key(head));
  const to = order.indexByCell.get(key(next));
  if (from === undefined || to === undefined) return 1;
  const forward = (to - from + order.size) % order.size;
  return forward === 1 ? 0 : Math.min(1, forward / Math.max(1, order.size - 1));
}
