import { describe, expect, it } from 'vitest';
import { RenderEventBuffer } from '../src/events.js';
import { FrameMetrics } from '../src/metrics.js';
import { BoundedPool } from '../src/pool.js';

class Particle {
  active = false;
}

describe('bounded renderer runtime structures', () => {
  it('never lets the reusable pool exceed its fixed capacity', () => {
    const pool = new BoundedPool(32, () => new Particle());
    for (let i = 0; i < 100_000; i += 1) {
      const value = pool.acquire();
      if (value) pool.release(value);
    }
    expect(pool.capacity).toBe(32);
    expect(pool.createdCount).toBeLessThanOrEqual(32);
    expect(pool.size).toBeLessThanOrEqual(32);
  });

  it('returns null rather than allocating when all pool entries are active', () => {
    const pool = new BoundedPool(2, () => new Particle());
    expect(pool.acquire()).not.toBeNull();
    expect(pool.acquire()).not.toBeNull();
    expect(pool.acquire()).toBeNull();
  });

  it('dedupes event ids, expires old events, and stays within its hard max', () => {
    const events = new RenderEventBuffer({ maxSize: 8, ttlTicks: 10 });
    for (let tick = 0; tick < 100; tick += 1) {
      events.push({ id: tick % 12, kind: 'milestone', label: `M${tick}`, tick }, tick);
    }
    events.push({ id: 99, kind: 'record', label: 'duplicate', tick: 99 }, 100);
    events.push({ id: 99, kind: 'record', label: 'duplicate', tick: 99 }, 100);
    expect(events.size).toBeLessThanOrEqual(8);
    expect(events.values().filter((event) => event.id === 99)).toHaveLength(1);
    expect(events.values().every((event) => event.tick >= 90)).toBe(true);
  });

  it('keeps only the configured rolling frame-time window after 100k samples', () => {
    const metrics = new FrameMetrics(120);
    for (let i = 0; i < 100_000; i += 1) metrics.record(8 + (i % 4));
    const snapshot = metrics.snapshot();
    expect(snapshot.sampleCount).toBe(120);
    expect(snapshot.averageFrameMs).toBeGreaterThan(0);
    expect(snapshot.peakFrameMs).toBeGreaterThanOrEqual(snapshot.averageFrameMs);
  });

  it('allows reset and destroy to be called repeatedly without growth or errors', () => {
    const pool = new BoundedPool(4, () => new Particle());
    pool.acquire();
    pool.reset();
    pool.reset();
    pool.destroy();
    pool.destroy();
    expect(pool.size).toBe(0);
    expect(pool.acquire()).toBeNull();
  });
});
