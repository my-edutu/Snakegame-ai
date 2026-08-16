import { Container, Graphics } from 'pixi.js';
import type { QualityPreset } from './quality.js';
import type { SnakeSkin } from './skins.js';
import type { RenderDirection, RenderVec2, ViewportTransform } from './types.js';

const directionOffset = (direction: RenderDirection, distance: number): { x: number; y: number } => {
  switch (direction) {
    case 'up': return { x: 0, y: -distance };
    case 'down': return { x: 0, y: distance };
    case 'left': return { x: -distance, y: 0 };
    case 'right': return { x: distance, y: 0 };
  }
};

export class SnakeDrawableManager {
  private readonly layer: Container;
  private readonly trailLayer: Container;
  private readonly segments: Graphics[] = [];
  private readonly trail: Graphics;
  private styleKey = '';
  private visibleCount = 0;
  private skinId = 'emerald';

  constructor(layer: Container, trailLayer: Container) {
    this.layer = layer;
    this.trailLayer = trailLayer;
    this.trail = new Graphics({ label: 'snake-trail' });
    this.trailLayer.addChild(this.trail);
  }

  get drawableCount(): number { return this.segments.length; }
  get visibleDrawableCount(): number { return this.visibleCount; }
  get activeSkinId(): string { return this.skinId; }

  update(
    body: readonly RenderVec2[],
    direction: RenderDirection,
    viewport: ViewportTransform,
    skin: SnakeSkin,
    quality: QualityPreset,
  ): void {
    this.skinId = skin.id;
    while (this.segments.length < body.length) {
      const segment = new Graphics({ label: `snake-segment-${this.segments.length}` });
      this.segments.push(segment);
      this.layer.addChild(segment);
    }
    this.visibleCount = body.length;
    for (let index = 0; index < this.segments.length; index += 1) {
      const graphic = this.segments[index]!;
      const position = body[index];
      graphic.visible = Boolean(position);
      if (!position) continue;
      graphic.position.set(
        viewport.offsetX + (position.x + 0.5) * viewport.cellSize,
        viewport.offsetY + (position.y + 0.5) * viewport.cellSize,
      );
    }

    const nextStyleKey = `${skin.id}:${viewport.cellSize.toFixed(4)}`;
    if (this.styleKey !== nextStyleKey) {
      this.styleKey = nextStyleKey;
      this.rebuildGeometry(direction, viewport, skin);
    } else if (this.segments[0]) {
      this.rebuildHead(this.segments[0], direction, viewport, skin);
    }
    this.drawTrail(body, viewport, skin, quality);
  }

  private rebuildGeometry(direction: RenderDirection, viewport: ViewportTransform, skin: SnakeSkin): void {
    const radius = viewport.cellSize * 0.38;
    for (let index = 0; index < this.segments.length; index += 1) {
      const graphic = this.segments[index]!;
      if (index === 0) {
        this.rebuildHead(graphic, direction, viewport, skin);
        continue;
      }
      const color = skin.bodyStops[index % skin.bodyStops.length] ?? skin.bodyStops[0] ?? '#00FF88';
      graphic.clear()
        .circle(0, 0, radius)
        .fill(color)
        .stroke({ color: skin.outline, alpha: 0.72, width: Math.max(1, viewport.logicalScale * 1.35) });
    }
  }

  private rebuildHead(graphic: Graphics, direction: RenderDirection, viewport: ViewportTransform, skin: SnakeSkin): void {
    const radius = viewport.cellSize * 0.43;
    const accent = directionOffset(direction, radius * 0.38);
    graphic.clear()
      .circle(0, 0, radius)
      .fill(skin.bodyStops[0] ?? '#00FF88')
      .stroke({ color: skin.outline, alpha: 0.95, width: Math.max(1.5, viewport.logicalScale * 1.8) })
      .circle(accent.x, accent.y, Math.max(1.5, radius * 0.17))
      .fill(skin.headAccent);
  }

  private drawTrail(body: readonly RenderVec2[], viewport: ViewportTransform, skin: SnakeSkin, quality: QualityPreset): void {
    this.trail.clear();
    if (body.length < 2 || quality.trailLength <= 0) return;
    const count = Math.min(body.length, quality.trailLength);
    const start = body[count - 1]!;
    this.trail.moveTo(
      viewport.offsetX + (start.x + 0.5) * viewport.cellSize,
      viewport.offsetY + (start.y + 0.5) * viewport.cellSize,
    );
    for (let index = count - 2; index >= 0; index -= 1) {
      const point = body[index]!;
      this.trail.lineTo(
        viewport.offsetX + (point.x + 0.5) * viewport.cellSize,
        viewport.offsetY + (point.y + 0.5) * viewport.cellSize,
      );
    }
    this.trail.stroke({
      color: skin.outline,
      alpha: skin.trailAlpha,
      width: Math.max(2, viewport.cellSize * 0.22),
      cap: 'round',
      join: 'round',
    });
  }

  destroy(): void {
    this.trail.removeFromParent();
    this.trail.destroy();
    for (const segment of this.segments) {
      segment.removeFromParent();
      segment.destroy();
    }
    this.segments.length = 0;
    this.visibleCount = 0;
  }
}
