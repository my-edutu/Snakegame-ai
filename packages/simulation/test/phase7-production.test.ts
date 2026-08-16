import { describe, expect, it } from 'vitest';
import { completeLevel, createLifecycleState, endRun, reduceLifecycle } from '../src/lifecycle.js';
import { createMilestoneState, evaluateMilestones } from '../src/milestones.js';
import { createEmptyRecords, updateRecords } from '../src/records.js';
import { parseProgressionState, serializeProgressionState } from '../src/persistence.js';

const config = { levelCount: 20, restartDelayTicks: 2, celebrationTicks: 1 } as const;

function runCorpus(iterations: number) {
  let lifecycle = createLifecycleState(config);
  let records = createEmptyRecords();
  let milestones = createMilestoneState();
  let emitted = 0;

  for (let index = 0; index < iterations; index += 1) {
    if (lifecycle.phase === 'playing') {
      const death = index % 17 === 0;
      const completed = !death;
      const nextStreak = completed ? lifecycle.levelStreak + 1 : 0;
      records = updateRecords(records, {
        levelNumber: lifecycle.currentLevel,
        levelCompleted: completed,
        runEnded: death || (completed && lifecycle.currentLevel === lifecycle.levelCount),
        died: death,
        ticksSurvived: 20 + (index % 181),
        maxLength: 3 + (index % 98),
        maxOccupancyPercent: index % 101,
        score: index * 7,
        foodConsumed: index % 9,
        levelStreak: nextStreak,
        completionTicks: completed ? 20 + (index % 181) : null,
      }).records;
      const milestoneResult = evaluateMilestones(milestones, {
        tick: records.totalPlayTicks,
        length: records.maxLength,
        occupancyPercent: records.maxOccupancyPercent,
        foodConsumed: records.totalFood,
        score: records.highScore,
        level: lifecycle.currentLevel,
        levelStreak: nextStreak,
        ticksSurvived: records.longestSurvivalTicks,
      }, { minimumGapTicks: 5 });
      milestones = milestoneResult.state;
      emitted += milestoneResult.events.length;
      lifecycle = death ? endRun(lifecycle, config) : completeLevel(lifecycle, 'immediate-advance', config);
    } else {
      lifecycle = reduceLifecycle(lifecycle, { type: 'tick' }, config);
    }
  }

  const snapshot = serializeProgressionState({ lifecycle, records });
  return { snapshot, parsed: parseProgressionState(snapshot), milestones, emitted };
}

describe('Phase 7 production lifecycle corpus', () => {
  it('runs 10,000 lifecycle cycles byte-deterministically with bounded event state', () => {
    const first = runCorpus(10_000);
    const second = runCorpus(10_000);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first.parsed).toEqual({ lifecycle: first.snapshot.lifecycle, records: first.snapshot.records });
    expect(first.milestones.emittedKeys.length).toBeLessThanOrEqual(29);
    expect(first.emitted).toBeLessThanOrEqual(29);
    expect(first.snapshot.lifecycle.currentLevel).toBeGreaterThanOrEqual(1);
    expect(first.snapshot.lifecycle.currentLevel).toBeLessThanOrEqual(20);
    for (const value of Object.values(first.snapshot.records)) if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
  });
});
