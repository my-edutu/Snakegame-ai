import { parseLevelDefinition, type LevelDefinition } from './schema.js';
import { validateLevelDefinition } from './validate.js';

const normalFood = { types: [{ id: 'normal', weight: 1, value: 1, growthDelta: 1, scoreDelta: 10 }], maxActive: 1, spawnEveryTicks: 1, initialCount: 1 } as const;

const base = (number: number, name: string): Record<string, unknown> => ({
  schemaVersion: 1, id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), number, version: 1, name,
  description: `Phase 5 strategic level ${number}: ${name}`,
  board: { width: 16, height: 12, wrap: false },
  snake: { initialLength: 3, direction: 'right', head: { x: 3, y: 3 } },
  timing: { ticksPerSecond: 8 }, obstacles: [], hazards: [], portals: [], food: normalFood,
  progression: { mode: 'all', goals: [{ type: 'length', target: 18 }] }, completion: { onGoalsMet: 'level-complete' }, difficultyMultiplier: 1 + number * 0.08,
  ai: { lookaheadDepth: 2, lookaheadNodeBudget: Math.max(48, 192 - number * 4), strategyMinDwellTicks: 1 },
  theme: { id: `level-${number}`, music: `stream-${Math.ceil(number / 5)}`, palette: `tier-${Math.ceil(number / 5)}` }, mechanics: [],
});

const level = (number: number, name: string, patch: Record<string, unknown>): LevelDefinition => {
  const parsed = parseLevelDefinition({ ...base(number, name), ...patch });
  validateLevelDefinition(parsed);
  return parsed;
};

