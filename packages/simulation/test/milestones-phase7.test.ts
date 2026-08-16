import { describe, expect, it } from 'vitest';
import * as simulation from '../src/index.js';

const get = (name: string) => Reflect.get(simulation, name) as any;

describe('Phase 7 milestone engine', () => {
  it('exports milestone APIs', () => {
    expect(typeof get('createMilestoneState')).toBe('function');
    expect(typeof get('evaluateMilestones')).toBe('function');
  });

  it('emits meaningful milestones once in deterministic order', () => {
    const create = get('createMilestoneState'); const evaluate = get('evaluateMilestones');
    if (!create || !evaluate) return;
    const input = { tick: 100, length: 25, occupancyPercent: 50, foodConsumed: 25, score: 1000, level: 10, levelStreak: 5, ticksSurvived: 500 };
    const first = evaluate(create(), input, { minimumGapTicks: 0 });
    expect(first.events.map((e: any) => e.key)).toEqual(['length-10','length-25','occupancy-25','occupancy-50','food-10','food-25','score-100','score-500','score-1000','level-5','level-10','streak-3','streak-5','survival-100','survival-500']);
    const again = evaluate(first.state, { ...input, tick: 101 }, { minimumGapTicks: 0 });
    expect(again.events).toEqual([]);
  });

  it('rate limits milestone spam without losing dedupe state', () => {
    const create = get('createMilestoneState'); const evaluate = get('evaluateMilestones');
    if (!create || !evaluate) return;
    const first = evaluate(create(), { tick: 10, length: 10, occupancyPercent: 0, foodConsumed: 0, score: 0, level: 1, levelStreak: 0, ticksSurvived: 10 }, { minimumGapTicks: 20 });
    expect(first.events).toHaveLength(1);
    const blocked = evaluate(first.state, { tick: 15, length: 25, occupancyPercent: 0, foodConsumed: 0, score: 0, level: 1, levelStreak: 0, ticksSurvived: 15 }, { minimumGapTicks: 20 });
    expect(blocked.events).toEqual([]);
    const later = evaluate(blocked.state, { tick: 31, length: 25, occupancyPercent: 0, foodConsumed: 0, score: 0, level: 1, levelStreak: 0, ticksSurvived: 31 }, { minimumGapTicks: 20 });
    expect(later.events.map((e: any) => e.key)).toContain('length-25');
  });
});
