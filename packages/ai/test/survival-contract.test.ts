import { describe, expect, it } from 'vitest';
import * as ai from '../src/index.js';
import { makeObservation } from './fixtures.js';

describe('Phase 3 survival reasoning contract', () => {
  it('exports the survival reasoning APIs', () => {
    const api = ai as Record<string, unknown>;
    for (const name of [
      'createSimulatedState', 'simulateMove', 'analyzeSpace', 'evaluateSurvivalLookahead',
      'createHamiltonianOrder', 'hamiltonianMovePenalty', 'assessRisk', 'selectStrategy',
      'decideSurvivalMove',
    ]) expect(typeof api[name], name).toBe('function');
  });

  it('models vacating-tail movement and food growth exactly', () => {
    const api = ai as any;
    if (typeof api.createSimulatedState !== 'function') return;
    const observation = makeObservation({
      head: { x: 2, y: 2 },
      tail: { x: 2, y: 1 },
      body: [{ x: 2, y: 2 }, { x: 2, y: 1 }],
      direction: 'right',
      pendingGrowth: 0,
    });
    const state = api.createSimulatedState(observation);
    const tailStep = api.simulateMove(state, 'up');
    expect(tailStep.legal).toBe(true);
    expect(tailStep.state.body).toEqual([{ x: 2, y: 1 }, { x: 2, y: 2 }]);

    const foodState = api.createSimulatedState(makeObservation({
      head: { x: 2, y: 2 }, tail: { x: 1, y: 2 },
      body: [{ x: 2, y: 2 }, { x: 1, y: 2 }], direction: 'right',
      food: [{ id: 'f', type: 'normal', value: 1, position: { x: 3, y: 2 } }],
    }));
    const foodStep = api.simulateMove(foodState, 'right');
    expect(foodStep.consumedFoodId).toBe('f');
    expect(foodStep.state.body).toHaveLength(3);
  });

  it('bounds lookahead by the configured node budget', () => {
    const api = ai as any;
    if (typeof api.evaluateSurvivalLookahead !== 'function') return;
    const state = api.createSimulatedState(makeObservation({ board: { width: 20, height: 20 } }));
    const result = api.evaluateSurvivalLookahead(state, { depth: 20, nodeBudget: 25 });
    expect(result.nodesEvaluated).toBeLessThanOrEqual(25);
    expect(result.budgetExhausted).toBe(true);
  });

  it('produces monotonic explainable risk', () => {
    const api = ai as any;
    if (typeof api.assessRisk !== 'function') return;
    const safe = api.assessRisk({ safeMoves: 4, reachableAreaRatio: 1, escapeRouteCount: 4, occupancyRatio: 0.1, bodyPressure: 0, trapProbability: 0, lookaheadFailure: 0, topologyPressure: 0 });
    const dangerous = api.assessRisk({ safeMoves: 1, reachableAreaRatio: 0.1, escapeRouteCount: 1, occupancyRatio: 0.9, bodyPressure: 1, trapProbability: 1, lookaheadFailure: 1, topologyPressure: 1 });
    expect(safe.score).toBeGreaterThanOrEqual(0);
    expect(dangerous.score).toBeLessThanOrEqual(100);
    expect(dangerous.score).toBeGreaterThan(safe.score);
    expect(dangerous.level).toBe('critical');
  });

  it('creates deterministic Hamiltonian order only for compatible rectangles', () => {
    const api = ai as any;
    if (typeof api.createHamiltonianOrder !== 'function') return;
    expect(api.createHamiltonianOrder(5, 5)).toBeNull();
    const order = api.createHamiltonianOrder(6, 5);
    expect(order.size).toBe(30);
    expect(new Set(order.indexByCell.values()).size).toBe(30);
    expect(api.createHamiltonianOrder(6, 5)).toEqual(order);
  });

  it('applies strategy hysteresis outside emergencies', () => {
    const api = ai as any;
    if (typeof api.selectStrategy !== 'function') return;
    const previous = { mode: 'explore', ticksInMode: 2 };
    const result = api.selectStrategy(previous, {
      emergency: false, allRisky: false, safeMoves: 3, riskScore: 20, occupancyRatio: 0.2,
      hamiltonianAvailable: false, hamiltonianPreservable: false, foodSafe: true,
      tailPreferred: false, expanding: false, recovered: false,
    }, 6);
    expect(result.mode).toBe('explore');
    expect(result.ticksInMode).toBe(3);
  });

  it('returns deep-equal survival decisions for identical inputs', () => {
    const api = ai as any;
    if (typeof api.decideSurvivalMove !== 'function') return;
    const observation = makeObservation({ food: [{ id: 'f', type: 'normal', value: 1, position: { x: 4, y: 2 } }] });
    const strategy = { mode: 'explore', ticksInMode: 0 };
    const config = { lookaheadDepth: 4, lookaheadNodeBudget: 100, minimumSafeAreaRatio: 0.25, highOccupancyThreshold: 0.72, strategyMinDwellTicks: 2 };
    const first = api.decideSurvivalMove(observation, strategy, config);
    expect(api.decideSurvivalMove(observation, strategy, config)).toEqual(first);
    expect(first.direction).not.toBeNull();
    expect(first.evaluations).toHaveLength(4);
  });
});
