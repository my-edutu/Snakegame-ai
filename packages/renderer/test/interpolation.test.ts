import { describe, expect, it } from 'vitest';
import { interpolateRenderFrames } from '../src/interpolation.js';
import type { RenderFrame } from '../src/types.js';

const frame = (tick: number, headX: number, lifecycle: RenderFrame['lifecycle'] = 'playing'): RenderFrame => ({
  tick,
  tickDurationMs: 100,
  level: { id: 'level-01', name: 'Genesis', width: 12, height: 8, themeKey: 'neon-grid' },
  lifecycle,
  snake: {
    direction: 'right',
    body: [
      { x: headX, y: 4 },
      { x: headX - 1, y: 4 },
      { x: headX - 2, y: 4 },
    ],
  },
  items: [],
  environment: { obstacles: [], hazards: [], portals: [] },
  hud: { score: 0, length: 3, occupancyPercent: 3.125, risk: 10, strategy: 'hunt' },
  events: [],
});

describe('interpolateRenderFrames', () => {
  it('interpolates compatible body positions and clamps alpha', () => {
    const previous = frame(1, 3);
    const current = frame(2, 4);

    expect(interpolateRenderFrames(previous, current, -1).snake.body[0]).toEqual({ x: 3, y: 4 });
    expect(interpolateRenderFrames(previous, current, 0.5).snake.body[0]).toEqual({ x: 3.5, y: 4 });
    expect(interpolateRenderFrames(previous, current, 2).snake.body[0]).toEqual({ x: 4, y: 4 });
  });

  it('falls back to current geometry when segment counts are incompatible', () => {
    const previous = frame(1, 3);
    const current = { ...frame(2, 4), snake: { direction: 'right' as const, body: [...frame(2, 4).snake.body, { x: 1, y: 4 }] } };

    expect(interpolateRenderFrames(previous, current, 0.5).snake.body).toEqual(current.snake.body);
  });

  it('treats portal jumps as discontinuities instead of drawing across the board', () => {
    const previous = frame(1, 0);
    const current = {
      ...frame(2, 11),
      events: [{ id: 1, kind: 'strategy-change' as const, label: 'PORTAL_TRANSIT', tick: 2 }],
    };

    expect(interpolateRenderFrames(previous, current, 0.5).snake.body[0]).toEqual({ x: 11, y: 4 });
  });

  it.each(['death', 'run-summary', 'countdown', 'level-complete'] as const)(
    'bypasses normal interpolation during %s',
    (lifecycle) => {
      const previous = frame(1, 3);
      const current = frame(2, 4, lifecycle);
      expect(interpolateRenderFrames(previous, current, 0.5).snake.body).toEqual(current.snake.body);
    },
  );
});
