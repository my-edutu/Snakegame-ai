export type RenderDirection = 'up' | 'down' | 'left' | 'right';

export type RenderLifecycle =
  | 'boot'
  | 'intro'
  | 'new-game'
  | 'level-start'
  | 'playing'
  | 'level-complete'
  | 'death'
  | 'run-summary'
  | 'countdown'
  | 'paused';

export interface RenderVec2 {
  readonly x: number;
  readonly y: number;
}

export interface RenderBounds {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

export interface RenderSnake {
  readonly direction: RenderDirection;
  readonly body: readonly RenderVec2[];
}

export interface RenderItem {
  readonly id: string;
  readonly type: string;
  readonly position: RenderVec2;
  readonly value: number;
}

export interface RenderObstacle {
  readonly id: string;
  readonly position: RenderVec2;
}

export interface RenderHazard {
  readonly id: string;
  readonly position: RenderVec2;
}

export interface RenderPortal {
  readonly id: string;
  readonly a: RenderVec2;
  readonly b: RenderVec2;
}

export interface RenderEnvironment {
  readonly activeBounds?: RenderBounds;
  readonly obstacles: readonly RenderObstacle[];
  readonly hazards: readonly RenderHazard[];
  readonly portals: readonly RenderPortal[];
}

export interface RenderHudSummary {
  readonly score: number;
  readonly length: number;
  readonly occupancyPercent: number;
  readonly risk: number;
  readonly strategy: string;
}

export type RenderEventKind =
  | 'near-death'
  | 'milestone'
  | 'record'
  | 'level-complete'
  | 'level-start'
  | 'death'
  | 'countdown'
  | 'strategy-change';

export interface RenderEvent {
  readonly id: string | number;
  readonly kind: RenderEventKind;
  readonly label: string;
  readonly tick: number;
}

export interface RenderLevel {
  readonly id: string;
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly themeKey: string;
}

export interface RenderFrameInput {
  readonly tick: number;
  readonly tickDurationMs: number;
  readonly level: RenderLevel;
  readonly lifecycle: RenderLifecycle;
  readonly snake: RenderSnake;
  readonly items: readonly RenderItem[];
  readonly environment: RenderEnvironment;
  readonly hud: RenderHudSummary;
  readonly events: readonly RenderEvent[];
}

export interface RenderFrame extends RenderFrameInput {}

export interface ViewportTransform {
  readonly canvasWidth: number;
  readonly canvasHeight: number;
  readonly boardWidth: number;
  readonly boardHeight: number;
  readonly cellSize: number;
  readonly boardPixelWidth: number;
  readonly boardPixelHeight: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly safeInsetPx: number;
  readonly logicalScale: number;
}
