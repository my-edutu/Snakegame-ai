import { describe, expect, it } from 'vitest';
import { createSceneGraph, destroySceneGraph, SCENE_LAYER_ORDER } from '../src/scene.js';
import { drawBoard } from '../src/draw-board.js';
import { drawEnvironment } from '../src/draw-environment.js';
import { getTheme } from '../src/themes.js';
import { computeViewportTransform } from '../src/viewport.js';

const viewport = computeViewportTransform({ canvasWidth: 1920, canvasHeight: 1080, boardWidth: 12, boardHeight: 8, safeInset: 32 });
const theme = getTheme('neon-grid').value;

describe('Pixi scene graph', () => {
  it('creates a stable exact z-order with one persistent container per layer', () => {
    const scene = createSceneGraph();
    expect(SCENE_LAYER_ORDER).toEqual([
      'background', 'grid', 'obstacles', 'hazardsPortals', 'items', 'trail', 'snake', 'effects', 'localEvents', 'debug',
    ]);
    expect(scene.root.children).toHaveLength(SCENE_LAYER_ORDER.length);
    expect(scene.root.children.map((child) => child.label)).toEqual(SCENE_LAYER_ORDER);
    destroySceneGraph(scene);
  });

  it('redraws board and environment without appending new layer roots', () => {
    const scene = createSceneGraph();
    for (let i = 0; i < 100; i += 1) {
      drawBoard(scene, viewport, theme, { minX: 0, minY: 0, maxX: 11, maxY: 7 });
      drawEnvironment(scene, viewport, theme, {
        obstacles: [{ id: 'wall', position: { x: 2, y: 2 } }],
        hazards: [{ id: 'danger', position: { x: 4, y: 4 } }],
        portals: [{ id: 'p', a: { x: 0, y: 0 }, b: { x: 11, y: 7 } }],
      });
    }
    expect(scene.root.children).toHaveLength(SCENE_LAYER_ORDER.length);
    expect(scene.layers.obstacles.children.length).toBe(1);
    expect(scene.layers.hazardsPortals.children.length).toBe(1);
    destroySceneGraph(scene);
  });

  it('allows repeated destroy safely', () => {
    const scene = createSceneGraph();
    destroySceneGraph(scene);
    expect(() => destroySceneGraph(scene)).not.toThrow();
  });
});
