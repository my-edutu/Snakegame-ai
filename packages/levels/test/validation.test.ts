import { describe, expect, it } from 'vitest';
import { parseLevelDefinition, validateLevelDefinition, LevelValidationError } from '../src/index.js';

const base = () => parseLevelDefinition({
  schemaVersion: 1, id: 'valid', number: 1, version: 1, name: 'Valid', description: 'Validation fixture',
  board: { width: 10, height: 8, wrap: false }, snake: { initialLength: 3, direction: 'right', head: { x: 3, y: 3 } },
  timing: { ticksPerSecond: 8 }, obstacles: [], hazards: [], portals: [],
  food: { types: [{ id: 'normal', weight: 1, value: 1, growthDelta: 1, scoreDelta: 10 }], maxActive: 1, spawnEveryTicks: 1, initialCount: 1 },
  progression: { mode: 'all', goals: [{ type: 'length', target: 8 }] }, completion: { onGoalsMet: 'level-complete' }, difficultyMultiplier: 1,
  ai: { lookaheadDepth: 2, lookaheadNodeBudget: 128, strategyMinDwellTicks: 1 }, theme: { id: 'base', music: 'm', palette: 'p' }, mechanics: [],
});

describe('semantic level validation', () => {
  it('accepts a valid level', () => expect(() => validateLevelDefinition(base())).not.toThrow());
  it('reports deterministic path-addressable issues', () => {
    const level = { ...base(), obstacles: [{ id: 'wall', kind: 'static' as const, cells: [{ x: 3, y: 3 }] }], portals: [{ id: 'p', a: { x: 20, y: 1 }, b: { x: 20, y: 1 } }] };
    try { validateLevelDefinition(level); throw new Error('expected validation failure'); }
    catch (error) {
      expect(error).toBeInstanceOf(LevelValidationError);
      const issues = (error as LevelValidationError).issues;
      expect(issues.map((issue) => issue.path)).toEqual(expect.arrayContaining(['obstacles.0.cells.0', 'portals.0.a', 'portals.0.b', 'portals.0']));
    }
  });
});
