import { describe, expect, it } from 'vitest';
import * as failure from '../src/index.js';

const fn = <T>(name: string): T => Reflect.get(failure, name) as T;

describe('Phase 6 failure hazard probability', () => {
  it('exports deterministic probability APIs', () => {
    expect(typeof fn('probabilityPerEligibleDecision')).toBe('function');
    expect(typeof fn('shouldApplyDeviation')).toBe('function');
  });

  it('converts rates and clamps the resulting probability', () => {
    const probability = fn<(config: any, decisionsPerSecond: number, context: any) => number>('probabilityPerEligibleDecision');
    if (typeof probability !== 'function') return;
    const hourly = probability({ enabled: true, targetFailuresPerHour: 60, minimumEligibleRunTicks: 0, maximumProbabilityPerDecision: 0.5, naturalLookingOnly: true, deviationTypes: ['second-best-route'] }, 10, { tick: 1, level: 1, risk: 0.5, length: 3, occupancyPercent: 0.1 });
    expect(hourly).toBeGreaterThan(0);
    expect(hourly).toBeLessThan(0.01);
    const clamped = probability({ enabled: true, probabilityPerMinute: 60, minimumEligibleRunTicks: 0, maximumProbabilityPerDecision: 0.02, naturalLookingOnly: true, deviationTypes: ['second-best-route'] }, 1, { tick: 1, level: 1, risk: 0.5, length: 3, occupancyPercent: 0.1 });
    expect(clamped).toBe(0.02);
  });

  it('uses an injected draw with exact boundaries', () => {
    const apply = fn<(probability: number, draw01: number) => boolean>('shouldApplyDeviation');
    if (typeof apply !== 'function') return;
    expect(apply(0, 0)).toBe(false);
    expect(apply(0.25, 0.249999)).toBe(true);
    expect(apply(0.25, 0.25)).toBe(false);
    expect(() => apply(0.2, -0.1)).toThrow();
    expect(() => apply(0.2, 1)).toThrow();
  });
});
