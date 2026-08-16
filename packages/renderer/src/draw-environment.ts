import type { EnvironmentTheme } from './themes.js';
import type { RenderEnvironment, ViewportTransform } from './types.js';
import type { SceneGraph } from './scene.js';

const center = (x: number, y: number, viewport: ViewportTransform) => ({
  x: viewport.offsetX + (x + 0.5) * viewport.cellSize,
  y: viewport.offsetY + (y + 0.5) * viewport.cellSize,
});

export const drawEnvironment = (
  scene: SceneGraph,
  viewport: ViewportTransform,
  theme: EnvironmentTheme,
  environment: Pick<RenderEnvironment, 'obstacles' | 'hazards' | 'portals'>,
): void => {
  if (scene.destroyed) return;
  const obstacles = scene.surfaces.obstacles;
  const dynamic = scene.surfaces.hazardsPortals;
  obstacles.clear();
  dynamic.clear();

  const padding = Math.max(1, viewport.cellSize * 0.12);
  for (const obstacle of environment.obstacles) {
    const x = viewport.offsetX + obstacle.position.x * viewport.cellSize + padding;
    const y = viewport.offsetY + obstacle.position.y * viewport.cellSize + padding;
    const size = Math.max(1, viewport.cellSize - padding * 2);
    obstacles
      .roundRect(x, y, size, size, Math.max(2, viewport.cellSize * 0.16))
      .fill(theme.obstacle)
      .stroke({ color: theme.grid, alpha: 0.7, width: Math.max(1, viewport.logicalScale) });
  }

  for (const hazard of environment.hazards) {
    const p = center(hazard.position.x, hazard.position.y, viewport);
    const radius = viewport.cellSize * 0.34;
    dynamic
      .star(p.x, p.y, 8, radius, radius * 0.55)
      .fill({ color: theme.hazard, alpha: 0.82 })
      .stroke({ color: '#FFFFFF', alpha: 0.55, width: Math.max(1, viewport.logicalScale) });
  }

  for (const portal of environment.portals) {
    for (const endpoint of [portal.a, portal.b]) {
      const p = center(endpoint.x, endpoint.y, viewport);
      const radius = viewport.cellSize * 0.36;
      dynamic
        .circle(p.x, p.y, radius)
        .stroke({ color: theme.portal, alpha: 0.92, width: Math.max(2, viewport.logicalScale * 2.2) })
        .circle(p.x, p.y, radius * 0.55)
        .stroke({ color: theme.ambient, alpha: 0.65, width: Math.max(1, viewport.logicalScale) });
    }
  }
};
