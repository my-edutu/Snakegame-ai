import type { RenderEvent } from './types.js';

export interface RenderEventBufferConfig {
  readonly maxSize: number;
  readonly ttlTicks: number;
}

export class RenderEventBuffer {
  private readonly maxSize: number;
  private readonly ttlTicks: number;
  private events: RenderEvent[] = [];
  private destroyed = false;

  constructor(config: RenderEventBufferConfig) {
    if (!Number.isInteger(config.maxSize) || config.maxSize <= 0) throw new Error('maxSize must be a positive integer');
    if (!Number.isFinite(config.ttlTicks) || config.ttlTicks < 0) throw new Error('ttlTicks must be non-negative');
    this.maxSize = config.maxSize;
    this.ttlTicks = config.ttlTicks;
  }

  get size(): number {
    return this.events.length;
  }

  push(event: RenderEvent, currentTick: number): boolean {
    if (this.destroyed) return false;
    this.prune(currentTick);
    if (this.events.some((existing) => existing.id === event.id)) return false;
    this.events.push({ ...event });
    if (this.events.length > this.maxSize) this.events.splice(0, this.events.length - this.maxSize);
    return true;
  }

  values(): readonly RenderEvent[] {
    return this.events.map((event) => ({ ...event }));
  }

  prune(currentTick: number): void {
    const threshold = currentTick - this.ttlTicks;
    this.events = this.events.filter((event) => event.tick >= threshold);
  }

  reset(): void {
    if (!this.destroyed) this.events = [];
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.events = [];
  }
}
