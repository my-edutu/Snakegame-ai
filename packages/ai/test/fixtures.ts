import type { AiObservation } from '../src/observation.js';
import type { Direction, Vec2 } from '@snake/shared';

export function makeObservation(overrides: Partial<AiObservation> = {}): AiObservation {
  const head: Vec2 = { x: 2, y: 2 };
  const body = [head];
  return {
    board: { width: 5, height: 5 },
    head: { ...head },
    tail: { ...head },
    body: body.map((cell) => ({ ...cell })),
    direction: 'right' as Direction,
    food: [],
    obstacles: [],
    hazards: [],
    tick: 0,
    runId: 'test-run',
    ...overrides,
  };
}
