import { describe, expect, it } from 'vitest';
import { computeViewportTransform, ViewportValidationError } from '../src/viewport.js';

const make = (canvasWidth: number, canvasHeight: number) =>
  computeViewportTransform({
    canvasWidth,
    canvasHeight,
    boardWidth: 40,
    boardHeight: 30,
    safeInset: 32,
  });

describe('computeViewportTransform', () => {
  it('preserves identical logical board aspect at 1080p 1440p and 4K', () => {
    const p1080 = make(1920, 1080);
    const p1440 = make(2560, 1440);
    const p4k = make(3840, 2160);

    expect(p1080.boardPixelWidth / p1080.boardPixelHeight).toBeCloseTo(40 / 30, 8);
    expect(p1440.boardPixelWidth / p1440.boardPixelHeight).toBeCloseTo(40 / 30, 8);
    expect(p4k.boardPixelWidth / p4k.boardPixelHeight).toBeCloseTo(40 / 30, 8);
  });

  it('scales cell size proportionally across target 16:9 resolutions', () => {
    const p1080 = make(1920, 1080);
    const p1440 = make(2560, 1440);
    const p4k = make(3840, 2160);

    expect(p1440.cellSize / p1080.cellSize).toBeCloseTo(4 / 3, 6);
    expect(p4k.cellSize / p1080.cellSize).toBeCloseTo(2, 6);
  });

  it('keeps the safe board rectangle fully inside the viewport', () => {
    const transform = make(1920, 1080);

    expect(transform.offsetX).toBeGreaterThanOrEqual(32);
    expect(transform.offsetY).toBeGreaterThanOrEqual(32);
    expect(transform.offsetX + transform.boardPixelWidth).toBeLessThanOrEqual(1920 - 32);
    expect(transform.offsetY + transform.boardPixelHeight).toBeLessThanOrEqual(1080 - 32);
  });

  it.each([
    [0, 1080],
    [1920, 0],
    [Number.NaN, 1080],
    [1920, Number.POSITIVE_INFINITY],
  ])('rejects invalid canvas dimensions %s x %s', (width, height) => {
    expect(() => make(width, height)).toThrow(ViewportValidationError);
  });
});
