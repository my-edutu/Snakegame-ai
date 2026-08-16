import { describe, expect, it } from 'vitest';
import { LEVELS } from '@snake/levels';
import * as simulation from '../src/index.js';

const get = (name: string) => Reflect.get(simulation, name) as any;

describe('Phase 7 autonomous session orchestration', () => {
  it('exports autonomous session APIs', () => {
    expect(typeof get('createAutonomousSession')).toBe('function');
    expect(typeof get('applyLevelResultToSession')).toBe('function');
    expect(typeof get('advanceAutonomousSession')).toBe('function');
    expect(typeof get('observeSessionDecision')).toBe('function');
  });

  it('applies completed and failed level results deterministically and resets run-scoped spectator state on fresh run', () => {
    const create = get('createAutonomousSession'); const apply = get('applyLevelResultToSession'); const advance = get('advanceAutonomousSession'); if (!create || !apply || !advance) return;
    const config = { levelCount: 20, restartDelayTicks: 2, celebrationTicks: 1, completionPolicy: 'immediate-advance' };
    const base = create(config);
    const completed = { levelId: 'level-01', levelNumber: 1, levelVersion: 1, levelCompleted: true, progression: { complete: true, goals: [] }, run: { seed: 1, terminalReason: 'simulation-cap', deathCause: null, ticksSurvived: 100, maxLength: 10, maxOccupancyPercent: 20, score: 200, foodConsumed: 5, strategyTicks: {}, strategyTransitions: [], averageRisk: 10, peakRisk: 20, totalDecisionNodes: 10, averageDecisionNodes: 1, peakDecisionNodes: 2, nearDeathCount: 0, hamiltonianEntries: 0, hamiltonianTicks: 0, terminalContext: { strategy: null, riskLevel: null, riskScore: 0, safeMoves: 0, summary: null }, levelReached: 1, levelCompleted: true } };
    const afterComplete = apply(base, completed, config);
    expect(afterComplete.lifecycle).toMatchObject({ currentLevel: 2, levelStreak: 1, phase: 'playing' });
    expect(afterComplete.milestoneEvents.length).toBeGreaterThan(0);
    const failed = { ...completed, levelNumber: 2, levelId: 'level-02', levelCompleted: false, run: { ...completed.run, terminalReason: 'death', deathCause: 'wall-collision', ticksSurvived: 40, levelCompleted: false } };
    const afterDeath = apply(afterComplete, failed, config);
    expect(afterDeath.lifecycle.phase).toBe('summary');
    expect(afterDeath.lastSummary.death.label).toBe('WALL IMPACT');
    let state = advance(afterDeath, { type: 'tick' }, config);
    state = advance(state, { type: 'tick' }, config);
    state = advance(state, { type: 'tick' }, config);
    expect(state.lifecycle).toMatchObject({ phase: 'playing', currentLevel: 1, runNumber: 2 });
    expect(state.lastSummary).toBeNull();
    expect(state.milestoneEvents).toEqual([]);
    expect(state.milestoneState.emittedKeys).toEqual([]);
    expect(state.nearDeaths).toEqual([]);
    expect(state.nearDeathState).toMatchObject({ lastEventTick: null, sequence: 0 });
  });

  it('integrates AI near-death evidence into session state and run summaries', () => {
    const create = get('createAutonomousSession'); const observe = get('observeSessionDecision'); const apply = get('applyLevelResultToSession'); if (!create || !observe || !apply) return;
    const config = { levelCount: 20, restartDelayTicks: 2, celebrationTicks: 1, completionPolicy: 'immediate-advance', nearDeathMinimumGapTicks: 20 };
    let state = create(config);
    state = observe(state, { tick: 10, safeMoves: 1, riskLevel: 'critical', riskScore: 93, summary: 'CRITICAL — 1 SAFE MOVE REMAINING' }, config);
    expect(state.nearDeaths).toHaveLength(1);
    state = observe(state, { tick: 15, safeMoves: 1, riskLevel: 'critical', riskScore: 94, summary: 'CRITICAL' }, config);
    expect(state.nearDeaths).toHaveLength(1);
    const failed = { levelId: 'level-01', levelNumber: 1, levelVersion: 1, levelCompleted: false, progression: { complete: false, goals: [] }, run: { seed: 1, terminalReason: 'death', deathCause: 'wall-collision', ticksSurvived: 40, maxLength: 10, maxOccupancyPercent: 20, score: 200, foodConsumed: 5, strategyTicks: {}, strategyTransitions: [], averageRisk: 10, peakRisk: 93, totalDecisionNodes: 10, averageDecisionNodes: 1, peakDecisionNodes: 2, nearDeathCount: 1, hamiltonianEntries: 0, hamiltonianTicks: 0, terminalContext: { strategy: null, riskLevel: 'critical', riskScore: 93, safeMoves: 1, summary: 'critical' }, levelReached: 1, levelCompleted: false } };
    state = apply(state, failed, config);
    expect(state.lastSummary.nearDeaths).toHaveLength(1);
  });

  it('observes AI decisions without changing baseline level simulation output', () => {
    const runWithPolicy = get('runLevelSimulationWithPolicy'); if (!runWithPolicy) return;
    const seen: any[] = [];
    const baseline = runWithPolicy(LEVELS[0], 123, { maxTicks: 40 });
    const observed = runWithPolicy(LEVELS[0], 123, { maxTicks: 40 }, undefined, (context: any) => seen.push({ tick: context.state.tick, safeMoves: context.decision.risk.contributors.safeMoves }));
    expect(observed).toEqual(baseline);
    expect(seen.length).toBeGreaterThan(0);
  });
});
