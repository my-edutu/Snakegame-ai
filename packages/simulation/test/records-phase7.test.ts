import { describe, expect, it } from 'vitest';
import * as simulation from '../src/index.js';

const fn = <T>(name: string): T => Reflect.get(simulation, name) as T;
const evidence = (overrides: Record<string, unknown> = {}) => ({ levelNumber: 3, levelCompleted: true, runEnded: false, died: false, ticksSurvived: 120, maxLength: 18, maxOccupancyPercent: 42, score: 900, foodConsumed: 12, levelStreak: 3, completionTicks: 120, ...overrides });

describe('Phase 7 all-time records', () => {
  it('exports record APIs', () => {
    expect(typeof fn('createEmptyRecords')).toBe('function');
    expect(typeof fn('updateRecords')).toBe('function');
  });

  it('updates cumulative counters, maxima and fastest completion immutably', () => {
    const create = fn<() => any>('createEmptyRecords');
    const update = fn<(r: any, e: any) => any>('updateRecords');
    if (!create || !update) return;
    const initial = create();
    const first = update(initial, evidence());
    expect(initial.totalFood).toBe(0);
    expect(first.records).toMatchObject({ totalFood: 12, totalPlayTicks: 120, highestLevel: 3, longestLevelStreak: 3, maxLength: 18, maxOccupancyPercent: 42, longestSurvivalTicks: 120, highScore: 900, fastestCompletionTicks: 120 });
    const ended = update(first.records, evidence({ runEnded: true, died: true, levelCompleted: false, completionTicks: null, ticksSurvived: 40, score: 100, foodConsumed: 2, levelStreak: 0 }));
    expect(ended.records.totalGames).toBe(1);
    expect(ended.records.deaths).toBe(1);
    expect(ended.records.totalFood).toBe(14);
    expect(ended.records.totalPlayTicks).toBe(160);
  });

  it('marks records only on strict improvement', () => {
    const create = fn<() => any>('createEmptyRecords');
    const update = fn<(r: any, e: any) => any>('updateRecords');
    if (!create || !update) return;
    const first = update(create(), evidence());
    expect(first.newRecords).toContain('high-score');
    const equal = update(first.records, evidence({ foodConsumed: 0, ticksSurvived: 0 }));
    expect(equal.newRecords).not.toContain('high-score');
    expect(equal.newRecords).not.toContain('max-length');
    const faster = update(equal.records, evidence({ completionTicks: 100, foodConsumed: 0, ticksSurvived: 0 }));
    expect(faster.records.fastestCompletionTicks).toBe(100);
    expect(faster.newRecords).toContain('fastest-completion');
  });
});
