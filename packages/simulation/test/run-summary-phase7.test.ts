import { describe, expect, it } from 'vitest';
import * as simulation from '../src/index.js';

const get = (name: string) => Reflect.get(simulation, name) as any;

describe('Phase 7 death labels and run summaries', () => {
  it('exports summary APIs', () => {
    expect(typeof get('classifyDeath')).toBe('function');
    expect(typeof get('buildRunSummary')).toBe('function');
  });

  it('maps every engine death cause to spectator copy while preserving cause', () => {
    const classify = get('classifyDeath'); if (!classify) return;
    const expected: Record<string,string> = { 'wall-collision':'WALL IMPACT', 'self-collision':'SELF COLLISION', 'obstacle-collision':'OBSTACLE IMPACT', 'hazard-collision':'HAZARD HIT', 'bounds-collision':'ARENA COLLAPSE' };
    for (const [cause, label] of Object.entries(expected)) expect(classify(cause)).toEqual({ internalCause: cause, label, source: 'natural' });
    expect(classify('wall-collision', { category: 'configured-deviation', contributory: true, deviationId: 'dev-1', naturalCause: 'wall-collision' })).toMatchObject({ internalCause: 'wall-collision', source: 'configured-deviation', deviationId: 'dev-1' });
  });

  it('builds structured summaries with new-record markers', () => {
    const build = get('buildRunSummary'); if (!build) return;
    const summary = build({ runNumber: 4, levelNumber: 7, terminalReason: 'death', deathCause: 'hazard-collision', ticksSurvived: 300, maxLength: 30, maxOccupancyPercent: 60, score: 1500, foodConsumed: 20, levelCompleted: false, newRecords: ['high-score'], milestones: [{ key: 'length-25' }], nearDeaths: [{ type: 'near-death', tick: 250 }] });
    expect(summary).toMatchObject({ runNumber: 4, levelNumber: 7, outcome: 'death', ticksSurvived: 300, maxLength: 30, score: 1500, newRecords: ['high-score'] });
    expect(summary.death.label).toBe('HAZARD HIT');
    expect(summary.highlights).toContain('NEW RECORD: HIGH SCORE');
  });
});
