import { describe, expect, it } from 'vitest';
import { createBaselineConfig, createEngine, type EngineConfig } from '../src/index.js';

const config = (overrides: Partial<EngineConfig> & Record<string, unknown> = {}): EngineConfig => ({
  ...createBaselineConfig(7),
  initialSnake: { body: [{ x: 1, y: 1 }, { x: 0, y: 1 }], direction: 'left' },
  ...overrides,
} as EngineConfig);

describe('Phase 5 generic environment mechanics', () => {
  it('wraps at the board edge when wrap is enabled', () => {
    const engine = createEngine(config({
      board: { width: 4, height: 3 },
      initialSnake: { body: [{ x: 0, y: 1 }, { x: 1, y: 1 }], direction: 'left' },
      wrap: true,
    }));
    engine.step('left');
    expect(engine.getState().snake.body[0]).toEqual({ x: 3, y: 1 });
  });

  it('dies on static obstacles and hazards', () => {
    const obstacle = createEngine(config({ obstacles: [{ id: 'wall', position: { x: 0, y: 1 } }] }));
    obstacle.step('left');
    expect(obstacle.getState().lastDeath?.cause).toBe('obstacle-collision');

    const hazard = createEngine(config({ hazards: [{ id: 'laser', position: { x: 0, y: 1 } }] }));
    hazard.step('left');
    expect(hazard.getState().lastDeath?.cause).toBe('hazard-collision');
  });

  it('resolves exactly one portal hop per move', () => {
    const engine = createEngine(config({
      board: { width: 6, height: 4 },
      initialSnake: { body: [{ x: 1, y: 1 }, { x: 0, y: 1 }], direction: 'right' },
      portals: [{ id: 'p', a: { x: 2, y: 1 }, b: { x: 5, y: 3 } }],
    }));
    engine.step('right');
    expect(engine.getState().snake.body[0]).toEqual({ x: 5, y: 3 });
  });

  it('enforces active bounds for shrinking arenas', () => {
    const engine = createEngine(config({ activeBounds: { minX: 1, minY: 0, maxX: 3, maxY: 2 } }));
    engine.step('left');
    expect(engine.getState().lastDeath?.cause).toBe('bounds-collision');
  });

  it('applies typed food growth and score deltas', () => {
    const engine = createEngine(config({
      board: { width: 4, height: 3 },
      initialSnake: { body: [{ x: 1, y: 1 }, { x: 0, y: 1 }], direction: 'right' },
      food: [{ id: 'bonus', type: 'bonus', position: { x: 2, y: 1 }, value: 25, growthDelta: 2, scoreDelta: 25 }],
    }));
    engine.step('right');
    const state = engine.getState();
    expect(state.score.score).toBe(25);
    expect(state.snake.pendingGrowth).toBe(1);
  });
});
