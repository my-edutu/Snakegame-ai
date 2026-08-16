import { describe, expect, it } from 'vitest';
import * as failure from '../src/index.js';

describe('Phase 6 audit projection and causal attribution', () => {
  it('exports public projection and attribution APIs', () => {
    expect(typeof Reflect.get(failure, 'toPublicDeviationEvent')).toBe('function');
    expect(typeof Reflect.get(failure, 'attributeDeathToDeviation')).toBe('function');
  });

  it('never exposes hidden config, preset or probability settings publicly', () => {
    const project = Reflect.get(failure, 'toPublicDeviationEvent') as any;
    if (typeof project !== 'function') return;
    const audit = { id: 'dev-10-2', tick: 10, decisionSequence: 2, type: 'second-best-route', baselineDirection: 'right', appliedDirection: 'down', baselineScore: 100, appliedScore: 90, probability: 0.012, draw01: 0.004, presetName: 'Balanced Stream', hiddenConfig: { targetFailuresPerHour: 1.25 } };
    const publicEvent = project(audit);
    expect(publicEvent).toEqual({ id: 'dev-10-2', tick: 10, type: 'configured-deviation', direction: 'down' });
    expect(JSON.stringify(publicEvent)).not.toContain('probability');
    expect(JSON.stringify(publicEvent)).not.toContain('Balanced');
    expect(JSON.stringify(publicEvent)).not.toContain('targetFailuresPerHour');
  });

  it('attributes configured deviations only inside a bounded causal window', () => {
    const attribute = Reflect.get(failure, 'attributeDeathToDeviation') as any;
    if (typeof attribute !== 'function') return;
    const event = { id: 'dev-10-2', tick: 10, decisionSequence: 2, type: 'second-best-route', baselineDirection: 'right', appliedDirection: 'down', baselineScore: 100, appliedScore: 90, probability: 0.01, draw01: 0.001 };
    expect(attribute({ deathTick: 14, naturalCause: 'wall-collision', recentDeviations: [event], causalWindowTicks: 5 })).toEqual({ category: 'configured-deviation', naturalCause: 'wall-collision', deviationId: 'dev-10-2', contributory: true });
    expect(attribute({ deathTick: 16, naturalCause: 'wall-collision', recentDeviations: [event], causalWindowTicks: 5 })).toEqual({ category: 'natural', naturalCause: 'wall-collision', contributory: false });
  });
});
