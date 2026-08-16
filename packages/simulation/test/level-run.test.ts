import { describe, expect, it } from 'vitest';
import * as simulation from '../src/index.js';
import { LEVELS } from '../../levels/src/index.js';

describe('level-aware simulation orchestration', () => {
  it('exports deterministic single-level and batch runners', () => {
    expect(typeof Reflect.get(simulation, 'runLevelSimulation')).toBe('function');
    expect(typeof Reflect.get(simulation, 'runLevelBatch')).toBe('function');
  });

  it('runs the same level and seed byte-identically', () => {
    const run = Reflect.get(simulation, 'runLevelSimulation');
    expect(typeof run).toBe('function');
    if (typeof run !== 'function') return;
    const a = run(LEVELS[0], 123, { maxTicks: 40 });
    const b = run(LEVELS[0], 123, { maxTicks: 40 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.levelId).toBe('genesis');
    expect(a.levelNumber).toBe(1);
  });
});
