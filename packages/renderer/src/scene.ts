import { Container, Graphics } from 'pixi.js';

export const SCENE_LAYER_ORDER = [
  'background',
  'grid',
  'obstacles',
  'hazardsPortals',
  'items',
  'trail',
  'snake',
  'effects',
  'localEvents',
  'hud',
  'debug',
] as const;

export type SceneLayerName = (typeof SCENE_LAYER_ORDER)[number];

export interface SceneGraph {
  readonly root: Container;
  readonly layers: Record<SceneLayerName, Container>;
  readonly surfaces: {
    readonly background: Graphics;
    readonly grid: Graphics;
    readonly obstacles: Graphics;
    readonly hazardsPortals: Graphics;
  };
  destroyed: boolean;
}

export const createSceneGraph = (): SceneGraph => {
  const root = new Container({ label: 'snake-renderer-root' });
  const layers = {} as Record<SceneLayerName, Container>;
  for (const name of SCENE_LAYER_ORDER) {
    const layer = new Container({ label: name });
    layers[name] = layer;
    root.addChild(layer);
  }

  const background = new Graphics({ label: 'background-surface' });
  const grid = new Graphics({ label: 'grid-surface' });
  const obstacles = new Graphics({ label: 'obstacle-surface' });
  const hazardsPortals = new Graphics({ label: 'hazard-portal-surface' });
  layers.background.addChild(background);
  layers.grid.addChild(grid);
  layers.obstacles.addChild(obstacles);
  layers.hazardsPortals.addChild(hazardsPortals);

  return {
    root,
    layers,
    surfaces: { background, grid, obstacles, hazardsPortals },
    destroyed: false,
  };
};

export const destroySceneGraph = (scene: SceneGraph): void => {
  if (scene.destroyed) return;
  scene.destroyed = true;
  scene.root.removeFromParent();
  scene.root.destroy({ children: true });
};
