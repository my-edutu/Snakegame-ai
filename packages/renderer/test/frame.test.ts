import { describe, expect, it } from 'vitest';
import { createRenderFrame, RenderFrameValidationError } from '../src/frame.js';

const baseInput = () => ({
  tick: 42,
  tickDurationMs: 100,
  level: { id: 'level-01', name: 'Genesis', width: 12, height: 8, themeKey: 'neon-grid' },
  lifecycle: 'playing' as const,
  snake: {
    direction: 'right' as const,
    body: [
      { x: 3, y: 4 },
      { x: 2, y: 4 },
      { x: 1, y: 4 },
    ],
  },
  items: [
    { id: 'food-1', type: 'normal', position: { x: 8, y: 4 }, value: 1 },
  ],
  environment: {
    activeBounds: { minX: 0, minY: 0, maxX: 11, maxY: 7 },
    obstacles: [{ id: 'wall-1', position: { x: 6, y: 2 } }],
    hazards: [{ id: 'hazard-1', position: { x: 7, y: 2 } }],
    portals: [{ id: 'portal-a', a: { x: 0, y: 0 }, b: { x: 11, y: 7 } }],
  },
  hud: {
    score: 120,
    length: 3,
    occupancyPercent: 3.125,
    risk: 46,
    strategy: 'tail-follow',
  },
  events: [
    { id: 10, kind: 'near-death' as const, label: 'CLOSE CALL', tick: 42 },
  ],
});

describe('createRenderFrame', () => {
  it('projects detached immutable presentation data', () => {
    const input = baseInput();
    const frame = createRenderFrame(input);

    expect(frame.tick).toBe(42);
    expect(frame.snake.body).toEqual(input.snake.body);
    expect(frame.items[0]?.position).toEqual({ x: 8, y: 4 });
    expect(frame.events).toEqual([{ id: 10, kind: 'near-death', label: 'CLOSE CALL', tick: 42 }]);

    input.snake.body[0]!.x = 99;
    input.items[0]!.position.x = 99;
    input.environment.portals[0]!.a.x = 99;

    expect(frame.snake.body[0]).toEqual({ x: 3, y: 4 });
    expect(frame.items[0]?.position).toEqual({ x: 8, y: 4 });
    expect(frame.environment.portals[0]?.a).toEqual({ x: 0, y: 0 });
  });

  it('rejects non-finite or impossible geometry before rendering', () => {
    const input = baseInput();
    input.level.width = Number.NaN;

    expect(() => createRenderFrame(input)).toThrow(RenderFrameValidationError);
  });

  it('rejects private or unsupported spectator event kinds', () => {
    const input = baseInput();
    input.events = [
      { id: 11, kind: 'private-failure-config' as never, label: 'hidden', tick: 42 },
    ];

    expect(() => createRenderFrame(input)).toThrow(RenderFrameValidationError);
  });
});
