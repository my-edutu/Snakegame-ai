import type {
  RenderBounds,
  RenderEvent,
  RenderEventKind,
  RenderFrame,
  RenderFrameInput,
  RenderVec2,
} from './types.js';

const PUBLIC_EVENT_KINDS = new Set<RenderEventKind>([
  'near-death',
  'milestone',
  'record',
  'level-complete',
  'level-start',
  'death',
  'countdown',
  'strategy-change',
]);

export class RenderFrameValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RenderFrameValidationError';
  }
}

const assertFinite = (value: number, name: string): void => {
  if (!Number.isFinite(value)) throw new RenderFrameValidationError(`${name} must be finite`);
};

const assertPositive = (value: number, name: string): void => {
  assertFinite(value, name);
  if (value <= 0) throw new RenderFrameValidationError(`${name} must be greater than zero`);
};

const copyVec = (value: RenderVec2, name: string): RenderVec2 => {
  assertFinite(value.x, `${name}.x`);
  assertFinite(value.y, `${name}.y`);
  return { x: value.x, y: value.y };
};

const copyBounds = (bounds: RenderBounds): RenderBounds => {
  const copied = {
    minX: bounds.minX,
    minY: bounds.minY,
    maxX: bounds.maxX,
    maxY: bounds.maxY,
  };
  for (const [key, value] of Object.entries(copied)) assertFinite(value, `activeBounds.${key}`);
  if (copied.minX > copied.maxX || copied.minY > copied.maxY) {
    throw new RenderFrameValidationError('activeBounds must have ordered minimum and maximum values');
  }
  return copied;
};

const copyEvent = (event: RenderEvent): RenderEvent => {
  if (!PUBLIC_EVENT_KINDS.has(event.kind)) {
    throw new RenderFrameValidationError(`unsupported public render event kind: ${String(event.kind)}`);
  }
  assertFinite(event.tick, 'event.tick');
  return { id: event.id, kind: event.kind, label: event.label, tick: event.tick };
};

export const createRenderFrame = (input: RenderFrameInput): RenderFrame => {
  assertFinite(input.tick, 'tick');
  assertPositive(input.tickDurationMs, 'tickDurationMs');
  assertPositive(input.level.width, 'level.width');
  assertPositive(input.level.height, 'level.height');
  assertFinite(input.hud.score, 'hud.score');
  assertFinite(input.hud.length, 'hud.length');
  assertFinite(input.hud.occupancyPercent, 'hud.occupancyPercent');
  assertFinite(input.hud.risk, 'hud.risk');

  const body = input.snake.body.map((position, index) => copyVec(position, `snake.body[${index}]`));
  const items = input.items.map((item, index) => ({
    id: item.id,
    type: item.type,
    position: copyVec(item.position, `items[${index}].position`),
    value: item.value,
  }));
  for (const [index, item] of items.entries()) assertFinite(item.value, `items[${index}].value`);

  const obstacles = input.environment.obstacles.map((item, index) => ({
    id: item.id,
    position: copyVec(item.position, `obstacles[${index}].position`),
  }));
  const hazards = input.environment.hazards.map((item, index) => ({
    id: item.id,
    position: copyVec(item.position, `hazards[${index}].position`),
  }));
  const portals = input.environment.portals.map((portal, index) => ({
    id: portal.id,
    a: copyVec(portal.a, `portals[${index}].a`),
    b: copyVec(portal.b, `portals[${index}].b`),
  }));

  return {
    tick: input.tick,
    tickDurationMs: input.tickDurationMs,
    level: { ...input.level },
    lifecycle: input.lifecycle,
    snake: { direction: input.snake.direction, body },
    items,
    environment: {
      ...(input.environment.activeBounds ? { activeBounds: copyBounds(input.environment.activeBounds) } : {}),
      obstacles,
      hazards,
      portals,
    },
    hud: { ...input.hud },
    events: input.events.map(copyEvent),
  };
};
