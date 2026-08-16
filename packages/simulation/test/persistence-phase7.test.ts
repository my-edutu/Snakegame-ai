import { describe, expect, it } from 'vitest';
import * as simulation from '../src/index.js';

const get = (name: string) => Reflect.get(simulation, name) as any;

describe('Phase 7 versioned persistence', () => {
  it('exports persistence APIs', () => {
    expect(typeof get('serializeProgressionState')).toBe('function');
    expect(typeof get('parseProgressionState')).toBe('function');
  });

  it('round trips canonical state without retaining references', () => {
    const serialize = get('serializeProgressionState'); const parse = get('parseProgressionState'); if (!serialize || !parse) return;
    const source = { lifecycle: { phase: 'playing', runNumber: 3, currentLevel: 4, levelCount: 20, levelStreak: 2, pendingLevel: null, countdownTicksRemaining: 0, celebrationTicksRemaining: 0 }, records: { totalGames: 2, deaths: 1, totalFood: 44, totalPlayTicks: 500, highestLevel: 7, longestLevelStreak: 5, maxLength: 30, maxOccupancyPercent: 60, longestSurvivalTicks: 300, highScore: 1400, fastestCompletionTicks: 90 } };
    const snapshot = serialize(source);
    expect(snapshot.schemaVersion).toBe(1);
    const parsed = parse(snapshot);
    expect(parsed).toEqual(source);
    source.records.totalFood = 999;
    expect(parsed.records.totalFood).toBe(44);
  });

  it('rejects malformed durable state', () => {
    const parse = get('parseProgressionState'); if (!parse) return;
    expect(() => parse({ schemaVersion: 2 })).toThrow();
    expect(() => parse({ schemaVersion: 1, lifecycle: { phase: 'playing', runNumber: 0, currentLevel: 1, levelCount: 20, levelStreak: 0, pendingLevel: null, countdownTicksRemaining: 0, celebrationTicksRemaining: 0 }, records: {} })).toThrow();
    expect(() => parse({ schemaVersion: 1, lifecycle: { phase: 'playing', runNumber: 1, currentLevel: 21, levelCount: 20, levelStreak: 0, pendingLevel: null, countdownTicksRemaining: 0, celebrationTicksRemaining: 0 }, records: { totalGames: 0, deaths: 0, totalFood: 0, totalPlayTicks: 0, highestLevel: 1, longestLevelStreak: 0, maxLength: 0, maxOccupancyPercent: 0, longestSurvivalTicks: 0, highScore: 0, fastestCompletionTicks: null } })).toThrow();
  });
});
