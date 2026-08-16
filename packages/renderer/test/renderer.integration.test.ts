import { Container } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { SnakeRenderer, type RendererHost, type RendererHostFactory } from '../src/renderer.js';
import { createRenderFrame } from '../src/frame.js';

class FakeTicker {
  callbacks = new Set<(elapsedMs: number) => void>();
  add(callback: (elapsedMs: number) => void): void { this.callbacks.add(callback); }
  remove(callback: (elapsedMs: number) => void): void { this.callbacks.delete(callback); }
}

class ThrowingTicker extends FakeTicker {
  override add(): void { throw new Error('ticker-add-failed'); }
}

class FakeHost implements RendererHost {
  readonly stage = new Container();
  readonly ticker: FakeTicker;
  resizeCalls = 0;
  destroyCalls = 0;

  constructor(ticker: FakeTicker = new FakeTicker()) {
    this.ticker = ticker;
  }

  resize(): void { this.resizeCalls += 1; }
  destroy(): void {
    this.destroyCalls += 1;
    if (!this.stage.destroyed) this.stage.destroy({ children: true });
  }
}

const deferred = <T>(): {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
  readonly reject: (reason?: unknown) => void;
} => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });
  return { promise, resolve, reject };
};

const frame = () => createRenderFrame({
  tick: 1,
  tickDurationMs: 100,
  level: { id: 'level-01', name: 'Genesis', width: 12, height: 8, themeKey: 'neon-grid' },
  lifecycle: 'playing',
  snake: { direction: 'right', body: [{ x: 3, y: 4 }, { x: 2, y: 4 }, { x: 1, y: 4 }] },
  items: [{ id: 'f', type: 'normal', position: { x: 8, y: 4 }, value: 1 }],
  environment: { obstacles: [], hazards: [], portals: [] },
  hud: { score: 0, length: 3, occupancyPercent: 3, risk: 10, strategy: 'hunt' },
  events: [],
});

describe('SnakeRenderer lifecycle', () => {
  it('initializes exactly one scene root and one ticker callback', async () => {
    const host = new FakeHost();
    const factory: RendererHostFactory = async () => host;
    const renderer = new SnakeRenderer({ hostFactory: factory });
    await renderer.init({ width: 1920, height: 1080 });
    expect(host.stage.children).toHaveLength(1);
    expect(host.ticker.callbacks.size).toBe(1);
    renderer.destroy();
  });

  it('accepts frames and style switches without duplicating scene roots', async () => {
    const host = new FakeHost();
    const renderer = new SnakeRenderer({ hostFactory: async () => host });
    await renderer.init({ width: 1920, height: 1080 });
    renderer.renderFrame(frame());
    renderer.setSkin('void');
    renderer.setTheme('cosmic-void');
    renderer.setQuality('cinematic');
    renderer.renderFrame(frame());
    expect(host.stage.children).toHaveLength(1);
    expect(renderer.getState()).toMatchObject({ skinId: 'void', themeId: 'cosmic-void', qualityId: 'cinematic' });
    renderer.destroy();
  });

  it('rejects invalid resize and safely resizes valid dimensions', async () => {
    const host = new FakeHost();
    const renderer = new SnakeRenderer({ hostFactory: async () => host });
    await renderer.init({ width: 1920, height: 1080 });
    expect(() => renderer.resize(0, 1080)).toThrow();
    renderer.resize(2560, 1440);
    expect(host.resizeCalls).toBe(1);
    renderer.destroy();
  });

  it('destroys idempotently and removes ticker callbacks/resources', async () => {
    const host = new FakeHost();
    const renderer = new SnakeRenderer({ hostFactory: async () => host });
    await renderer.init({ width: 1920, height: 1080 });
    renderer.destroy();
    renderer.destroy();
    expect(host.ticker.callbacks.size).toBe(0);
    expect(host.destroyCalls).toBe(1);
  });

  it('falls back safely for unknown style ids and surfaces warnings', async () => {
    const host = new FakeHost();
    const renderer = new SnakeRenderer({ hostFactory: async () => host });
    await renderer.init({ width: 1920, height: 1080 });
    renderer.setSkin('missing');
    renderer.setTheme('missing');
    renderer.setQuality('missing');
    expect(renderer.getState()).toMatchObject({ skinId: 'emerald', themeId: 'neon-grid', qualityId: 'balanced' });
    expect(renderer.getWarnings().length).toBe(3);
    renderer.destroy();
  });

  it('rejects concurrent initialization before creating a second host or scene', async () => {
    const pendingHost = deferred<RendererHost>();
    const host = new FakeHost();
    let factoryCalls = 0;
    const renderer = new SnakeRenderer({
      hostFactory: () => {
        factoryCalls += 1;
        return pendingHost.promise;
      },
    });

    const first = renderer.init({ width: 1920, height: 1080 });
    const second = renderer.init({ width: 1920, height: 1080 });
    pendingHost.resolve(host);
    const outcomes = await Promise.allSettled([first, second]);
    renderer.destroy();

    expect(factoryCalls).toBe(1);
    expect(outcomes[0]?.status).toBe('fulfilled');
    expect(outcomes[1]?.status).toBe('rejected');
    expect(host.destroyCalls).toBe(1);
  });

  it('destroys a host that resolves after the renderer was destroyed during initialization', async () => {
    const pendingHost = deferred<RendererHost>();
    const host = new FakeHost();
    const renderer = new SnakeRenderer({ hostFactory: () => pendingHost.promise });

    const initialization = renderer.init({ width: 1920, height: 1080 });
    renderer.destroy();
    pendingHost.resolve(host);
    const outcome = await Promise.allSettled([initialization]);

    expect(outcome[0]?.status).toBe('rejected');
    expect(host.destroyCalls).toBe(1);
    expect(host.ticker.callbacks.size).toBe(0);
    expect(host.stage.children).toHaveLength(0);
    expect(renderer.getState().initialized).toBe(false);
  });

  it('rolls back the host and scene when initialization fails after host creation', async () => {
    const host = new FakeHost(new ThrowingTicker());
    const renderer = new SnakeRenderer({ hostFactory: async () => host });

    await expect(renderer.init({ width: 1920, height: 1080 })).rejects.toThrow('ticker-add-failed');
    expect(renderer.getState().initialized).toBe(false);
    expect(host.destroyCalls).toBe(1);
    renderer.destroy();
    expect(host.destroyCalls).toBe(1);
  });
});
