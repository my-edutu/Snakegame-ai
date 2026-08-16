import { Container } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { createHudDrawableManager } from '../src/draw-hud.js';
import { computeHudLayout } from '../src/hud-layout.js';
import { createHudSnapshot } from '../src/hud-model.js';
import { getQualityPreset } from '../src/quality.js';
import { getTheme } from '../src/themes.js';
import type { HudSnapshotInput, ViewportTransform } from '../src/index.js';

const viewport: ViewportTransform = {
  canvasWidth: 1920,
  canvasHeight: 1080,
  boardWidth: 32,
  boardHeight: 18,
  cellSize: 43.2,
  boardPixelWidth: 777.6,
  boardPixelHeight: 777.6,
  offsetX: 571.2,
  offsetY: 151.2,
  safeInsetPx: 32,
  logicalScale: 1,
};

const input = (): HudSnapshotInput => ({
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

const setup = () => {
  const root = new Container({ label: 'hud-test-root' });
  const manager = createHudDrawableManager(root);
  const layout = computeHudLayout(1920, 1080, viewport);
  const theme = getTheme('neon-grid').value;
  const quality = getQualityPreset('balanced').value;
  return { root, manager, layout, theme, quality };
};

describe('HudDrawableManager', () => {
  it('reuses a fixed drawable set through 5000 ordinary updates', () => {
    const { root, manager, layout, theme, quality } = setup();
    const first = createHudSnapshot(input());
    manager.update(first, layout, theme, quality);
    const baseline = manager.getResourceCounts();

    for (let i = 0; i < 5_000; i += 1) {
      const next = input();
      next.primary.score += i;
      next.primary.length += i % 3;
      next.risk.score = i % 101;
      next.risk.band = next.risk.score >= 85 ? 'critical' : next.risk.score >= 60 ? 'high' : next.risk.score >= 30 ? 'guarded' : 'low';
      manager.update(createHudSnapshot(next), layout, theme, quality);
    }

    expect(manager.getResourceCounts()).toEqual(baseline);
    expect(root.children).toHaveLength(1);
    manager.destroy();
  });

  it('renders risk with numeric and textual meaning rather than color alone', () => {
    const { manager, layout, theme, quality } = setup();
    const next = input();
    next.risk = { score: 91, band: 'critical' };
    manager.update(createHudSnapshot(next), layout, theme, quality);
    const presentation = manager.getPresentationSnapshot();
    expect(presentation.riskText).toContain('CRITICAL');
    expect(presentation.riskText).toContain('91%');
    manager.destroy();
  });

  it('switches between playing, summary, countdown, and paused states without rebuilding roots', () => {
    const { root, manager, layout, theme, quality } = setup();
    const normal = input();
    manager.update(createHudSnapshot(normal), layout, theme, quality);
    const baseline = manager.getResourceCounts();

    const summary = input();
    summary.run.lifecycle = 'summary';
    summary.runSummary = { score: 5_100, maxLength: 104, maxOccupancyPercent: 74, foodEaten: 101, ticksSurvived: 3_200, levelReached: 9, newRecords: ['High score'] };
    manager.update(createHudSnapshot(summary), layout, theme, quality);
    expect(manager.getPresentationSnapshot().centerText).toContain('RUN SUMMARY');

    const countdown = input();
    countdown.run.lifecycle = 'restart-countdown';
    countdown.run.countdownTicksRemaining = 21;
    manager.update(createHudSnapshot(countdown), layout, theme, quality);
    expect(manager.getPresentationSnapshot().centerText).toContain('RESTARTING');

    const paused = input();
    paused.run.lifecycle = 'paused';
    manager.update(createHudSnapshot(paused), layout, theme, quality);
    expect(manager.getPresentationSnapshot().centerText).toContain('PAUSED');

    expect(manager.getResourceCounts()).toEqual(baseline);
    expect(root.children).toHaveLength(1);
    manager.destroy();
  });

  it('destroys idempotently and removes its single HUD root', () => {
    const { root, manager } = setup();
    expect(root.children).toHaveLength(1);
    manager.destroy();
    manager.destroy();
    expect(root.children).toHaveLength(0);
  });
});
