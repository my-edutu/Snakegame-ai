import type { RenderFrame, RenderVec2 } from './types.js';

const NON_INTERPOLATED_LIFECYCLES = new Set<RenderFrame['lifecycle']>([
  'death',
  'run-summary',
  'countdown',
  'level-complete',
  'level-start',
  'new-game',
  'boot',
  'intro',
]);

const clamp01 = (value: number): number => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
const lerp = (a: number, b: number, alpha: number): number => a + (b - a) * alpha;

const isDiscontinuous = (previous: RenderFrame, current: RenderFrame): boolean => {
  if (NON_INTERPOLATED_LIFECYCLES.has(current.lifecycle)) return true;
  if (previous.level.id !== current.level.id) return true;
  if (previous.snake.body.length !== current.snake.body.length) return true;
  if (current.events.some((event) => event.label === 'PORTAL_TRANSIT')) return true;
  const previousHead = previous.snake.body[0];
  const currentHead = current.snake.body[0];
  if (!previousHead || !currentHead) return true;
  return Math.abs(previousHead.x - currentHead.x) + Math.abs(previousHead.y - currentHead.y) > 1;
};

export const interpolateRenderFrames = (
  previous: RenderFrame,
  current: RenderFrame,
  rawAlpha: number,
): RenderFrame => {
  if (isDiscontinuous(previous, current)) return current;
  const alpha = clamp01(rawAlpha);
  const body: RenderVec2[] = current.snake.body.map((position, index) => {
    const before = previous.snake.body[index];
    if (!before) return { ...position };
    return {
      x: lerp(before.x, position.x, alpha),
      y: lerp(before.y, position.y, alpha),
    };
  });

  return {
    ...current,
    snake: {
      direction: current.snake.direction,
      body,
    },
  };
};
