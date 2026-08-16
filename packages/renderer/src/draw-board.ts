import type { EnvironmentTheme } from './themes.js';
import type { RenderBounds, ViewportTransform } from './types.js';
import type { SceneGraph } from './scene.js';

export const drawBoard = (
  scene: SceneGraph,
  viewport: ViewportTransform,
  theme: EnvironmentTheme,
  activeBounds?: RenderBounds,
): void => {
  if (scene.destroyed) return;
  const background = scene.surfaces.background;
  const grid = scene.surfaces.grid;
  background.clear();
  grid.clear();

  background
    .roundRect(
      viewport.offsetX,
      viewport.offsetY,
      viewport.boardPixelWidth,
      viewport.boardPixelHeight,
      Math.max(8, viewport.cellSize * 0.18),
    )
    .fill(theme.board)
    .stroke({ color: theme.grid, alpha: 0.35, width: Math.max(1, viewport.logicalScale) });

  const x0 = viewport.offsetX;
  const y0 = viewport.offsetY;
  const x1 = x0 + viewport.boardPixelWidth;
  const y1 = y0 + viewport.boardPixelHeight;
  for (let x = 0; x <= viewport.boardWidth; x += 1) {
    const px = x0 + x * viewport.cellSize;
    grid.moveTo(px, y0).lineTo(px, y1);
  }
  for (let y = 0; y <= viewport.boardHeight; y += 1) {
    const py = y0 + y * viewport.cellSize;
    grid.moveTo(x0, py).lineTo(x1, py);
  }
  grid.stroke({ color: theme.grid, alpha: theme.gridAlpha, width: Math.max(0.5, viewport.logicalScale * 0.7) });

  if (activeBounds) {
    const bx = x0 + activeBounds.minX * viewport.cellSize;
    const by = y0 + activeBounds.minY * viewport.cellSize;
    const bw = (activeBounds.maxX - activeBounds.minX + 1) * viewport.cellSize;
    const bh = (activeBounds.maxY - activeBounds.minY + 1) * viewport.cellSize;
    grid
      .rect(bx, by, bw, bh)
      .stroke({ color: theme.ambient, alpha: 0.72, width: Math.max(2, viewport.logicalScale * 2) });
  }
};
