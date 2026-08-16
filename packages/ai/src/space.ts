import type { Vec2 } from '@snake/shared';
import type { SimulatedState } from './simulation.js';

export interface SpaceAnalysis {
  readonly reachableArea: number;
  readonly reachableAreaRatio: number;
  readonly tailReachable: boolean;
  readonly escapeRouteCount: number;
  readonly localDegree: number;
  readonly corridorDepth: number;
  readonly deadEnd: boolean;
  readonly articulationPressure: number;
}

const DIRS: readonly Vec2[] = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
const key = (v: Vec2): string => `${v.x},${v.y}`;

function blocked(state: SimulatedState): Set<string> {
  const set = new Set<string>();
  for (const cell of state.body.slice(1)) set.add(key(cell));
  for (const o of state.obstacles) set.add(key(o.position));
  for (const h of state.hazards) set.add(key(h.position));
  return set;
}

function neighbors(state: SimulatedState, cell: Vec2, blockedSet: ReadonlySet<string>): Vec2[] {
  const out: Vec2[] = [];
  for (const d of DIRS) {
    const n = { x: cell.x + d.x, y: cell.y + d.y };
    if (n.x < 0 || n.y < 0 || n.x >= state.board.width || n.y >= state.board.height) continue;
    if (!blockedSet.has(key(n))) out.push(n);
  }
  return out;
}

function flood(state: SimulatedState, start: Vec2, blockedSet: ReadonlySet<string>): Set<string> {
  const queue: Vec2[] = [{ ...start }];
  const seen = new Set<string>([key(start)]);
  let cursor = 0;
  while (cursor < queue.length) {
    const current = queue[cursor++]!;
    for (const n of neighbors(state, current, blockedSet)) {
      const k = key(n);
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push(n);
    }
  }
  return seen;
}

export function analyzeSpace(state: SimulatedState): SpaceAnalysis {
  const head = state.body[0];
  if (!head) return { reachableArea: 0, reachableAreaRatio: 0, tailReachable: false, escapeRouteCount: 0, localDegree: 0, corridorDepth: 0, deadEnd: true, articulationPressure: 1 };
  const b = blocked(state);
  const seen = flood(state, head, b);
  const totalPlayable = Math.max(1, state.board.width * state.board.height - state.obstacles.length - state.hazards.length);
  const local = neighbors(state, head, b);

  let corridorDepth = 0;
  if (local.length <= 2) {
    let frontier = local.map((v) => ({ cell: v, depth: 1, prev: key(head) }));
    const visited = new Set<string>([key(head)]);
    while (frontier.length && corridorDepth < state.board.width * state.board.height) {
      const nextFrontier: typeof frontier = [];
      for (const item of frontier) {
        const k = key(item.cell);
        if (visited.has(k)) continue;
        visited.add(k);
        corridorDepth = Math.max(corridorDepth, item.depth);
        const options = neighbors(state, item.cell, b).filter((n) => key(n) !== item.prev && !visited.has(key(n)));
        if (options.length > 1) continue;
        for (const n of options) nextFrontier.push({ cell: n, depth: item.depth + 1, prev: k });
      }
      frontier = nextFrontier;
    }
  }

  const tail = state.body.at(-1);
  let tailReachable = false;
  if (tail) {
    const tailBlocked = new Set(b);
    tailBlocked.delete(key(tail));
    tailReachable = flood(state, head, tailBlocked).has(key(tail));
  }

  const reachableArea = seen.size;
  const reachableAreaRatio = Math.min(1, reachableArea / totalPlayable);
  const deadEnd = local.length === 0 || (local.length === 1 && reachableArea <= state.body.length + 1);
  const articulationPressure = Math.max(0, Math.min(1, (2 - Math.min(2, local.length)) * 0.25 + Math.min(0.5, corridorDepth / Math.max(4, reachableArea))));
  return { reachableArea, reachableAreaRatio, tailReachable, escapeRouteCount: local.length, localDegree: local.length, corridorDepth, deadEnd, articulationPressure };
}
