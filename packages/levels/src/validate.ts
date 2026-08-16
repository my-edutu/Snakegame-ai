import type { Direction } from '@snake/shared';
import type { LevelDefinition } from './schema.js';
import type { LevelValidationIssue } from './types.js';

export class LevelValidationError extends Error {
  override readonly name = 'LevelValidationError';
  constructor(readonly issues: readonly LevelValidationIssue[]) {
    super(issues.map((issue) => `${issue.path}: ${issue.message}`).join('; '));
  }
}

const deltas: Readonly<Record<Direction, Readonly<{ x: number; y: number }>>> = {
  up: { x: 0, y: -1 }, right: { x: 1, y: 0 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 },
};
const key = (x: number, y: number): string => `${x},${y}`;
const inside = (level: LevelDefinition, cell: Readonly<{ x: number; y: number }>): boolean => cell.x >= 0 && cell.x < level.board.width && cell.y >= 0 && cell.y < level.board.height;

export function initialSnakeCells(level: LevelDefinition): readonly Readonly<{ x: number; y: number }>[] {
  const d = deltas[level.snake.direction];
  return Array.from({ length: level.snake.initialLength }, (_, index) => ({ x: level.snake.head.x - d.x * index, y: level.snake.head.y - d.y * index }));
}

export function collectLevelValidationIssues(level: LevelDefinition): readonly LevelValidationIssue[] {
  const issues: LevelValidationIssue[] = [];
  const snake = initialSnakeCells(level);
  const snakeKeys = new Set<string>();
  snake.forEach((cell, index) => {
    if (!inside(level, cell)) issues.push({ path: `snake.body.${index}`, message: 'initial snake cell is outside board' });
    const k = key(cell.x, cell.y);
    if (snakeKeys.has(k)) issues.push({ path: `snake.body.${index}`, message: 'initial snake overlaps itself' });
    snakeKeys.add(k);
  });

  const entityIds = new Set<string>();
  const blocked = new Set<string>();
  const checkId = (path: string, id: string): void => {
    if (entityIds.has(id)) issues.push({ path, message: `duplicate entity id ${id}` });
    entityIds.add(id);
  };
  const checkCell = (path: string, cell: Readonly<{ x: number; y: number }>, reserve = true): void => {
    if (!inside(level, cell)) issues.push({ path, message: 'cell is outside board' });
    const k = key(cell.x, cell.y);
    if (snakeKeys.has(k)) issues.push({ path, message: 'cell intersects initial snake' });
    if (reserve && blocked.has(k)) issues.push({ path, message: 'cell overlaps another blocked entity' });
    if (reserve) blocked.add(k);
  };

  level.obstacles.forEach((obstacle, index) => {
    checkId(`obstacles.${index}.id`, obstacle.id);
    if (obstacle.kind === 'static') obstacle.cells.forEach((cell, cellIndex) => checkCell(`obstacles.${index}.cells.${cellIndex}`, cell));
    if (obstacle.kind === 'moving') obstacle.path.forEach((cell, cellIndex) => { if (!inside(level, cell)) issues.push({ path: `obstacles.${index}.path.${cellIndex}`, message: 'scheduled cell is outside board' }); });
  });
  level.hazards.forEach((hazard, index) => {
    checkId(`hazards.${index}.id`, hazard.id);
    if (hazard.kind === 'static') hazard.cells.forEach((cell, cellIndex) => checkCell(`hazards.${index}.cells.${cellIndex}`, cell));
    else hazard.path.forEach((cell, cellIndex) => { if (!inside(level, cell)) issues.push({ path: `hazards.${index}.path.${cellIndex}`, message: 'scheduled cell is outside board' }); });
  });
  level.portals.forEach((portal, index) => {
    checkId(`portals.${index}.id`, portal.id);
    if (!inside(level, portal.a)) issues.push({ path: `portals.${index}.a`, message: 'portal endpoint is outside board' });
    if (!inside(level, portal.b)) issues.push({ path: `portals.${index}.b`, message: 'portal endpoint is outside board' });
    if (key(portal.a.x, portal.a.y) === key(portal.b.x, portal.b.y)) issues.push({ path: `portals.${index}`, message: 'portal endpoints must differ' });
    for (const [label, cell] of [['a', portal.a], ['b', portal.b]] as const) {
      const k = key(cell.x, cell.y);
      if (blocked.has(k) || snakeKeys.has(k)) issues.push({ path: `portals.${index}.${label}`, message: 'portal endpoint is blocked' });
    }
  });

  const typeIds = new Set<string>();
  let totalWeight = 0;
  level.food.types.forEach((type, index) => {
    if (typeIds.has(type.id)) issues.push({ path: `food.types.${index}.id`, message: 'duplicate food type id' });
    typeIds.add(type.id);
    totalWeight += type.weight;
  });
  if (!(totalWeight > 0)) issues.push({ path: 'food.types', message: 'food weights must sum to a positive value' });
  const boardCapacity = level.board.width * level.board.height - blocked.size;
  if (level.food.initialCount > Math.max(0, boardCapacity - snake.length)) issues.push({ path: 'food.initialCount', message: 'not enough legal cells for initial food' });

  level.progression.goals.forEach((goal, index) => {
    if (goal.type === 'length' && goal.target > boardCapacity) issues.push({ path: `progression.goals.${index}.target`, message: 'length goal exceeds board capacity' });
  });

  return issues;
}

export function validateLevelDefinition(level: LevelDefinition): void {
  const issues = collectLevelValidationIssues(level);
  if (issues.length > 0) throw new LevelValidationError(issues);
}
