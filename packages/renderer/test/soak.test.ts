import { Container } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { SnakeRenderer, type RendererHost } from '../src/renderer.js';
import { createRenderFrame } from '../src/frame.js';

class SoakTicker {
  callbacks = new Set<(elapsedMs: number) => void>();
  add(callback: (elapsedMs: number) => void): void { this.callbacks.add(callback); }
  remove(callback: (elapsedMs: number) => void): void { this.callbacks.delete(callback); }
}

class SoakHost implements RendererHost {
  readonly stage = new Container();
  readonly ticker = new SoakTicker();
  resize(): void {}
  destroy(): void { this.stage.destroy({ children: true }); }
}

const makeFrame = (tick: number) => createRenderFrame({
  tick,
  tickDurationMs: 100,
  level: { id: `level-${(tick % 20) + 1}`, name: 'Soak', width: 40, height: 30, themeKey: 'neon-grid' },
  lifecycle: tick % 997 === 0 ? 'level-complete' : tick % 503 === 0 ? 'death' : 'playing',
  snake: {
    direction: 'right',
    body: Array.from({ length: 12 + (tick % 20) }, (_, i) => ({ x: (tick + i) % 40, y: Math.floor(i / 40) + 10 })),
  },
  items: [{ id: `food-${tick % 7}`, type: tick % 11 === 0 ? 'rare' : 'normal', position: { x: tick % 40, y: (tick * 3) % 30 }, value: 1 }],
  environment: { obstacles: [], hazards: [], portals: [] },
  hud: { score: tick, length: 12 + (tick % 20), occupancyPercent: 10, risk: tick % 100, strategy: 'survival' },
  events: tick % 250 === 0 ? [{ id: tick, kind: 'milestone', label: 'MILESTONE', tick }] : [],
});

describe('renderer production soak', () => {
  it('keeps resources bounded through 50000 presentation updates and style changes', async () => {
    const host = new SoakHost();
    const renderer = new SnakeRenderer({ hostFactory: async () => host });
    await renderer.init({ width: 1920, height: 1080 });

    const skins = ['emerald', 'neon', 'inferno', 'galaxy', 'gold', 'rainbow', 'void'];
    const themes = ['neon-grid', 'digital-forest', 'volcano', 'arctic', 'cyber-city', 'desert', 'deep-ocean', 'space', 'matrix', 'ancient-temple', 'cosmic-void'];
    const qualities = ['performance', 'balanced', 'cinematic'];

    for (let tick = 1; tick <= 50_000; tick += 1) {
      if (tick % 1000 === 0) {
        renderer.setSkin(skins[(tick / 1000) % skins.length]!);
        renderer.setTheme(themes[(tick / 1000) % themes.length]!);
        renderer.setQuality(qualities[(tick / 1000) % qualities.length]!);
      }
      renderer.renderFrame(makeFrame(tick));
    }

    const metrics = renderer.getMetrics();
    expect(metrics.snakeDrawableCount).toBeLessThanOrEqual(31);
    expect(metrics.itemDrawableCount).toBeLessThanOrEqual(16);
    expect(metrics.eventCount).toBeLessThanOrEqual(32);
    expect(metrics.effectActiveCount).toBeLessThanOrEqual(512);
    expect(host.stage.children).toHaveLength(1);

    renderer.destroy();
    expect(host.ticker.callbacks.size).toBe(0);
  }, 30_000);
});
