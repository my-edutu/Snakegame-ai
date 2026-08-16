import { describe, expect, it } from 'vitest';
import * as failure from '../src/index.js';

const get = <T>(name: string): T => Reflect.get(failure, name) as T;

describe('Phase 6 failure configuration and eligibility', () => {
  it('exports config parsing, presets and eligibility APIs', () => {
    expect(typeof get('parseFailureConfig')).toBe('function');
    expect(typeof get('evaluateFailureEligibility')).toBe('function');
    expect(Reflect.get(failure, 'FAILURE_PRESETS')).toBeDefined();
  });

  it('enforces disabled/runtime/level/risk restrictions exactly', () => {
    const parse = get<(value: unknown) => any>('parseFailureConfig');
    const eligibility = get<(config: any, context: any) => any>('evaluateFailureEligibility');
    expect(typeof parse).toBe('function');
    expect(typeof eligibility).toBe('function');
    if (typeof parse !== 'function' || typeof eligibility !== 'function') return;
    const base = parse({ enabled: true, probabilityPerMinute: 1, minimumEligibleRunTicks: 100, maximumRunTicks: 500, maximumProbabilityPerDecision: 0.2, minimumLevel: 3, maximumLevel: 8, minimumRisk: 0.4, naturalLookingOnly: true, deviationTypes: ['second-best-route'] });
    expect(eligibility({ ...base, enabled: false }, { tick: 120, level: 5, risk: 0.8, length: 12, occupancyPercent: 0.3 }).eligible).toBe(false);
    expect(eligibility(base, { tick: 99, level: 5, risk: 0.8, length: 12, occupancyPercent: 0.3 }).eligible).toBe(false);
    expect(eligibility(base, { tick: 501, level: 5, risk: 0.8, length: 12, occupancyPercent: 0.3 }).eligible).toBe(false);
    expect(eligibility(base, { tick: 120, level: 2, risk: 0.8, length: 12, occupancyPercent: 0.3 }).eligible).toBe(false);
    expect(eligibility(base, { tick: 120, level: 9, risk: 0.8, length: 12, occupancyPercent: 0.3 }).eligible).toBe(false);
    expect(eligibility(base, { tick: 120, level: 5, risk: 0.39, length: 12, occupancyPercent: 0.3 }).eligible).toBe(false);
    expect(eligibility(base, { tick: 120, level: 5, risk: 0.4, length: 12, occupancyPercent: 0.3 }).eligible).toBe(true);
  });

  it('validates probability bounds and all five operator presets', () => {
    const parse = get<(value: unknown) => any>('parseFailureConfig');
    const presets = Reflect.get(failure, 'FAILURE_PRESETS') as Record<string, unknown> | undefined;
    expect(() => parse?.({ enabled: true, minimumEligibleRunTicks: 0, maximumProbabilityPerDecision: 1.1, naturalLookingOnly: true, deviationTypes: ['second-best-route'] })).toThrow();
    expect(Object.keys(presets ?? {}).sort()).toEqual(['Balanced Stream', 'Chaos Stream', 'Demo', 'Record Attempt', 'Safe Stream'].sort());
    for (const value of Object.values(presets ?? {})) expect(() => parse?.(value)).not.toThrow();
  });
});
