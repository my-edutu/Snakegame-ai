import { describe, expect, it } from 'vitest';
import { createBaselineConfig } from '../../engine/src/config.js';
import { createEngine } from '../../engine/src/runtime.js';
import * as ai from '../src/index.js';

describe('AI observation', () => {
  it('exposes createObservation', () => {
    expect(typeof (ai as Record<string, unknown>).createObservation).toBe('function');
  });

  it('projects search-relevant state without leaking mutable engine references', () => {
    const engine = createEngine(createBaselineConfig(42));
    const state = engine.getState();
    const observation = (ai as any).createObservation(state);

    expect(observation.board).toEqual({ width: 12, height: 8 });
    expect(observation.head).toEqual(state.snake.body[0]);
    expect(observation.tail).toEqual(state.snake.body.at(-1));
    expect(observation.body).toEqual(state.snake.body);
    expect(observation.food).toEqual(state.food);
    expect(observation.tick).toBe(0);
    expect(observation.runId).toBe(state.runId);

    observation.body[0].x = 999;
    observation.head.x = 998;
    if (observation.food[0]) observation.food[0].position.x = 997;

    expect(engine.getState().snake.body[0]).toEqual({ x: 3, y: 3 });
  });

  it('deeply detaches nested arrays and positions in both mutation directions', () => {
    const engine = createEngine(createBaselineConfig(73));
    const source = engine.getState() as any;
    source.obstacles = [{ id: 'o1', position: { x: 8, y: 2 } }];
    source.hazards = [{ id: 'h1', position: { x: 9, y: 2 } }];
    source.food = [{ id: 'f1', type: 'normal', position: { x: 10, y: 2 }, value: 1 }];

    const observation = (ai as any).createObservation(source);
    const frozenSnapshot = JSON.parse(JSON.stringify(observation));

    source.snake.body[0].x = 77;
    source.food[0].position.x = 76;
    source.obstacles[0].position.x = 75;
    source.hazards[0].position.x = 74;
    expect(observation).toEqual(frozenSnapshot);

    observation.body[0].x = 66;
    observation.head.x = 65;
    observation.tail.x = 64;
    observation.food[0].position.x = 63;
    observation.obstacles[0].position.x = 62;
    observation.hazards[0].position.x = 61;

    expect(source.snake.body[0].x).toBe(77);
    expect(source.food[0].position.x).toBe(76);
    expect(source.obstacles[0].position.x).toBe(75);
    expect(source.hazards[0].position.x).toBe(74);
  });
});
