import { describe, expect, it } from 'vitest';
import { createSceneGraph, destroySceneGraph } from '../src/scene.js';
import { SnakeDrawableManager } from '../src/draw-snake.js';
import { ItemDrawableManager } from '../src/draw-items.js';
import { EffectManager } from '../src/effects.js';
import { getQualityPreset } from '../src/quality.js';
import { getSnakeSkin } from '../src/skins.js';
import { computeViewportTransform } from '../src/viewport.js';

const viewport = computeViewportTransform({ canvasWidth: 1920, canvasHeight: 1080, boardWidth: 40, boardHeight: 30, safeInset: 32 });

describe('renderer drawable managers', () => {
  it('reuses snake drawables across 1000 same-length updates', () => {
    const scene = createSceneGraph();
    const manager = new SnakeDrawableManager(scene.layers.snake, scene.layers.trail);
    const skin = getSnakeSkin('galaxy').value;
    const quality = getQualityPreset('balanced').value;
    const body = Array.from({ length: 100 }, (_, index) => ({ x: index % 40, y: Math.floor(index / 40) }));
    for (let i = 0; i < 1000; i += 1) manager.update(body, 'right', viewport, skin, quality);
    expect(manager.drawableCount).toBe(100);
    expect(scene.layers.snake.children).toHaveLength(100);
    manager.destroy();
    destroySceneGraph(scene);
  });

  it('reuses surplus snake drawables after shrink/restart and supports skin switching', () => {
    const scene = createSceneGraph();
    const manager = new SnakeDrawableManager(scene.layers.snake, scene.layers.trail);
    manager.update(Array.from({ length: 20 }, (_, x) => ({ x, y: 1 })), 'right', viewport, getSnakeSkin('emerald').value, getQualityPreset('balanced').value);
    manager.update(Array.from({ length: 5 }, (_, x) => ({ x, y: 2 })), 'right', viewport, getSnakeSkin('inferno').value, getQualityPreset('balanced').value);
    expect(manager.drawableCount).toBe(20);
    expect(manager.visibleDrawableCount).toBe(5);
    expect(manager.activeSkinId).toBe('inferno');
    manager.destroy();
    destroySceneGraph(scene);
  });

  it('removes consumed items and reuses item graphics instead of growing forever', () => {
    const scene = createSceneGraph();
    const manager = new ItemDrawableManager(scene.layers.items, 16);
    manager.update([{ id: 'a', type: 'normal', position: { x: 3, y: 3 }, value: 1 }], viewport);
    manager.update([], viewport);
    manager.update([{ id: 'b', type: 'rare', position: { x: 4, y: 3 }, value: 2 }], viewport);
    expect(manager.createdCount).toBe(1);
    expect(manager.activeCount).toBe(1);
    manager.destroy();
    destroySceneGraph(scene);
  });

  it('caps transient effects by the active quality budget', () => {
    const scene = createSceneGraph();
    const quality = getQualityPreset('performance').value;
    const effects = new EffectManager(scene.layers.effects, quality.particleCapacity);
    for (let i = 0; i < quality.particleCapacity * 4; i += 1) effects.emit({ x: i % 40, y: 1 }, '#ffffff', 30);
    expect(effects.activeCount).toBeLessThanOrEqual(quality.particleCapacity);
    effects.destroy();
    destroySceneGraph(scene);
  });
});
