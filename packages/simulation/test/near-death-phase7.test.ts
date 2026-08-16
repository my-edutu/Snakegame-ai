import { describe, expect, it } from 'vitest';
import * as simulation from '../src/index.js';

const get = (name: string) => Reflect.get(simulation, name) as any;

describe('Phase 7 near-death events', () => {
  it('exports near-death APIs', () => {
    expect(typeof get('createNearDeathState')).toBe('function');
    expect(typeof get('detectNearDeathEvent')).toBe('function');
  });

  it('uses AI risk evidence and rate limits repeated events', () => {
    const create = get('createNearDeathState'); const detect = get('detectNearDeathEvent');
    if (!create || !detect) return;
    const evidence = { tick: 50, safeMoves: 1, riskLevel: 'critical', riskScore: 92, summary: 'CRITICAL — 1 SAFE MOVE REMAINING' };
    const first = detect(create(), evidence, { minimumGapTicks: 30 });
    expect(first.event).toMatchObject({ tick: 50, type: 'near-death', safeMoves: 1, riskLevel: 'critical', riskScore: 92 });
    expect(detect(first.state, { ...evidence, tick: 60 }, { minimumGapTicks: 30 }).event).toBeNull();
    expect(detect(first.state, { ...evidence, tick: 81 }, { minimumGapTicks: 30 }).event).not.toBeNull();
  });

  it('does not emit for ordinary low-risk decisions', () => {
    const create = get('createNearDeathState'); const detect = get('detectNearDeathEvent');
    if (!create || !detect) return;
    expect(detect(create(), { tick: 1, safeMoves: 3, riskLevel: 'low', riskScore: 10, summary: 'stable' }, { minimumGapTicks: 10 }).event).toBeNull();
  });
});
