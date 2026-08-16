import { describe, expect, it } from 'vitest';
import { migrateLevelDefinition, parseLevelDefinition } from '../src/index.js';

const valid = () => ({
  schemaVersion: 1 as const, id: 'test-level', number: 1, version: 1, name: 'Test', description: 'Schema fixture',
  board: { width: 12, height: 8, wrap: false },
  snake: { initialLength: 3, direction: 'right' as const, head: { x: 3, y: 3 } },
  timing: { ticksPerSecond: 8 }, obstacles: [], hazards: [], portals: [],
  food: { types: [{ id: 'normal', weight: 1, value: 1, growthDelta: 1, scoreDelta: 10 }], maxActive: 1, spawnEveryTicks: 1, initialCount: 1 },
  progression: { mode: 'all' as const, goals: [{ type: 'length' as const, target: 10 }] },
  completion: { onGoalsMet: 'level-complete' as const }, difficultyMultiplier: 1,
  ai: { lookaheadDepth: 2, lookaheadNodeBudget: 128, strategyMinDwellTicks: 1 },
  theme: { id: 'genesis', music: 'ambient-1', palette: 'emerald' }, mechanics: [],
});

describe('LevelDefinition schema v1', () => {
  it('parses a complete declarative level and supplies stable defaults', () => {
    const parsed = parseLevelDefinition(valid());
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.board.wrap).toBe(false);
    expect(parsed.food.types[0]?.growthDelta).toBe(1);
  });
  it('rejects unknown fields and unsupported migration versions', () => {
    expect(() => parseLevelDefinition({ ...valid(), mystery: true })).toThrow();
    expect(() => migrateLevelDefinition({ ...valid(), schemaVersion: 2 })).toThrow(/Unsupported level schema version/);
  });
});
