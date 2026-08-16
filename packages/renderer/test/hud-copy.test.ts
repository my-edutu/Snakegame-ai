import { describe, expect, it } from 'vitest';
import { derivePublicStrategyCopy, formatCountdown, formatHudDuration, selectNextHudTarget } from '../src/hud-copy.js';
import { createHudSnapshot } from '../src/hud-model.js';
import type { HudSnapshotInput } from '../src/hud-types.js';

const baseInput = (): HudSnapshotInput => ({
  level: { number: 7, name: 'The Maze', total: 20 },
  run: { number: 12, elapsedTicks: 1_250, tickDurationMs: 100, levelStreak: 4, lifecycle: 'playing', countdownTicksRemaining: 0 },
  primary: { score: 4_250, length: 84, occupancyPercent: 58.4, foodEaten: 81, safeMoves: 3, projectedMoves: 16 },
  risk: { score: 68, band: 'high' },
  strategy: { label: 'space-preservation', trapRiskPercent: null, preservedEscapeRoutes: null, endgame: false, criticalSafeMoves: null },
  records: { bestOccupancyPercent: 77.2, highestLevel: 11, deaths: 8, totalGames: 11, highScore: 6_100, maxLength: 112, longestSurvivalTicks: 4_000 },
  recordTarget: null,
  runSummary: null,
  emittedEventIds: [],
});

describe('HUD public copy', () => {
  it('formats elapsed time and countdowns for livestream display', () => {
    expect(formatHudDuration(0, 100)).toBe('00:00');
    expect(formatHudDuration(599, 100)).toBe('00:59');
    expect(formatHudDuration(600, 100)).toBe('01:00');
    expect(formatHudDuration(36_000, 100)).toBe('01:00:00');
    expect(formatCountdown(1, 100)).toBe('1');
    expect(formatCountdown(11, 100)).toBe('2');
    expect(formatCountdown(0, 100)).toBe('0');
  });

  it('derives strategy copy only from structured evidence', () => {
    expect(derivePublicStrategyCopy({ label: 'space-preservation', trapRiskPercent: null, preservedEscapeRoutes: null, endgame: false, criticalSafeMoves: null })).toBe('SPACE PRESERVATION');
    expect(derivePublicStrategyCopy({ label: 'food-path-rejected', trapRiskPercent: 68, preservedEscapeRoutes: null, endgame: false, criticalSafeMoves: null })).toBe('FOOD PATH REJECTED — trap risk 68%');
    expect(derivePublicStrategyCopy({ label: 'tail-follow', trapRiskPercent: null, preservedEscapeRoutes: 3, endgame: false, criticalSafeMoves: null })).toBe('FOLLOWING TAIL — 3 escape routes preserved');
    expect(derivePublicStrategyCopy({ label: 'endgame', trapRiskPercent: null, preservedEscapeRoutes: null, endgame: true, criticalSafeMoves: null })).toBe('ENDGAME MODE ACTIVATED');
    expect(derivePublicStrategyCopy({ label: 'survival', trapRiskPercent: null, preservedEscapeRoutes: null, endgame: false, criticalSafeMoves: 1 })).toBe('CRITICAL SURVIVAL — 1 safe move');
    expect(derivePublicStrategyCopy({ label: 'safe-food-path', trapRiskPercent: null, preservedEscapeRoutes: null, endgame: false, criticalSafeMoves: null })).toBe('SAFE FOOD PATH');
  });

  it('selects the nearest useful milestone before a distant record target', () => {
    const snapshot = createHudSnapshot(baseInput());
    expect(selectNextHudTarget(snapshot)).toEqual({ id: 'occupancy-75', label: 'NEXT MILESTONE', current: 58.4, target: 75, unit: 'percent' });
  });

  it('uses an explicit record target when no occupancy milestone remains', () => {
    const input = baseInput();
    input.primary.occupancyPercent = 96;
    input.recordTarget = { id: 'high-score', label: 'HIGH SCORE', current: 4_250, target: 6_100, unit: 'score' };
    expect(selectNextHudTarget(createHudSnapshot(input))).toEqual(input.recordTarget);
  });
});
