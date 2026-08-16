import { describe, expect, it } from 'vitest';
import { createHudSnapshot, HudValidationError } from '../src/hud-model.js';
import type { HudSnapshotInput } from '../src/hud-types.js';

const baseInput = (): HudSnapshotInput => ({
  level: { number: 7, name: 'The Maze', total: 20 },
  run: {
    number: 12,
    elapsedTicks: 1_250,
    tickDurationMs: 100,
    levelStreak: 4,
    lifecycle: 'playing',
    countdownTicksRemaining: 0,
  },
  primary: {
    score: 4_250,
    length: 84,
    occupancyPercent: 58.4,
    foodEaten: 81,
    safeMoves: 3,
    projectedMoves: 16,
  },
  risk: { score: 68, band: 'high' },
  strategy: {
    label: 'food-path-rejected',
    trapRiskPercent: 68,
    preservedEscapeRoutes: 3,
    endgame: false,
    criticalSafeMoves: null,
  },
  records: {
    bestOccupancyPercent: 77.2,
    highestLevel: 11,
    deaths: 8,
    totalGames: 11,
    highScore: 6_100,
    maxLength: 112,
    longestSurvivalTicks: 4_000,
  },
  recordTarget: {
    id: 'max-occupancy',
    label: 'ALL-TIME OCCUPANCY',
    current: 58.4,
    target: 77.2,
    unit: 'percent',
  },
  runSummary: null,
  emittedEventIds: ['occupancy-50'],
});

describe('createHudSnapshot', () => {
  it('returns detached presentation data that cannot be changed through the input', () => {
    const input = baseInput();
    const snapshot = createHudSnapshot(input);

    expect(snapshot.level).toEqual({ number: 7, name: 'The Maze', total: 20 });
    expect(snapshot.strategy.trapRiskPercent).toBe(68);
    expect(snapshot.emittedEventIds).toEqual(['occupancy-50']);

    input.level.name = 'Mutated';
    input.strategy.trapRiskPercent = 2;
    input.emittedEventIds.push('record-high-score');

    expect(snapshot.level.name).toBe('The Maze');
    expect(snapshot.strategy.trapRiskPercent).toBe(68);
    expect(snapshot.emittedEventIds).toEqual(['occupancy-50']);
  });

  it.each([
    ['score', (input: HudSnapshotInput) => { input.primary.score = -1; }],
    ['length', (input: HudSnapshotInput) => { input.primary.length = Number.NaN; }],
    ['occupancy', (input: HudSnapshotInput) => { input.primary.occupancyPercent = 101; }],
    ['risk', (input: HudSnapshotInput) => { input.risk.score = -0.1; }],
    ['deaths-totalGames', (input: HudSnapshotInput) => { input.records.deaths = input.records.totalGames + 1; }],
    ['countdown', (input: HudSnapshotInput) => { input.run.countdownTicksRemaining = -1; }],
  ])('rejects invalid %s data', (_label, mutate) => {
    const input = baseInput();
    mutate(input);
    expect(() => createHudSnapshot(input)).toThrow(HudValidationError);
  });

  it('requires non-empty public level and strategy labels', () => {
    const badLevel = baseInput();
    badLevel.level.name = '   ';
    expect(() => createHudSnapshot(badLevel)).toThrow(HudValidationError);

    const badStrategy = baseInput();
    badStrategy.strategy.label = '';
    expect(() => createHudSnapshot(badStrategy)).toThrow(HudValidationError);
  });
});
