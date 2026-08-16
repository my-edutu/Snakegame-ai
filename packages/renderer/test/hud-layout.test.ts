import { describe, expect, it } from 'vitest';
import { computeHudLayout } from '../src/hud-layout.js';
import type { ViewportTransform } from '../src/types.js';

const viewport = (canvasWidth: number, canvasHeight: number): ViewportTransform => ({
  canvasWidth,
  canvasHeight,
  boardWidth: 32,
  boardHeight: 18,
  cellSize: canvasHeight / 22,
  boardPixelWidth: canvasHeight * 0.72,
  boardPixelHeight: canvasHeight * 0.72,
  offsetX: (canvasWidth - canvasHeight * 0.72) / 2,
  offsetY: canvasHeight * 0.14,
  safeInsetPx: canvasHeight * 0.03,
  logicalScale: canvasHeight / 1080,
});

describe('computeHudLayout', () => {
  it.each([[1920, 1080], [2560, 1440], [3840, 2160]])('keeps panels inside %ix%i safe bounds without covering the board interior', (width, height) => {
    const board = viewport(width, height);
    const layout = computeHudLayout(width, height, board);
    expect(layout.typography.body).toBeGreaterThanOrEqual(24 * (height / 1080));
    expect(layout.typography.primary).toBeGreaterThanOrEqual(30 * (height / 1080));
    expect(layout.topLeft.x).toBeGreaterThanOrEqual(layout.safeMargin);
    expect(layout.topLeft.y).toBeGreaterThanOrEqual(layout.safeMargin);
    expect(layout.topRight.x + layout.topRight.width).toBeLessThanOrEqual(width - layout.safeMargin + 0.001);
    expect(layout.event.width).toBeLessThan(width - layout.safeMargin * 2);
    expect(layout.event.y + layout.event.height).toBeLessThanOrEqual(height - layout.safeMargin + 0.001);

    const boardLeft = board.offsetX;
    const boardRight = board.offsetX + board.boardPixelWidth;
    expect(layout.topLeft.x + layout.topLeft.width).toBeLessThanOrEqual(boardLeft);
    expect(layout.topRight.x).toBeGreaterThanOrEqual(boardRight);
  });

  it('scales typography proportionally from the 1080p baseline', () => {
    const a = computeHudLayout(1920, 1080, viewport(1920, 1080));
    const b = computeHudLayout(3840, 2160, viewport(3840, 2160));
    expect(b.typography.body / a.typography.body).toBeCloseTo(2, 5);
    expect(b.typography.primary / a.typography.primary).toBeCloseTo(2, 5);
  });

  it.each([[0, 1080], [-1, 1080], [1920, Number.NaN]])('rejects invalid canvas geometry', (width, height) => {
    expect(() => computeHudLayout(width, height, viewport(1920, 1080))).toThrow(RangeError);
  });
});
