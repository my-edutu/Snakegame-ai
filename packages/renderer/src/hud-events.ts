export type HudEngagementEventKind = 'record' | 'critical-survival' | 'near-death' | 'level-complete' | 'milestone' | 'strategy-change';

export interface HudEngagementEvent {
  readonly id: string;
  readonly kind: HudEngagementEventKind;
  readonly label: string;
  readonly tick: number;
  readonly durationTicks: number;
}

export interface HudEventQueueOptions { readonly capacity: number; readonly categoryCooldownTicks: number }

const PRIORITY: Readonly<Record<HudEngagementEventKind, number>> = Object.freeze({
  record: 5,
  'critical-survival': 4,
  'near-death': 4,
  'level-complete': 3,
  milestone: 2,
  'strategy-change': 1,
});

const validEvent = (event: HudEngagementEvent): void => {
  if (event.id.trim().length === 0 || event.label.trim().length === 0) throw new RangeError('HUD event id and label must not be empty.');
  if (!Number.isInteger(event.tick) || event.tick < 0 || !Number.isInteger(event.durationTicks) || event.durationTicks < 1) throw new RangeError('HUD event ticks must be valid integers.');
};

export class HudEventQueue {
  private readonly capacity: number;
  private readonly categoryCooldownTicks: number;
  private readonly pending: HudEngagementEvent[] = [];
  private readonly seenIds = new Set<string>();
  private readonly seenOrder: string[] = [];
  private readonly lastAcceptedByKind = new Map<HudEngagementEventKind, number>();
  private destroyed = false;

  constructor(options: HudEventQueueOptions) {
    if (!Number.isInteger(options.capacity) || options.capacity < 1) throw new RangeError('capacity must be a positive integer.');
    if (!Number.isInteger(options.categoryCooldownTicks) || options.categoryCooldownTicks < 0) throw new RangeError('categoryCooldownTicks must be a nonnegative integer.');
    this.capacity = options.capacity;
    this.categoryCooldownTicks = options.categoryCooldownTicks;
  }

  get size(): number { return this.pending.length; }

  push(event: HudEngagementEvent): boolean {
    if (this.destroyed) return false;
    validEvent(event);
    if (this.seenIds.has(event.id)) return false;
    const previousTick = this.lastAcceptedByKind.get(event.kind);
    const bypassCooldown = event.kind === 'record';
    if (!bypassCooldown && previousTick !== undefined && event.tick - previousTick < this.categoryCooldownTicks) return false;

    const stored = Object.freeze({ ...event });
    if (this.pending.length >= this.capacity) {
      let worstIndex = 0;
      for (let i = 1; i < this.pending.length; i += 1) {
        const current = this.pending[i]!;
        const worst = this.pending[worstIndex]!;
        if (PRIORITY[current.kind] < PRIORITY[worst.kind] || (PRIORITY[current.kind] === PRIORITY[worst.kind] && current.tick < worst.tick)) worstIndex = i;
      }
      const worst = this.pending[worstIndex]!;
      if (PRIORITY[stored.kind] < PRIORITY[worst.kind]) return false;
      this.pending.splice(worstIndex, 1);
    }

    this.pending.push(stored);
    this.lastAcceptedByKind.set(event.kind, event.tick);
    this.remember(event.id);
    return true;
  }

  active(tick: number): HudEngagementEvent | null {
    if (!Number.isInteger(tick) || tick < 0) throw new RangeError('tick must be a nonnegative integer.');
    this.removeExpired(tick);
    let selected: HudEngagementEvent | null = null;
    for (const candidate of this.pending) {
      if (candidate.tick > tick) continue;
      if (selected === null || PRIORITY[candidate.kind] > PRIORITY[selected.kind] || (PRIORITY[candidate.kind] === PRIORITY[selected.kind] && candidate.tick < selected.tick)) selected = candidate;
    }
    return selected;
  }

  advance(tick: number): void { this.removeExpired(tick); }

  reset(): void {
    this.pending.length = 0;
    this.seenIds.clear();
    this.seenOrder.length = 0;
    this.lastAcceptedByKind.clear();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.reset();
    this.destroyed = true;
  }

  private removeExpired(tick: number): void {
    for (let i = this.pending.length - 1; i >= 0; i -= 1) {
      const candidate = this.pending[i]!;
      if (tick >= candidate.tick + candidate.durationTicks) this.pending.splice(i, 1);
    }
  }

  private remember(id: string): void {
    this.seenIds.add(id);
    this.seenOrder.push(id);
    const maxSeen = this.capacity * 8;
    while (this.seenOrder.length > maxSeen) {
      const old = this.seenOrder.shift();
      if (old !== undefined) this.seenIds.delete(old);
    }
  }
}
