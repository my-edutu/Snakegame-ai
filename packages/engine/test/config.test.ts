import { describe, expect, it } from 'vitest';
import { createBaselineConfig, createEngine, EngineConfigError } from '../src/index.js';

describe('engine configuration validation', () => {
  it('rejects non-positive board dimensions', () => {
    const base = createBaselineConfig(1);
    expect(() => createEngine({ ...base, board: { width: 0, height: 8 } })).toThrow(EngineConfigError);
  });

  it('rejects duplicate initial snake coordinates', () => {
    const base = createBaselineConfig(1);
    expect(() => createEngine({
      ...base,
      initialSnake: {
        ...base.initialSnake,
        body: [{ x: 2, y: 2 }, { x: 2, y: 2 }],
      },
    })).toThrow(/overlaps itself/i);
  });

  it('rejects initial snake coordinates outside the board', () => {
    const base = createBaselineConfig(1);
    expect(() => createEngine({
      ...base,
      initialSnake: {
        ...base.initialSnake,
        body: [{ x: 99, y: 2 }],
      },
    })).toThrow(/outside the board/i);
  });

  it('rejects invalid deterministic parameters', () => {
    const base = createBaselineConfig(1);
    expect(() => createEngine({ ...base, seed: 1.5 })).toThrow(/seed must be an integer/i);
    expect(() => createEngine({ ...base, growthPerFood: -1 })).toThrow(/growthPerFood/i);
    expect(() => createEngine({ ...base, scorePerFood: Number.POSITIVE_INFINITY })).toThrow(/scorePerFood/i);
  });
});
