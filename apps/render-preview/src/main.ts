import {
  SnakeRenderer,
  createRenderFrame,
  listQualityPresets,
  listSnakeSkins,
  listThemes,
  type RenderDirection,
  type RenderFrame,
} from '@snake/renderer';
import { PREVIEW_VIEWPORTS, type PreviewViewportId } from './config.js';
import './style.css';

const BOARD_WIDTH = 40;
const BOARD_HEIGHT = 30;
const TICK_MS = 92;

const path: readonly { x: number; y: number }[] = Array.from({ length: BOARD_HEIGHT }, (_, y) =>
  Array.from({ length: BOARD_WIDTH }, (_, x) => ({ x: y % 2 === 0 ? x : BOARD_WIDTH - 1 - x, y })),
).flat();

const stage = document.querySelector<HTMLElement>('#stage');
if (!stage) throw new Error('preview stage mount is missing');

const skinSelect = document.querySelector<HTMLSelectElement>('#skin');
const themeSelect = document.querySelector<HTMLSelectElement>('#theme');
const qualitySelect = document.querySelector<HTMLSelectElement>('#quality');
const viewportSelect = document.querySelector<HTMLSelectElement>('#viewport');
const riskCopy = document.querySelector<HTMLElement>('#risk-copy');
const strategyCopy = document.querySelector<HTMLElement>('#strategy-copy');
if (!skinSelect || !themeSelect || !qualitySelect || !viewportSelect) throw new Error('preview controls are missing');

const populate = <T extends string>(
  select: HTMLSelectElement,
  values: readonly { id: T; name: string }[],
  selected: T,
): void => {
  select.replaceChildren(...values.map(({ id, name }) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = name;
    option.selected = id === selected;
    return option;
  }));
};

populate(skinSelect, listSnakeSkins(), 'galaxy');
populate(themeSelect, listThemes(), 'neon-grid');
populate(qualitySelect, listQualityPresets(), 'balanced');
populate(
  viewportSelect,
  Object.entries(PREVIEW_VIEWPORTS).map(([id, size]) => ({
    id: id as PreviewViewportId,
    name: `${id.toUpperCase()} · ${size.width}×${size.height}`,
  })),
  '1080p',
);

const selectedViewport = (): { width: number; height: number } =>
  PREVIEW_VIEWPORTS[viewportSelect.value as PreviewViewportId] ?? PREVIEW_VIEWPORTS['1080p'];

const directionBetween = (
  a: { x: number; y: number },
  b: { x: number; y: number },
): RenderDirection => {
  if (b.x > a.x) return 'right';
  if (b.x < a.x) return 'left';
  if (b.y > a.y) return 'down';
  return 'up';
};

const createDemoFrame = (tick: number): RenderFrame => {
  const headIndex = (86 + tick) % path.length;
  const snakeLength = 42 + Math.floor((tick % 420) / 28);
  const body = Array.from(
    { length: snakeLength },
    (_, offset) => path[(headIndex - offset + path.length) % path.length]!,
  );
  const previousHead = path[(headIndex - 1 + path.length) % path.length]!;
  const head = path[headIndex]!;
  const risk = Math.round(26 + 62 * (0.5 + 0.5 * Math.sin(tick / 27)));
  const strategy = risk > 78 ? 'ESCAPE ROUTE' : risk > 58 ? 'SPACE PRESERVATION' : 'SAFE FOOD PATH';
  if (riskCopy) riskCopy.textContent = `${risk}%`;
  if (strategyCopy) strategyCopy.textContent = strategy;

  const event = tick > 0 && tick % 120 === 0
    ? [{
        id: tick,
        kind: risk > 70 ? 'near-death' as const : 'milestone' as const,
        label: risk > 70 ? 'CLOSE CALL' : '25% BOARD FILLED',
        tick,
      }]
    : [];

  return createRenderFrame({
    tick,
    tickDurationMs: TICK_MS,
    level: {
      id: 'level-08',
      name: 'The Maze',
      width: BOARD_WIDTH,
      height: BOARD_HEIGHT,
      themeKey: themeSelect.value,
    },
    lifecycle: 'playing',
    snake: { direction: directionBetween(previousHead, head), body },
    items: [
      { id: 'food-normal', type: 'normal', position: path[(headIndex + 67) % path.length]!, value: 1 },
      ...(tick % 150 < 70
        ? [{ id: 'food-rare', type: 'rare', position: path[(headIndex + 171) % path.length]!, value: 3 }]
        : []),
    ],
    environment: {
      activeBounds: { minX: 1, minY: 1, maxX: 38, maxY: 28 },
      obstacles: [
        { id: 'w1', position: { x: 11, y: 7 } },
        { id: 'w2', position: { x: 11, y: 8 } },
        { id: 'w3', position: { x: 11, y: 9 } },
        { id: 'w4', position: { x: 27, y: 19 } },
        { id: 'w5', position: { x: 28, y: 19 } },
        { id: 'w6', position: { x: 29, y: 19 } },
      ],
      hazards: [
        { id: 'h1', position: { x: 20, y: 15 } },
        { id: 'h2', position: { x: 32, y: 5 } },
      ],
      portals: [{ id: 'portal-pair', a: { x: 4, y: 24 }, b: { x: 35, y: 4 } }],
    },
    hud: {
      score: 12_400 + tick * 7,
      length: snakeLength,
      occupancyPercent: (snakeLength / (BOARD_WIDTH * BOARD_HEIGHT)) * 100,
      risk,
      strategy,
    },
    events: event,
  });
};

const bootPreview = async (): Promise<void> => {
  stage.dataset.rendererState = 'initializing';
  const renderer = new SnakeRenderer({
    skin: 'galaxy',
    theme: 'neon-grid',
    quality: 'balanced',
    safeInset: 46,
  });

  try {
    const initial = selectedViewport();
    await renderer.init({
      width: initial.width,
      height: initial.height,
      mount: stage,
      resolution: 1,
    });

    skinSelect.addEventListener('change', () => renderer.setSkin(skinSelect.value));
    themeSelect.addEventListener('change', () => renderer.setTheme(themeSelect.value));
    qualitySelect.addEventListener('change', () => renderer.setQuality(qualitySelect.value));
    viewportSelect.addEventListener('change', () => {
      const next = selectedViewport();
      renderer.resize(next.width, next.height);
    });

    let tick = 1;
    renderer.renderFrame(createDemoFrame(tick));
    const timer = window.setInterval(() => {
      tick += 1;
      renderer.renderFrame(createDemoFrame(tick));
    }, TICK_MS);

    stage.dataset.rendererState = 'ready';
    window.addEventListener('pagehide', () => {
      window.clearInterval(timer);
      renderer.destroy();
    }, { once: true });
  } catch (error) {
    renderer.destroy();
    throw error;
  }
};

void bootPreview().catch((error: unknown) => {
  stage.dataset.rendererState = 'error';
  console.error('AI Snake renderer preview failed to start', error);
});
