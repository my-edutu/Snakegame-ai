import { describe, expect, it } from 'vitest';
import { createBaselineConfig } from '../src/config.js';
import { createEngine } from '../src/runtime.js';

describe('lifecycle commands', () => {
  it('pauses without advancing authoritative gameplay', () => {
    const engine = createEngine(createBaselineConfig(5));
    engine.dispatch({ type: 'Pause' });
    const before = engine.getState();
    engine.step('down');
    expect(engine.getState()).toEqual(before);
  });

  it('resumes play', () => {
    const engine = createEngine(createBaselineConfig(5));
    engine.dispatch({ type: 'Pause' });
    engine.dispatch({ type: 'Resume' });
    expect(engine.getState().lifecycle).toBe('playing');
  });

  it('restarts deterministically from the configured seed', () => {
    const engine = createEngine(createBaselineConfig(77));
    const initial = engine.getState();
    engine.step('down');
    engine.dispatch({ type: 'RestartLevel' });
    expect(engine.getState()).toEqual(initial);
  });
});
