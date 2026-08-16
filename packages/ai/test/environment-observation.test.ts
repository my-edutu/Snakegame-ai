import { describe, expect, it } from 'vitest';
import { createEngine, createBaselineConfig } from '@snake/engine';
import { createObservation } from '../src/index.js';

describe('Phase 5 environment observation', () => {
  it('exposes wrap, portals and active bounds generically', () => {
    const engine = createEngine({
      ...createBaselineConfig(9),
      board: { width: 8, height: 6 },
      wrap: true,
      portals: [{ id: 'p', a: { x: 5, y: 1 }, b: { x: 6, y: 4 } }],
      activeBounds: { minX: 1, minY: 1, maxX: 6, maxY: 4 },
    });
    const observation = createObservation(engine.getState());
    expect(Reflect.get(observation, 'wrap')).toBe(true);
    expect(Reflect.get(observation, 'portals')).toEqual([{ id: 'p', a: { x: 5, y: 1 }, b: { x: 6, y: 4 } }]);
    expect(Reflect.get(observation, 'activeBounds')).toEqual({ minX: 1, minY: 1, maxX: 6, maxY: 4 });
  });
});
