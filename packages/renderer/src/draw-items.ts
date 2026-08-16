import { Container, Graphics } from 'pixi.js';
import { BoundedPool } from './pool.js';
import type { RenderItem, ViewportTransform } from './types.js';

const ITEM_COLORS: Readonly<Record<string, string>> = {
  normal: '#55FF9A',
  rare: '#41D9FF',
  epic: '#B05CFF',
  bonus: '#FFD34D',
  speed: '#FF9A3D',
  multiplier: '#FF4ED8',
  mystery: '#F3F5FF',
};

export class ItemDrawableManager {
  private readonly layer: Container;
  private readonly pool: BoundedPool<Graphics>;
  private readonly active = new Map<string, Graphics>();
  private readonly all = new Set<Graphics>();
  private geometryKey = '';

  constructor(layer: Container, capacity = 32) {
    this.layer = layer;
    this.pool = new BoundedPool(capacity, () => {
      const graphic = new Graphics({ label: 'food-item' });
      graphic.visible = false;
      this.all.add(graphic);
      this.layer.addChild(graphic);
      return graphic;
    });
  }

  get createdCount(): number { return this.pool.createdCount; }
  get activeCount(): number { return this.active.size; }

  update(items: readonly RenderItem[], viewport: ViewportTransform): void {
    const nextIds = new Set(items.map((item) => item.id));
    for (const [id, graphic] of this.active) {
      if (nextIds.has(id)) continue;
      graphic.visible = false;
      this.active.delete(id);
      this.pool.release(graphic);
    }

    const nextGeometryKey = viewport.cellSize.toFixed(4);
    const geometryChanged = this.geometryKey !== nextGeometryKey;
    this.geometryKey = nextGeometryKey;

    for (const item of items) {
      let graphic = this.active.get(item.id);
      const isNew = !graphic;
      if (!graphic) {
        graphic = this.pool.acquire() ?? undefined;
        if (!graphic) continue;
        this.active.set(item.id, graphic);
      }
      graphic.visible = true;
      graphic.position.set(
        viewport.offsetX + (item.position.x + 0.5) * viewport.cellSize,
        viewport.offsetY + (item.position.y + 0.5) * viewport.cellSize,
      );
      if (isNew || geometryChanged || graphic.label !== `food-${item.type}`) {
        graphic.label = `food-${item.type}`;
        const radius = viewport.cellSize * (item.type === 'normal' ? 0.27 : 0.31);
        const color = ITEM_COLORS[item.type] ?? ITEM_COLORS['mystery']!;
        graphic.clear()
          .circle(0, 0, radius * 1.45)
          .fill({ color, alpha: 0.12 })
          .circle(0, 0, radius)
          .fill(color)
          .stroke({ color: '#FFFFFF', alpha: 0.65, width: Math.max(1, viewport.logicalScale) });
      }
    }
  }

  destroy(): void {
    this.active.clear();
    this.pool.destroy();
    for (const graphic of this.all) {
      graphic.removeFromParent();
      graphic.destroy();
    }
    this.all.clear();
  }
}
