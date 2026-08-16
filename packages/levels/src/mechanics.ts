import type { Vec2 } from '@snake/shared';
import { generateGeometry, mixSeed } from './geometry.js';
import type { LevelDefinition } from './schema.js';

export interface MechanicFrame {
  readonly movingObstacles: readonly Readonly<{ id: string; position: Vec2 }>[];
  readonly movingHazards: readonly Readonly<{ id: string; position: Vec2 }>[];
  readonly chaosCells: readonly Vec2[];
  readonly activeBounds: Readonly<{ minX: number; minY: number; maxX: number; maxY: number }>;
  readonly foodSpawnDue: boolean;
  readonly speedMultiplier: number;
}

const moveAt = (path: readonly Vec2[], periodTicks: number, tick: number): Vec2 => ({ ...path[Math.floor(tick / periodTicks) % path.length]! });

export function resolveMechanics(level: LevelDefinition, seed: number, tick: number): MechanicFrame {
  const movingObstacles = level.obstacles.filter((item) => item.kind === 'moving').map((item) => ({ id: item.id, position: moveAt(item.path, item.periodTicks, tick) }));
  const movingHazards = level.hazards.filter((item) => item.kind === 'moving').map((item) => ({ id: item.id, position: moveAt(item.path, item.periodTicks, tick) }));
  let activeBounds = { minX: 0, minY: 0, maxX: level.board.width - 1, maxY: level.board.height - 1 };
  let chaosCells: readonly Vec2[] = [];
  let speedMultiplier = 1;
  let foodEvery = level.food.spawnEveryTicks;
  for (const mechanic of level.mechanics) {
    if (mechanic.kind === 'shrinking-bounds') {
      const maxInsetX = Math.max(0, Math.floor((level.board.width - mechanic.minWidth) / 2));
      const maxInsetY = Math.max(0, Math.floor((level.board.height - mechanic.minHeight) / 2));
      const steps = Math.floor(tick / mechanic.everyTicks) * mechanic.inset;
      const insetX = Math.min(maxInsetX, steps);
      const insetY = Math.min(maxInsetY, steps);
      activeBounds = { minX: insetX, minY: insetY, maxX: level.board.width - insetX - 1, maxY: level.board.height - insetY - 1 };
    } else if (mechanic.kind === 'chaos-grid') {
      const bucket = Math.floor(tick / mechanic.everyTicks);
      chaosCells = generateGeometry('seeded-grid', level.board.width, level.board.height, mixSeed(seed, bucket, level.number), mechanic.density);
    } else if (mechanic.kind === 'speed-pressure') {
      speedMultiplier *= mechanic.multiplier;
    } else if (mechanic.kind === 'food-cadence') {
      foodEvery = mechanic.everyTicks;
    }
  }
  return { movingObstacles, movingHazards, chaosCells, activeBounds, foodSpawnDue: tick > 0 && tick % foodEvery === 0, speedMultiplier };
}
