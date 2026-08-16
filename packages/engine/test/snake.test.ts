import { describe, expect, it } from 'vitest';
import { computeNextHead, moveSnake, resolveDirection } from '../src/snake.js';

describe('snake rules', () => {
  it.each([
    ['up', { x: 2, y: 1 }],
    ['down', { x: 2, y: 3 }],
    ['left', { x: 1, y: 2 }],
    ['right', { x: 3, y: 2 }],
  ] as const)('moves one cell %s', (direction, expected) => {
    expect(computeNextHead({ x: 2, y: 2 }, direction)).toEqual(expected);
  });

  it('rejects an immediate reversal for a multi-segment snake', () => {
    expect(resolveDirection('right', 'left', 3)).toBe('right');
  });

  it('moves the head one cell and removes the tail when not growing', () => {
    const snake = { body: [{ x: 2, y: 2 }, { x: 1, y: 2 }], direction: 'right' as const, pendingGrowth: 0, alive: true };
    const next = computeNextHead(snake.body[0]!, 'right');
    expect(moveSnake(snake, next).body).toEqual([{ x: 3, y: 2 }, { x: 2, y: 2 }]);
  });

  it('preserves the tail and decrements pending growth while growing', () => {
    const snake = { body: [{ x: 2, y: 2 }, { x: 1, y: 2 }], direction: 'right' as const, pendingGrowth: 1, alive: true };
    const moved = moveSnake(snake, { x: 3, y: 2 });
    expect(moved.body).toEqual([{ x: 3, y: 2 }, { x: 2, y: 2 }, { x: 1, y: 2 }]);
    expect(moved.pendingGrowth).toBe(0);
  });
});
