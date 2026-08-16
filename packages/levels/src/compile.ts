import type { Direction, Vec2 } from '@snake/shared';
import { generateGeometry, mixSeed } from './geometry.js';
import { buildInitialSnake, enumerateLevelCells } from './spawn.js';
import type { LevelDefinition } from './schema.js';
import { validateLevelDefinition } from './validate.js';

export interface CompiledEntity { readonly id: string; readonly position: Vec2 }
export interface CompiledPortal { readonly id: string; readonly a: Vec2; readonly b: Vec2 }
export interface CompiledFood { readonly id: string; readonly type: string; readonly position: Vec2; readonly value: number; readonly growthDelta: number; readonly scoreDelta: number }
export interface CompiledEngineConfig {
  readonly board: Readonly<{ width: number; height: number }>;
  readonly seed: number;
  readonly initialSnake: Readonly<{ body: readonly Vec2[]; direction: Direction }>;
  readonly growthPerFood: number;
  readonly scorePerFood: number;
  readonly wrap: boolean;
  readonly obstacles: readonly CompiledEntity[];
  readonly hazards: readonly CompiledEntity[];
  readonly portals: readonly CompiledPortal[];
  readonly food: readonly CompiledFood[];
}
export interface CompiledLevel {
  readonly levelId: string;
  readonly levelNumber: number;
  readonly levelVersion: number;
  readonly name: string;
  readonly engine: CompiledEngineConfig;
  readonly ticksPerSecond: number;
  readonly ai: LevelDefinition['ai'];
}

const key = (cell: Vec2): string => `${cell.x},${cell.y}`;

const obstacleCells = (level: LevelDefinition, seed: number): readonly CompiledEntity[] => {
  const result: CompiledEntity[] = [];
  const snake = new Set(buildInitialSnake(level).map(key));
  for (const obstacle of level.obstacles) {
    const cells = obstacle.kind === 'static'
      ? obstacle.cells
      : obstacle.kind === 'moving'
        ? [obstacle.path[0]!]
        : generateGeometry(obstacle.pattern, level.board.width, level.board.height, mixSeed(seed, level.number), obstacle.density ?? 0.15);
    cells.forEach((cell, index) => {
      if (!snake.has(key(cell))) result.push({ id: `${obstacle.id}-${index}`, position: { ...cell } });
    });
  }
  const seen = new Set<string>();
  return result.filter((item) => { const k = key(item.position); if (seen.has(k)) return false; seen.add(k); return true; });
};

const hazardCells = (level: LevelDefinition): readonly CompiledEntity[] => {
  const result: CompiledEntity[] = [];
  for (const hazard of level.hazards) {
    const cells = hazard.kind === 'static' ? hazard.cells : [hazard.path[0]!];
    cells.forEach((cell, index) => result.push({ id: `${hazard.id}-${index}`, position: { ...cell } }));
  }
  return result;
};

const pickFoodType = (level: LevelDefinition, seed: number, ordinal: number): LevelDefinition['food']['types'][number] => {
  const total = level.food.types.reduce((sum, type) => sum + type.weight, 0);
  const unit = mixSeed(seed, ordinal, 0xf00d) / 0xffffffff;
  let cursor = unit * total;
  for (const type of level.food.types) {
    cursor -= type.weight;
    if (cursor <= 0) return type;
  }
  return level.food.types[level.food.types.length - 1]!;
};

export function compileLevel(level: LevelDefinition, seed: number): CompiledLevel {
  validateLevelDefinition(level);
  const body = buildInitialSnake(level);
  const obstacles = obstacleCells(level, seed);
  const hazards = hazardCells(level);
  const reserved = new Set([...body, ...obstacles.map((item) => item.position), ...hazards.map((item) => item.position), ...level.portals.flatMap((portal) => [portal.a, portal.b])].map(key));
  const free = enumerateLevelCells(level.board.width, level.board.height).filter((cell) => !reserved.has(key(cell)));
  const food: CompiledFood[] = [];
  for (let ordinal = 0; ordinal < Math.min(level.food.initialCount, free.length); ordinal += 1) {
    const index = mixSeed(seed, level.number, ordinal) % free.length;
    const position = free.splice(index, 1)[0]!;
    const type = pickFoodType(level, seed, ordinal);
    food.push({ id: `level-${level.number}-food-${ordinal}`, type: type.id, position, value: type.value, growthDelta: type.growthDelta, scoreDelta: type.scoreDelta });
  }
  return {
    levelId: level.id,
    levelNumber: level.number,
    levelVersion: level.version,
    name: level.name,
    engine: {
      board: { width: level.board.width, height: level.board.height }, seed, initialSnake: { body, direction: level.snake.direction }, growthPerFood: 1, scorePerFood: 10,
      wrap: level.board.wrap, obstacles, hazards, portals: level.portals.map((portal) => ({ id: portal.id, a: { ...portal.a }, b: { ...portal.b } })), food,
    },
    ticksPerSecond: level.timing.ticksPerSecond,
    ai: { ...level.ai },
  };
}
