import { describe, expect, it } from 'vitest';
import { LEVELS } from '@snake/levels';
import { runLevelBatch, runLevelSimulation } from '../src/index.js';

describe('Phase 5 all-level production corpus', () => {
  it('runs all twenty levels deterministically with bounded results', () => {
    const seeds = [1, 7, 42] as const;
    for (const level of LEVELS) {
      for (const seed of seeds) {
        const a = runLevelSimulation(level, seed, { maxTicks: 120 });
        const b = runLevelSimulation(level, seed, { maxTicks: 120 });
        expect(a).toEqual(b);
        expect(a.levelId).toBe(level.id);
        expect(a.run.ticksSurvived).toBeLessThanOrEqual(120);
        expect(Number.isFinite(a.run.maxOccupancyPercent)).toBe(true);
      }
    }
  });

  it('produces a deterministic batch row for every level/seed pair', () => {
    const report = runLevelBatch(LEVELS, [3, 11], { maxTicks: 80 });
    expect(report.runCount).toBe(LEVELS.length * 2);
    expect(report.rows.map((row) => row.levelId)).toEqual(LEVELS.flatMap((level) => [level.id, level.id]));
  });
});
