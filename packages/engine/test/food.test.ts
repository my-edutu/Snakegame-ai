import { describe, expect, it } from 'vitest';
import { createRng } from '../src/rng.js';
import { spawnFood } from '../src/food.js';

describe('food spawning', () => {
  it('never spawns on the snake', () => {
    const snake = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }];
    const result = spawnFood(4, 2, snake, createRng(7));
    expect(result.kind).toBe('spawned');
    if (result.kind === 'spawned') expect(snake).not.toContainEqual(result.food.position);
  });

  it('reports board-filled instead of looping when there is no free cell', () => {
    expect(spawnFood(1, 1, [{ x: 0, y: 0 }], createRng(1))).toEqual({ kind: 'board-filled' });
  });
});
