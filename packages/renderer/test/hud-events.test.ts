import { describe, expect, it } from 'vitest';
import { HudEventQueue } from '../src/hud-events.js';

const event = (id: string, kind: 'record' | 'critical-survival' | 'near-death' | 'level-complete' | 'milestone' | 'strategy-change', tick: number) => ({ id, kind, label: id.toUpperCase(), tick, durationTicks: 20 });

describe('HudEventQueue', () => {
  it('dedupes ids and stays hard bounded', () => {
    const queue = new HudEventQueue({ capacity: 16, categoryCooldownTicks: 10 });
    expect(queue.push(event('same', 'milestone', 1))).toBe(true);
    expect(queue.push(event('same', 'milestone', 2))).toBe(false);
    for (let i = 0; i < 10_000; i += 1) queue.push(event(`e-${i}`, 'strategy-change', 100 + i));
    expect(queue.size).toBeLessThanOrEqual(16);
    queue.reset();
    expect(queue.size).toBe(0);
    queue.destroy();
    queue.destroy();
    expect(queue.size).toBe(0);
  });

  it('selects events by deterministic spectator priority', () => {
    const queue = new HudEventQueue({ capacity: 16, categoryCooldownTicks: 0 });
    queue.push(event('strategy', 'strategy-change', 1));
    queue.push(event('milestone', 'milestone', 1));
    queue.push(event('level', 'level-complete', 1));
    queue.push(event('near', 'near-death', 1));
    queue.push(event('record', 'record', 1));
    expect(queue.active(1)?.kind).toBe('record');
  });

  it('applies category cooldowns without suppressing records', () => {
    const queue = new HudEventQueue({ capacity: 16, categoryCooldownTicks: 50 });
    expect(queue.push(event('m1', 'milestone', 10))).toBe(true);
    expect(queue.push(event('m2', 'milestone', 20))).toBe(false);
    expect(queue.push(event('r1', 'record', 21))).toBe(true);
  });

  it('expires completed events and advances to the next eligible item', () => {
    const queue = new HudEventQueue({ capacity: 16, categoryCooldownTicks: 0 });
    queue.push(event('m1', 'milestone', 0));
    queue.push(event('s1', 'strategy-change', 0));
    expect(queue.active(0)?.id).toBe('m1');
    queue.advance(25);
    expect(queue.active(25)?.id).toBe('s1');
  });
});
