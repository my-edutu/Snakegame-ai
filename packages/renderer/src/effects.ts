import { Container, Graphics } from 'pixi.js';
import { BoundedPool } from './pool.js';
import type { RenderVec2, ViewportTransform } from './types.js';

interface ActiveEffect {
  readonly graphic: Graphics;
  readonly expiresAt: number;
}

export class EffectManager {
  private readonly layer: Container;
  private readonly pool: BoundedPool<Graphics>;
  private readonly all = new Set<Graphics>();
  private active: ActiveEffect[] = [];
  private currentTick = 0;
  private viewport?: ViewportTransform;

  constructor(layer: Container, capacity: number) {
    this.layer = layer;
    this.pool = new BoundedPool(capacity, () => {
      const graphic = new Graphics({ label: 'transient-effect' });
      graphic.visible = false;
      this.all.add(graphic);
      this.layer.addChild(graphic);
      return graphic;
    });
  }

  get activeCount(): number { return this.active.length; }

  setViewport(viewport: ViewportTransform): void {
    this.viewport = viewport;
  }

  advance(tick: number): void {
    this.currentTick = tick;
    const remaining: ActiveEffect[] = [];
    for (const effect of this.active) {
      if (effect.expiresAt > tick) {
        remaining.push(effect);
      } else {
        effect.graphic.visible = false;
        this.pool.release(effect.graphic);
      }
    }
    this.active = remaining;
  }

  emit(position: RenderVec2, color: string, ttlTicks: number, maxActive = Number.POSITIVE_INFINITY): boolean {
    if (this.active.length >= maxActive) return false;
    const graphic = this.pool.acquire();
    if (!graphic) return false;
    graphic.visible = true;
    graphic.clear();
    const size = this.viewport?.cellSize ?? 16;
    const scale = this.viewport?.logicalScale ?? 1;
    const px = this.viewport ? this.viewport.offsetX + (position.x + 0.5) * size : position.x;
    const py = this.viewport ? this.viewport.offsetY + (position.y + 0.5) * size : position.y;
    graphic.position.set(px, py);
    graphic
      .circle(0, 0, Math.max(2, size * 0.42))
      .stroke({ color, alpha: 0.82, width: Math.max(1.5, scale * 2) })
      .circle(0, 0, Math.max(1, size * 0.18))
      .fill({ color, alpha: 0.55 });
    this.active.push({ graphic, expiresAt: this.currentTick + Math.max(1, Math.floor(ttlTicks)) });
    return true;
  }

  destroy(): void {
    this.active = [];
    this.pool.destroy();
    for (const graphic of this.all) {
      graphic.removeFromParent();
      graphic.destroy();
    }
    this.all.clear();
  }
}
