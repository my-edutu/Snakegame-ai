import { describe, expect, it } from 'vitest';
import { createBaselineConfig, createEngine, restoreEngine } from '../src/index.js';

describe('runtime isolation', () => {
  it('does not expose mutable authoritative state through getState', () => {
    const engine = createEngine(createBaselineConfig(17));
    const external = engine.getState();
    const originalHead = engine.getState().snake.body[0];

    (external.snake.body as { x: number; y: number }[])[0] = { x: 999, y: 999 };

    expect(engine.getState().snake.body[0]).toEqual(originalHead);
  });

  it('does not expose mutable authoritative state through snapshots', () => {
    const engine = createEngine(createBaselineConfig(18));
    const snapshot = engine.snapshot();
    const originalHead = engine.getState().snake.body[0];

    (snapshot.state.snake.body as { x: number; y: number }[])[0] = { x: 999, y: 999 };

    expect(engine.getState().snake.body[0]).toEqual(originalHead);
  });

  it('restores from a JSON round-tripped snapshot without sharing references', () => {
    const source = createEngine(createBaselineConfig(19));
    source.step('right');
    const serialized = JSON.stringify(source.snapshot());
    const restored = restoreEngine(JSON.parse(serialized));
    const restoredState = restored.getState();

    expect(restoredState).toEqual(source.getState());
    (restoredState.snake.body as { x: number; y: number }[])[0] = { x: 777, y: 777 };
    expect(restored.getState()).toEqual(source.getState());
  });
});
