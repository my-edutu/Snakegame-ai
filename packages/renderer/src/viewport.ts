import type { ViewportTransform } from './types.js';

export class ViewportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ViewportValidationError';
  }
}

export interface ViewportInput {
  readonly canvasWidth: number;
  readonly canvasHeight: number;
  readonly boardWidth: number;
  readonly boardHeight: number;
  readonly safeInset: number;
}

const assertPositiveFinite = (value: number, name: string): void => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new ViewportValidationError(`${name} must be a positive finite number`);
  }
};

export const computeViewportTransform = (input: ViewportInput): ViewportTransform => {
  assertPositiveFinite(input.canvasWidth, 'canvasWidth');
  assertPositiveFinite(input.canvasHeight, 'canvasHeight');
  assertPositiveFinite(input.boardWidth, 'boardWidth');
  assertPositiveFinite(input.boardHeight, 'boardHeight');
  if (!Number.isFinite(input.safeInset) || input.safeInset < 0) {
    throw new ViewportValidationError('safeInset must be a non-negative finite number');
  }

  const logicalScale = input.canvasHeight / 1080;
  const safeInsetPx = input.safeInset * logicalScale;
  const availableWidth = input.canvasWidth - safeInsetPx * 2;
  const availableHeight = input.canvasHeight - safeInsetPx * 2;
  if (availableWidth <= 0 || availableHeight <= 0) {
    throw new ViewportValidationError('safeInset leaves no drawable viewport');
  }

  const cellSize = Math.min(availableWidth / input.boardWidth, availableHeight / input.boardHeight);
  const boardPixelWidth = cellSize * input.boardWidth;
  const boardPixelHeight = cellSize * input.boardHeight;
  const offsetX = (input.canvasWidth - boardPixelWidth) / 2;
  const offsetY = (input.canvasHeight - boardPixelHeight) / 2;

  return {
    canvasWidth: input.canvasWidth,
    canvasHeight: input.canvasHeight,
    boardWidth: input.boardWidth,
    boardHeight: input.boardHeight,
    cellSize,
    boardPixelWidth,
    boardPixelHeight,
    offsetX,
    offsetY,
    safeInsetPx,
    logicalScale,
  };
};
