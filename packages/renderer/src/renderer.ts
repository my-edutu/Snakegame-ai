import { Application, Container } from 'pixi.js';
import { drawBoard } from './draw-board.js';
import { drawEnvironment } from './draw-environment.js';
import { ItemDrawableManager } from './draw-items.js';
import { SnakeDrawableManager } from './draw-snake.js';
import { EffectManager } from './effects.js';
import { RenderEventBuffer } from './events.js';
import { interpolateRenderFrames } from './interpolation.js';
import { FrameMetrics, type FrameMetricsSnapshot } from './metrics.js';
import { getQualityPreset, type QualityPreset } from './quality.js';
import { createSceneGraph, destroySceneGraph, type SceneGraph } from './scene.js';
import { getSnakeSkin, type SnakeSkin } from './skins.js';
import { getTheme, type EnvironmentTheme } from './themes.js';
import type { RenderFrame, ViewportTransform } from './types.js';
import { computeViewportTransform } from './viewport.js';
import { createHudDrawableManager, type HudDrawableManager } from './draw-hud.js';
import { computeHudLayout, type HudLayout } from './hud-layout.js';
import { createHudSnapshot } from './hud-model.js';
import type { HudLifecycle, HudRiskBand, HudSnapshot } from './hud-types.js';

export interface RendererTicker {
  add(callback: (elapsedMs: number) => void): void;
  remove(callback: (elapsedMs: number) => void): void;
}

export interface RendererHost {
  readonly stage: Container;
  readonly ticker: RendererTicker;
  resize(width: number, height: number): void;
  destroy(): void;
}

export interface RendererHostInit {
  readonly width: number;
  readonly height: number;
  readonly mount?: HTMLElement;
  readonly resolution?: number;
}

export type RendererHostFactory = (options: RendererHostInit) => Promise<RendererHost>;

export interface SnakeRendererOptions {
  readonly hostFactory?: RendererHostFactory;
  readonly safeInset?: number;
  readonly skin?: string;
  readonly theme?: string;
  readonly quality?: string;
}

export interface SnakeRendererInit {
  readonly width: number;
  readonly height: number;
  readonly mount?: HTMLElement;
  readonly resolution?: number;
}

export interface SnakeRendererState {
  readonly initialized: boolean;
  readonly width: number;
  readonly height: number;
  readonly skinId: string;
  readonly themeId: string;
  readonly qualityId: string;
}

export interface SnakeRendererMetrics extends FrameMetricsSnapshot {
  readonly snakeDrawableCount: number;
  readonly visibleSnakeDrawableCount: number;
  readonly itemDrawableCount: number;
  readonly effectActiveCount: number;
  readonly eventCount: number;
  readonly hudDisplayObjectCount: number;
  readonly displayObjectCount: number;
}

const defaultHostFactory: RendererHostFactory = async (options) => {
  const app = new Application();
  await app.init({
    width: options.width,
    height: options.height,
    backgroundAlpha: 0,
    antialias: true,
    autoStart: true,
    sharedTicker: false,
    autoDensity: true,
    resolution: options.resolution ?? Math.min(globalThis.devicePixelRatio ?? 1, 2),
  });
  if (options.mount) options.mount.appendChild(app.canvas);

  const callbacks = new Map<(elapsedMs: number) => void, (ticker: typeof app.ticker) => void>();
  const ticker: RendererTicker = {
    add(callback) {
      if (callbacks.has(callback)) return;
      const wrapped = (pixiTicker: typeof app.ticker): void => callback(pixiTicker.deltaMS);
      callbacks.set(callback, wrapped);
      app.ticker.add(wrapped);
    },
    remove(callback) {
      const wrapped = callbacks.get(callback);
      if (!wrapped) return;
      app.ticker.remove(wrapped);
      callbacks.delete(callback);
    },
  };

  let destroyed = false;
  return {
    stage: app.stage,
    ticker,
    resize(width, height) {
      if (!destroyed) app.renderer.resize(width, height);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      for (const wrapped of callbacks.values()) app.ticker.remove(wrapped);
      callbacks.clear();
      app.destroy(true);
    },
  };
};

const eventEffectColor = (kind: RenderFrame['events'][number]['kind'], theme: EnvironmentTheme): string => {
  switch (kind) {
    case 'near-death': return theme.hazard;
    case 'record': return '#FFD34D';
    case 'level-complete': return '#55FF9A';
    case 'death': return '#FF3D71';
    case 'milestone': return theme.ambient;
    case 'level-start': return theme.portal;
    case 'countdown': return '#FFFFFF';
    case 'strategy-change': return theme.grid;
  }
};

