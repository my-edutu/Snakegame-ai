import { describe, expect, it } from 'vitest';
import { LEVELS } from '@snake/levels';
import { FAILURE_PRESETS } from '@snake/failure';
import * as simulation from '../src/index.js';

describe('Phase 6 failure-aware simulation', () => {
  it('exports a separate failure-aware level runner', () => {
    expect(typeof Reflect.get(simulation, 'runLevelSimulationWithFailure')).toBe('function');
  });

  it('matches the Phase 5 runner exactly when failure is disabled', () => {
    const run = Reflect.get(simulation, 'runLevelSimulationWithFailure') as any;
    if (typeof run !== 'function') return;
    const baseline = simulation.runLevelSimulation(LEVELS[0]!, 77, { maxTicks: 60 });
    const result = run(LEVELS[0]!, 77, { maxTicks: 60 }, FAILURE_PRESETS['Record Attempt']);
    expect(result.level).toEqual(baseline);
    expect(result.deviations).toEqual([]);
    expect(result.failureAttribution.category).toBe('natural');
  });

  it('produces byte-identical applied-deviation audit sequences for the same seed', () => {
    const run = Reflect.get(simulation, 'runLevelSimulationWithFailure') as any;
    if (typeof run !== 'function') return;
    const config = { ...FAILURE_PRESETS.Demo, probabilityPerMinute: 60, maximumProbabilityPerDecision: 1, minimumEligibleRunTicks: 0 };
    const a = run(LEVELS[0]!, 9, { maxTicks: 60 }, config);
    const b = run(LEVELS[0]!, 9, { maxTicks: 60 }, config);
    expect(a).toEqual(b);
    expect(a.deviations.every((event: any) => event.appliedDirection !== null)).toBe(true);
  });
});
