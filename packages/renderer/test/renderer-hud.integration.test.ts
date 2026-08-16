import { Container } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { createRenderFrame } from '../src/frame.js';
import { createHudSnapshot } from '../src/hud-model.js';
import { SnakeRenderer, type RendererHost, type RendererHostFactory } from '../src/renderer.js';
import type { HudSnapshotInput } from '../src/hud-types.js';

class FakeTicker {
  callbacks = new Set<(elapsedMs: number) => void>();
  add(callback: (elapsedMs: number) => void): void { this.callbacks.add(callback); }
  remove(callback: (elapsedMs: number) => void): void { this.callbacks.delete(callback); }
}

class FakeHost implements RendererHost {
  readonly stage = new Container();
  readonly ticker = new FakeTicker();
  resizeCalls = 0;
  destroyCalls = 0;
  resize(): void { this.resizeCalls += 1; }
  destroy(): void {
    this.destroyCalls += 1;
    if (!this.stage.destroyed) this.stage.destroy({ children: true });
  }
}

const frame = () => createRenderFrame({
  tick: 10,
  tickDurationMs: 100,
  level: { id: 'level-07', name: 'The Maze', width: 32, height: 18, themeKey: 'neon-grid' },
  lifecycle: 'playing',
  snake: { direction: 'right', body: [{ x: 3, y: 4 }, { x: 2, y: 4 }, { x: 1, y: 4 }] },
  items: [{ id: 'f', type: 'normal', position: { x: 8, y: 4 }, value: 1 }],
  environment: { obstacles: [], hazards: [], portals: [] },
  hud: { score: 4250, length: 84, occupancyPercent: 58.4, risk: 68, strategy: 'food-path-rejected' },
  events: [],
});

const richInput = (): HudSnapshotInput => ({
  level: { number: 7, name: 'The Maze', total: 20 },
  run: { number: 12, elapsedTicks: 1_250, tickDurationMs: 100, levelStreak: 4, lifecycle: 'playing', countdownTicksRemaining: 0 },
  primary: { score: 4_250, length: 84, occupancyPercent: 58.4, foodEaten: 81, safeMoves: 3, projectedMoves: 16 },
  risk: { score: 68, band: 'high' },
  strategy: { label: 'food-path-rejected', trapRiskPercent: 68, preservedEscapeRoutes: null, endgame: false, criticalSafeMoves: null },
  records: { bestOccupancyPercent: 77.2, highestLevel: 11, deaths: 8, totalGames: 11, highScore: 6_100, maxLength: 112, longestSurvivalTicks: 4_000 },
  recordTarget: { id: 'occupancy-record', label: 'ALL-TIME OCCUPANCY', current: 58.4, target: 77.2, unit: 'percent' },
  runSummary: null,
  emittedEventIds: [],
});

const countLabel = (root: Container, label: string): number => {
  let total = root.label === label ? 1 : 0;
  for (const child of root.children) {
    if (child instanceof Container) total += countLabel(child, label);
  }
  return total;
};

describe('SnakeRenderer Phase 9 HUD integration', () => {
  it('creates exactly one HUD root and reuses it across rich updates and presentation changes', async () => {
    const host = new FakeHost();
    const factory: RendererHostFactory = async () => host;
    const renderer = new SnakeRenderer({ hostFactory: factory });
    await renderer.init({ width: 1920, height: 1080 });

    renderer.renderFrame(frame(), createHudSnapshot(richInput()));
    const baseline = renderer.getMetrics();
    expect(countLabel(host.stage, 'livestream-hud-root')).toBe(1);
    expect(baseline.hudDisplayObjectCount).toBeGreaterThan(0);

    for (let i = 0; i < 100; i += 1) {
      const next = richInput();
      next.primary.score += i;
      renderer.renderFrame(frame(), createHudSnapshot(next));
    }
    renderer.resize(2560, 1440);
    renderer.setTheme('cosmic-void');
    renderer.setQuality('cinematic');

    expect(countLabel(host.stage, 'livestream-hud-root')).toBe(1);
    expect(renderer.getMetrics().hudDisplayObjectCount).toBe(baseline.hudDisplayObjectCount);
    renderer.destroy();
  });

  it('keeps legacy Phase 8 renderFrame calls working through a neutral HUD fallback', async () => {
    const host = new FakeHost();
    const renderer = new SnakeRenderer({ hostFactory: async () => host });
    await renderer.init({ width: 1920, height: 1080 });
    expect(() => renderer.renderFrame(frame())).not.toThrow();
    expect(countLabel(host.stage, 'livestream-hud-root')).toBe(1);
    expect(renderer.getMetrics().hudDisplayObjectCount).toBeGreaterThan(0);
    renderer.destroy();
  });

  it('cleans HUD resources during destruction', async () => {
    const host = new FakeHost();
    const renderer = new SnakeRenderer({ hostFactory: async () => host });
    await renderer.init({ width: 1920, height: 1080 });
    renderer.renderFrame(frame(), createHudSnapshot(richInput()));
    expect(countLabel(host.stage, 'livestream-hud-root')).toBe(1);
    renderer.destroy();
    expect(host.stage.destroyed).toBe(true);
    expect(host.ticker.callbacks.size).toBe(0);
  });
});