const riskBandFor = (risk: number): HudRiskBand => {
  if (risk >= 85) return 'critical';
  if (risk >= 60) return 'high';
  if (risk >= 30) return 'guarded';
  return 'low';
};

const legacyLifecycleFor = (frame: RenderFrame): HudLifecycle => {
  switch (frame.lifecycle) {
    case 'paused': return 'paused';
    case 'level-complete': return 'celebrating';
    case 'countdown': return 'restart-countdown';
    case 'death':
    case 'run-summary': return 'summary';
    case 'boot':
    case 'intro':
    case 'new-game':
    case 'level-start':
    case 'playing': return 'playing';
  }
};

const levelNumberFromId = (id: string): number => {
  const match = /(?:level[-_ ]?)?(\d+)/i.exec(id);
  const parsed = match?.[1] ? Number.parseInt(match[1], 10) : 1;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const legacyHudSnapshotFor = (frame: RenderFrame): HudSnapshot => {
  const levelNumber = levelNumberFromId(frame.level.id);
  return createHudSnapshot({
    completeness: 'legacy',
    level: { number: levelNumber, name: frame.level.name, total: Math.max(20, levelNumber) },
    run: {
      number: 1,
      elapsedTicks: Math.max(0, Math.trunc(frame.tick)),
      tickDurationMs: frame.tickDurationMs,
      levelStreak: 0,
      lifecycle: legacyLifecycleFor(frame),
      countdownTicksRemaining: frame.lifecycle === 'countdown' ? 1 : 0,
    },
    primary: {
      score: Math.max(0, frame.hud.score),
      length: Math.max(0, Math.trunc(frame.hud.length)),
      occupancyPercent: Math.min(100, Math.max(0, frame.hud.occupancyPercent)),
      foodEaten: 0,
      safeMoves: 0,
      projectedMoves: 0,
    },
    risk: { score: Math.min(100, Math.max(0, frame.hud.risk)), band: riskBandFor(frame.hud.risk) },
    strategy: {
      label: frame.hud.strategy.trim().length > 0 ? frame.hud.strategy : 'autonomous-play',
      trapRiskPercent: null,
      preservedEscapeRoutes: null,
      endgame: false,
      criticalSafeMoves: null,
    },
    records: {
      bestOccupancyPercent: 0,
      highestLevel: 0,
      deaths: 0,
      totalGames: 0,
      highScore: 0,
      maxLength: 0,
      longestSurvivalTicks: 0,
    },
    recordTarget: null,
    runSummary: null,
    emittedEventIds: [],
  });
};

export class SnakeRenderer {
  private readonly hostFactory: RendererHostFactory;
  private readonly safeInset: number;
  private host: RendererHost | undefined;
  private scene: SceneGraph | undefined;
  private snake: SnakeDrawableManager | undefined;
  private items: ItemDrawableManager | undefined;
  private effects: EffectManager | undefined;
  private hud: HudDrawableManager | undefined;
  private readonly events = new RenderEventBuffer({ maxSize: 32, ttlTicks: 240 });
  private readonly frameMetrics = new FrameMetrics(120);
  private previousFrame: RenderFrame | undefined;
  private currentFrame: RenderFrame | undefined;
  private currentHudSnapshot: HudSnapshot | undefined;
  private hudLayout: HudLayout | undefined;
  private hudLayoutKey = '';
  private elapsedSinceFrameMs = 0;
  private width = 0;
  private height = 0;
  private skin: SnakeSkin;
  private theme: EnvironmentTheme;
  private quality: QualityPreset;
  private readonly warnings: string[] = [];
  private destroyed = false;
  private initialized = false;
  private initializing = false;

  private readonly onTick = (elapsedMs: number): void => {
    if (!this.initialized || this.destroyed || !this.currentFrame) return;
    const safeElapsed = Number.isFinite(elapsedMs) && elapsedMs >= 0 ? elapsedMs : 0;
    this.frameMetrics.record(safeElapsed);
    this.elapsedSinceFrameMs += safeElapsed;
    const alpha = this.currentFrame.tickDurationMs > 0
      ? this.elapsedSinceFrameMs / this.currentFrame.tickDurationMs
      : 1;
    const visualFrame = this.previousFrame
      ? interpolateRenderFrames(this.previousFrame, this.currentFrame, alpha)
      : this.currentFrame;
    this.draw(visualFrame);
  };

  constructor(options: SnakeRendererOptions = {}) {
    this.hostFactory = options.hostFactory ?? defaultHostFactory;
    this.safeInset = options.safeInset ?? 32;
    const skin = getSnakeSkin(options.skin ?? 'emerald');
    const theme = getTheme(options.theme ?? 'neon-grid');
    const quality = getQualityPreset(options.quality ?? 'balanced');
    this.skin = skin.value;
    this.theme = theme.value;
    this.quality = quality.value;
    for (const warning of [skin.warning, theme.warning, quality.warning]) {
      if (warning) this.addWarning(warning);
    }
  }

  async init(options: SnakeRendererInit): Promise<void> {
    if (this.destroyed) throw new Error('renderer has been destroyed');
    if (this.initialized) throw new Error('renderer is already initialized');
    if (this.initializing) throw new Error('renderer initialization is already in progress');
    this.assertDimensions(options.width, options.height);
    this.initializing = true;

    let host: RendererHost | undefined;
    let scene: SceneGraph | undefined;
    let snake: SnakeDrawableManager | undefined;
    let items: ItemDrawableManager | undefined;
    let effects: EffectManager | undefined;
    let hud: HudDrawableManager | undefined;

    try {
      const hostOptions: RendererHostInit = {
        width: options.width,
        height: options.height,
        ...(options.mount ? { mount: options.mount } : {}),
        ...(options.resolution !== undefined ? { resolution: options.resolution } : {}),
      };
      host = await this.hostFactory(hostOptions);
      if (this.destroyed) throw new Error('renderer was destroyed during initialization');

      scene = createSceneGraph();
      host.stage.addChild(scene.root);
      snake = new SnakeDrawableManager(scene.layers.snake, scene.layers.trail);
      items = new ItemDrawableManager(scene.layers.items, 16);
      effects = new EffectManager(scene.layers.effects, 512);
      hud = createHudDrawableManager(scene.layers.hud);
      host.ticker.add(this.onTick);
      if (this.destroyed) throw new Error('renderer was destroyed during initialization');

      this.host = host;
      this.scene = scene;
      this.snake = snake;
      this.items = items;
      this.effects = effects;
      this.hud = hud;
      this.width = options.width;
      this.height = options.height;
      this.initialized = true;
    } catch (error) {
      this.rollbackInitialization(host, scene, snake, items, effects, hud);
      throw error;
    } finally {
      this.initializing = false;
    }
  }

  resize(width: number, height: number): void {
    this.ensureInitialized();
    this.assertDimensions(width, height);
    this.width = width;
    this.height = height;
    this.hudLayout = undefined;
    this.hudLayoutKey = '';
    this.host!.resize(width, height);
    if (this.currentFrame) this.draw(this.currentFrame);
  }

  renderFrame(frame: RenderFrame, hudSnapshot?: HudSnapshot): void {
    this.ensureInitialized();
    this.previousFrame = this.currentFrame;
    this.currentFrame = frame;
    this.currentHudSnapshot = hudSnapshot ?? legacyHudSnapshotFor(frame);
    this.elapsedSinceFrameMs = 0;
    this.events.prune(frame.tick);
    this.effects!.advance(frame.tick);

    for (const event of frame.events) {
      const inserted = this.events.push(event, frame.tick);
      if (!inserted) continue;
      const head = frame.snake.body[0];
      if (!head) continue;
      this.effects!.emit(head, eventEffectColor(event.kind, this.theme), 28, this.quality.particleCapacity);
    }
    this.draw(frame);
  }

  setSkin(id: string): void {
    const lookup = getSnakeSkin(id);
    this.skin = lookup.value;
    if (lookup.warning) this.addWarning(lookup.warning);
    if (this.currentFrame && this.initialized) this.draw(this.currentFrame);
  }

  setTheme(id: string): void {
    const lookup = getTheme(id);
    this.theme = lookup.value;
    if (lookup.warning) this.addWarning(lookup.warning);
    if (this.currentFrame && this.initialized) this.draw(this.currentFrame);
  }

  setQuality(id: string): void {
    const lookup = getQualityPreset(id);
    this.quality = lookup.value;
    if (lookup.warning) this.addWarning(lookup.warning);
    if (this.currentFrame && this.initialized) this.draw(this.currentFrame);
  }

  getState(): SnakeRendererState {
    return {
      initialized: this.initialized && !this.destroyed,
      width: this.width,
      height: this.height,
      skinId: this.skin.id,
      themeId: this.theme.id,
      qualityId: this.quality.id,
    };
  }

  getWarnings(): readonly string[] {
    return [...this.warnings];
  }

  getMetrics(): SnakeRendererMetrics {
    const frame = this.frameMetrics.snapshot();
    const hudCounts = this.hud?.getResourceCounts();
    return {
      ...frame,
      snakeDrawableCount: this.snake?.drawableCount ?? 0,
      visibleSnakeDrawableCount: this.snake?.visibleDrawableCount ?? 0,
      itemDrawableCount: this.items?.createdCount ?? 0,
      effectActiveCount: this.effects?.activeCount ?? 0,
      eventCount: this.events.size,
      hudDisplayObjectCount: hudCounts ? hudCounts.containers + hudCounts.graphics + hudCounts.texts : 0,
      displayObjectCount: this.countDisplayObjects(),
    };
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.host) this.host.ticker.remove(this.onTick);
    this.snake?.destroy();
    this.items?.destroy();
    this.effects?.destroy();
    this.hud?.destroy();
    this.events.destroy();
    if (this.scene) destroySceneGraph(this.scene);
    this.host?.destroy();
    this.previousFrame = undefined;
    this.currentFrame = undefined;
    this.currentHudSnapshot = undefined;
    this.hudLayout = undefined;
    this.hudLayoutKey = '';
    this.scene = undefined;
    this.snake = undefined;
    this.items = undefined;
    this.effects = undefined;
    this.hud = undefined;
    this.host = undefined;
    this.initialized = false;
  }

  private draw(frame: RenderFrame): void {
    if (!this.scene || !this.snake || !this.items || !this.effects || !this.hud) return;
    const viewport = this.viewportFor(frame);
    drawBoard(this.scene, viewport, this.theme, frame.environment.activeBounds);
    drawEnvironment(this.scene, viewport, this.theme, frame.environment);
    this.effects.setViewport(viewport);
    this.snake.update(frame.snake.body, frame.snake.direction, viewport, this.skin, this.quality);
    this.items.update(frame.items, viewport);
    if (this.currentHudSnapshot) {
      this.hud.update(this.currentHudSnapshot, this.layoutFor(viewport), this.theme, this.quality);
    }
  }

  private viewportFor(frame: RenderFrame): ViewportTransform {
    return computeViewportTransform({
      canvasWidth: this.width,
      canvasHeight: this.height,
      boardWidth: frame.level.width,
      boardHeight: frame.level.height,
      safeInset: this.safeInset,
    });
  }

  private layoutFor(viewport: ViewportTransform): HudLayout {
    const key = `${this.width}x${this.height}:${viewport.offsetX.toFixed(3)}:${viewport.offsetY.toFixed(3)}:${viewport.boardPixelWidth.toFixed(3)}:${viewport.boardPixelHeight.toFixed(3)}`;
    if (!this.hudLayout || this.hudLayoutKey !== key) {
      this.hudLayout = computeHudLayout(this.width, this.height, viewport);
      this.hudLayoutKey = key;
    }
    return this.hudLayout;
  }

  private assertDimensions(width: number, height: number): void {
    computeViewportTransform({ canvasWidth: width, canvasHeight: height, boardWidth: 1, boardHeight: 1, safeInset: 0 });
  }

  private ensureInitialized(): void {
    if (!this.initialized || this.destroyed || !this.host) throw new Error('renderer is not initialized');
  }

  private addWarning(warning: string): void {
    if (this.warnings[this.warnings.length - 1] === warning) return;
    this.warnings.push(warning);
    if (this.warnings.length > 32) this.warnings.splice(0, this.warnings.length - 32);
  }

  private rollbackInitialization(
    host: RendererHost | undefined,
    scene: SceneGraph | undefined,
    snake: SnakeDrawableManager | undefined,
    items: ItemDrawableManager | undefined,
    effects: EffectManager | undefined,
    hud: HudDrawableManager | undefined,
  ): void {
    if (host) {
      try { host.ticker.remove(this.onTick); } catch { /* best-effort rollback */ }
    }
    try { hud?.destroy(); } catch { /* best-effort rollback */ }
    try { snake?.destroy(); } catch { /* best-effort rollback */ }
    try { items?.destroy(); } catch { /* best-effort rollback */ }
    try { effects?.destroy(); } catch { /* best-effort rollback */ }
    if (scene) {
      try { destroySceneGraph(scene); } catch { /* best-effort rollback */ }
    }
    if (host) {
      try { host.destroy(); } catch { /* preserve original initialization error */ }
    }
  }

  private countDisplayObjects(): number {
    const root = this.scene?.root;
    if (!root) return 0;
    let total = 1;
    const visit = (container: Container): void => {
      for (const child of container.children) {
        total += 1;
        if (child instanceof Container) visit(child);
      }
    };
    visit(root);
    return total;
  }
}

export const createPixiRendererHost = defaultHostFactory;
