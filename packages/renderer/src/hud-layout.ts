import type { ViewportTransform } from './types.js';

export interface HudRect { readonly x: number; readonly y: number; readonly width: number; readonly height: number }
export interface HudTypography { readonly body: number; readonly primary: number; readonly heading: number; readonly event: number }
export interface HudLayout {
  readonly safeMargin: number;
  readonly gap: number;
  readonly typography: HudTypography;
  readonly topLeft: HudRect;
  readonly topCenter: HudRect;
  readonly topRight: HudRect;
  readonly bottomLeft: HudRect;
  readonly bottomRight: HudRect;
  readonly event: HudRect;
}

const validDimension = (value: number, name: string): number => {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be finite and positive.`);
  return value;
};

export function computeHudLayout(canvasWidth: number, canvasHeight: number, board: ViewportTransform): HudLayout {
  validDimension(canvasWidth, 'canvasWidth');
  validDimension(canvasHeight, 'canvasHeight');
  validDimension(board.boardPixelWidth, 'board.boardPixelWidth');
  validDimension(board.boardPixelHeight, 'board.boardPixelHeight');
  if (!Number.isFinite(board.offsetX) || !Number.isFinite(board.offsetY)) throw new RangeError('board offsets must be finite.');

  const scale = canvasHeight / 1080;
  const safeMargin = 32 * scale;
  const gap = 16 * scale;
  const boardLeft = board.offsetX;
  const boardRight = board.offsetX + board.boardPixelWidth;
  const boardTop = board.offsetY;
  const boardBottom = board.offsetY + board.boardPixelHeight;
  const leftWidth = Math.max(0, boardLeft - safeMargin - gap);
  const rightWidth = Math.max(0, canvasWidth - safeMargin - boardRight - gap);
  const sideTopHeight = Math.max(160 * scale, Math.min(250 * scale, board.boardPixelHeight * 0.31));
  const sideBottomHeight = Math.max(150 * scale, Math.min(230 * scale, board.boardPixelHeight * 0.27));
  const centerWidth = Math.max(280 * scale, Math.min(board.boardPixelWidth * 0.72, 760 * scale));
  const centerHeight = 86 * scale;
  const eventWidth = Math.min(canvasWidth - safeMargin * 2, Math.max(520 * scale, board.boardPixelWidth * 0.78));
  const eventHeight = Math.min(260 * scale, canvasHeight - safeMargin * 2);

  return Object.freeze({
    safeMargin,
    gap,
    typography: Object.freeze({ body: 24 * scale, primary: 34 * scale, heading: 28 * scale, event: 46 * scale }),
    topLeft: Object.freeze({ x: safeMargin, y: safeMargin, width: leftWidth, height: sideTopHeight }),
    topCenter: Object.freeze({ x: (canvasWidth - centerWidth) / 2, y: safeMargin, width: centerWidth, height: centerHeight }),
    topRight: Object.freeze({ x: boardRight + gap, y: safeMargin, width: rightWidth, height: sideTopHeight }),
    bottomLeft: Object.freeze({ x: safeMargin, y: Math.min(canvasHeight - safeMargin - sideBottomHeight, Math.max(boardTop, boardBottom - sideBottomHeight)), width: leftWidth, height: sideBottomHeight }),
    bottomRight: Object.freeze({ x: boardRight + gap, y: Math.min(canvasHeight - safeMargin - sideBottomHeight, Math.max(boardTop, boardBottom - sideBottomHeight)), width: rightWidth, height: sideBottomHeight }),
    event: Object.freeze({ x: (canvasWidth - eventWidth) / 2, y: (canvasHeight - eventHeight) / 2, width: eventWidth, height: eventHeight }),
  });
}
