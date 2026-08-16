import { describe, expect, it } from 'vitest';
import { createBaselineConfig } from '@snake/engine';
import { runSimulation } from '../src/run.js';

const execution = {
  engine: createBaselineConfig(1),
  ai: { lookaheadDepth: 2, lookaheadNodeBudget: 64, strategyMinDwellTicks: 1 },
  harness: { maxTicks: 25 },
} as const;

describe('runSimulation', () => {
  it('is deterministic and returns finite bounded metrics', () => {
    const first = runSimulation(123456, execution);
    const second = runSimulation(123456, execution);
    expect(second).toEqual(first);
    expect(first.ticksSurvived).toBeLessThanOrEqual(25);
    expect(['death', 'board-filled', 'simulation-cap', 'no-move']).toContain(first.terminalReason);
    expect(first.levelReached).toBe(1);
    for (const value of [first.maxOccupancyPercent, first.averageRisk, first.peakRisk, first.averageDecisionNodes, first.peakDecisionNodes]) {
      expect(Number.isFinite(value)).toBe(true);
    }
  });

  it('classifies an initially full board without running decisions', () => {
    const full = {
      engine: {
        board: { width: 1, height: 1 }, seed: 1,
        initialSnake: { body: [{ x: 0, y: 0 }], direction: 'right' as const },
        growthPerFood: 1, scorePerFood: 10,
      },
      ai: { lookaheadDepth: 1, lookaheadNodeBudget: 8 },
      harness: { maxTicks: 10 },
    };
    const result = runSimulation(1, full);
    expect(result.terminalReason).toBe('board-filled');
    expect(result.levelCompleted).toBe(true);
    expect(result.totalDecisionNodes).toBe(0);
  });

  it('rejects unbounded or invalid harness limits', () => {
    expect(() => runSimulation(1, { ...execution, harness: { maxTicks: 0 } })).toThrow();
    expect(() => runSimulation(1.5, execution)).toThrow();
  });
});