export const LEVELS: readonly LevelDefinition[] = [
  level(1, 'Genesis', { progression: { mode: 'all', goals: [{ type: 'length', target: 16 }] } }),
  level(2, 'Growing Pressure', { board: { width: 14, height: 10, wrap: false }, progression: { mode: 'all', goals: [{ type: 'occupancy-percent', target: 22 }] } }),
  level(3, 'The Wall', { obstacles: [{ id: 'wall', kind: 'geometry', pattern: 'wall' }] }),
  level(4, 'Corridors', { obstacles: [{ id: 'corridors', kind: 'geometry', pattern: 'corridors' }], progression: { mode: 'all', goals: [{ type: 'length', target: 15 }] } }),
  level(5, 'Crossroads', { obstacles: [{ id: 'crossroads', kind: 'geometry', pattern: 'crossroads' }], progression: { mode: 'all', goals: [{ type: 'food', target: 8 }] } }),
  level(6, 'Velocity', { timing: { ticksPerSecond: 14 }, mechanics: [{ kind: 'speed-pressure', multiplier: 1.4 }], ai: { lookaheadDepth: 2, lookaheadNodeBudget: 140, strategyMinDwellTicks: 1 } }),
  level(7, 'Islands', { obstacles: [{ id: 'islands', kind: 'geometry', pattern: 'islands' }], board: { width: 18, height: 12, wrap: false } }),
  level(8, 'The Maze', { obstacles: [{ id: 'maze', kind: 'geometry', pattern: 'maze' }], board: { width: 19, height: 13, wrap: false }, progression: { mode: 'all', goals: [{ type: 'score', target: 80 }] } }),
  level(9, 'Moving Walls', { obstacles: [{ id: 'moving-wall', kind: 'moving', path: [{ x: 9, y: 2 }, { x: 9, y: 3 }, { x: 9, y: 4 }, { x: 9, y: 5 }], periodTicks: 4 }], progression: { mode: 'all', goals: [{ type: 'survival-ticks', target: 120 }] } }),
  level(10, 'Famine', { food: { ...normalFood, spawnEveryTicks: 8, initialCount: 1 }, mechanics: [{ kind: 'food-cadence', everyTicks: 8 }], progression: { mode: 'all', goals: [{ type: 'survival-ticks', target: 180 }] } }),
  level(11, 'Hunter', { hazards: [{ id: 'hunter', kind: 'moving', path: [{ x: 10, y: 2 }, { x: 11, y: 2 }, { x: 11, y: 3 }, { x: 10, y: 3 }], periodTicks: 2 }], progression: { mode: 'all', goals: [{ type: 'food', target: 10 }] } }),
  level(12, 'Portals', { board: { width: 18, height: 12, wrap: false }, portals: [{ id: 'alpha', a: { x: 6, y: 2 }, b: { x: 15, y: 9 } }, { id: 'beta', a: { x: 14, y: 2 }, b: { x: 5, y: 9 } }] }),
  level(13, 'Dual Feast', { food: { types: [{ id: 'normal', weight: 3, value: 1, growthDelta: 1, scoreDelta: 10 }, { id: 'gold', weight: 1, value: 3, growthDelta: 2, scoreDelta: 30 }], maxActive: 2, spawnEveryTicks: 2, initialCount: 2 }, progression: { mode: 'all', goals: [{ type: 'score', target: 140 }] } }),
  level(14, 'Poison Garden', { food: { types: [{ id: 'normal', weight: 3, value: 1, growthDelta: 1, scoreDelta: 10 }, { id: 'poison', weight: 1, value: -2, growthDelta: 0, scoreDelta: -25 }], maxActive: 3, spawnEveryTicks: 2, initialCount: 3 }, obstacles: [{ id: 'garden', kind: 'geometry', pattern: 'islands' }] }),
  level(15, 'Shrinking Arena', { board: { width: 20, height: 14, wrap: false }, mechanics: [{ kind: 'shrinking-bounds', everyTicks: 35, inset: 1, minWidth: 8, minHeight: 6 }], progression: { mode: 'all', goals: [{ type: 'survival-ticks', target: 220 }] } }),
  level(16, 'Chaos Grid', { board: { width: 20, height: 14, wrap: false }, mechanics: [{ kind: 'chaos-grid', everyTicks: 20, density: 0.12 }], progression: { mode: 'all', goals: [{ type: 'food', target: 12 }] } }),
  level(17, 'Hyper Speed', { timing: { ticksPerSecond: 30 }, mechanics: [{ kind: 'speed-pressure', multiplier: 2.5 }], ai: { lookaheadDepth: 1, lookaheadNodeBudget: 64, strategyMinDwellTicks: 1 }, progression: { mode: 'all', goals: [{ type: 'survival-ticks', target: 260 }] } }),
  level(18, 'Labyrinth', { board: { width: 22, height: 16, wrap: false }, obstacles: [{ id: 'labyrinth', kind: 'geometry', pattern: 'labyrinth' }], progression: { mode: 'all', goals: [{ type: 'score', target: 180 }] } }),
  level(19, 'Endgame', { board: { width: 24, height: 16, wrap: false }, snake: { initialLength: 20, direction: 'right', head: { x: 20, y: 3 } }, obstacles: [{ id: 'endgame-islands', kind: 'geometry', pattern: 'islands' }], progression: { mode: 'all', goals: [{ type: 'occupancy-percent', target: 48 }] } }),
  level(20, 'Singularity', { board: { width: 22, height: 16, wrap: true }, snake: { initialLength: 18, direction: 'right', head: { x: 19, y: 3 } }, obstacles: [{ id: 'singularity-ring', kind: 'geometry', pattern: 'ring' }], food: { ...normalFood, spawnEveryTicks: 3 }, mechanics: [{ kind: 'speed-pressure', multiplier: 1.8 }], progression: { mode: 'all', goals: [{ type: 'occupancy-percent', target: 88 }] }, ai: { lookaheadDepth: 3, lookaheadNodeBudget: 96, strategyMinDwellTicks: 1 } }),
];

export function mechanicFingerprint(definition: LevelDefinition): string {
  return JSON.stringify({
    board: definition.board, snake: { initialLength: definition.snake.initialLength, direction: definition.snake.direction }, timing: definition.timing,
    obstacles: definition.obstacles, hazards: definition.hazards, portals: definition.portals, food: definition.food,
    progression: definition.progression, difficultyMultiplier: definition.difficultyMultiplier, ai: definition.ai, mechanics: definition.mechanics,
  });
}
