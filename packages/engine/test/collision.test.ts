import { describe, expect, it } from 'vitest';
import { detectCollision } from '../src/snake.js';

describe('collision semantics', () => {
  it('detects a wall collision', () => {
    expect(detectCollision({ x: -1, y: 1 }, [{ x: 0, y: 1 }], 3, 3, true)).toBe('wall-collision');
  });

  it('detects a self collision', () => {
    const body = [{ x: 2, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }];
    expect(detectCollision({ x: 1, y: 1 }, body, 4, 4, true)).toBe('self-collision');
  });

  it('allows entering the current tail cell when that tail vacates', () => {
    const body = [{ x: 1, y: 1 }, { x: 1, y: 2 }, { x: 0, y: 2 }, { x: 0, y: 1 }];
    expect(detectCollision({ x: 0, y: 1 }, body, 3, 3, true)).toBeNull();
  });

  it('treats the tail as occupied when growth prevents it from vacating', () => {
    const body = [{ x: 1, y: 1 }, { x: 1, y: 2 }, { x: 0, y: 2 }, { x: 0, y: 1 }];
    expect(detectCollision({ x: 0, y: 1 }, body, 3, 3, false)).toBe('self-collision');
  });
});
