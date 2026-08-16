import { describe, expect, it } from 'vitest';
import { createBaselineConfig } from '../../engine/src/config.js';
import { createEngine } from '../../engine/src/runtime.js';
import * as ai from '../src/index.js';

describe('AI observation', () => {
  it('exposes createObservation before validating projection behavior', () => {
    const api = ai as Record<string, unknown>;
    expect(typeof api.createObservation).toBe('function');
  });

  it('projects search-relevant state without leaking mutable engine references', () => {
    const api = ai as Record<string, unknown>;
    expect(typeof api.createObservation).toBe('function');
    if (typeof api.createObservation !== 'function') return;

    const engine = createEngine(createBaselineConfig(42));
    const state = engine.getState();
    const createObservation = api.createObservation as (value: typeof state) => {
      board: { width: number; height: number };
      head: { x: number; y: number };
      tail: { x: number; y: number };
      body: Array<{ x: number; y: number }>;
      food: Array<{ id: string; position: { x: number; y: number } }>;
      tick: number;
      runId: string;
    };

    const observation = createObservation(state);
    expect(observation.board).toEqual({ width: 12, height: 8 });
    expect(observation.head).toEqual(state.snake.body[0]);
    expect(observation.tail).toEqual(state.snake.body.at(-1));
    expect(observation.body).toEqual(state.snake.body);
    expect(observation.food).toEqual(state.food);
    expect(observation.tick).toBe(0);
    expect(observation.runId).toBe(state.runId);

    observation.body[0]!.x = 999;
    observation.head.x = 998;
    if (observation.food[0]) observation.food[0].position.x = 997;

    expect(engine.getState().snake.body[0]).toEqual({ x: 3, y: 3 });
    expect(createObservation(state)).toEqual(createObservation(state));
  });
});
