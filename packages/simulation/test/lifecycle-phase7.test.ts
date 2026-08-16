import { describe, expect, it } from 'vitest';
import * as simulation from '../src/index.js';

const get = (name: string) => Reflect.get(simulation, name) as any;
const cfg = { levelCount: 20, restartDelayTicks: 3, celebrationTicks: 2 };

describe('Phase 7 lifecycle reducer', () => {
  it('exports lifecycle APIs', () => {
    for (const name of ['createLifecycleState','reduceLifecycle','completeLevel','endRun']) expect(typeof get(name)).toBe('function');
  });

  it('supports all completion policies', () => {
    const create = get('createLifecycleState'); const complete = get('completeLevel'); const reduce = get('reduceLifecycle'); if (!create || !complete || !reduce) return;
    const base = create(cfg);
    expect(complete(base, 'immediate-advance', cfg)).toMatchObject({ phase: 'playing', currentLevel: 2, levelStreak: 1 });
    const celebrating = complete(base, 'celebration-then-advance', cfg);
    expect(celebrating).toMatchObject({ phase: 'celebrating', currentLevel: 1, pendingLevel: 2, celebrationTicksRemaining: 2 });
    expect(reduce(reduce(celebrating, { type: 'tick' }, cfg), { type: 'tick' }, cfg)).toMatchObject({ phase: 'playing', currentLevel: 2 });
    expect(complete(base, 'pause', cfg)).toMatchObject({ phase: 'paused', pendingLevel: 2 });
    expect(complete(base, 'operator-confirm', cfg)).toMatchObject({ phase: 'awaiting-operator', pendingLevel: 2 });
  });

  it('flows death to summary to countdown to a fresh run and resets streak', () => {
    const create = get('createLifecycleState'); const endRun = get('endRun'); const reduce = get('reduceLifecycle'); if (!create || !endRun || !reduce) return;
    let state = { ...create(cfg), currentLevel: 8, levelStreak: 7 };
    state = endRun(state, cfg);
    expect(state).toMatchObject({ phase: 'summary', levelStreak: 0, currentLevel: 8, runNumber: 1 });
    state = reduce(state, { type: 'tick' }, cfg);
    expect(state).toMatchObject({ phase: 'restart-countdown', countdownTicksRemaining: 3 });
    state = reduce(state, { type: 'tick' }, cfg);
    state = reduce(state, { type: 'tick' }, cfg);
    state = reduce(state, { type: 'tick' }, cfg);
    expect(state).toMatchObject({ phase: 'playing', runNumber: 2, currentLevel: 1, levelStreak: 0 });
  });

  it('represents every manual command as a valid deterministic transition', () => {
    const create = get('createLifecycleState'); const reduce = get('reduceLifecycle'); if (!create || !reduce) return;
    const base = { ...create(cfg), currentLevel: 5, levelStreak: 4 };
    expect(reduce(base, { type: 'pause' }, cfg).phase).toBe('paused');
    expect(reduce(reduce(base, { type: 'pause' }, cfg), { type: 'resume' }, cfg).phase).toBe('playing');
    expect(reduce(base, { type: 'next-level' }, cfg).currentLevel).toBe(6);
    expect(reduce(base, { type: 'previous-level' }, cfg).currentLevel).toBe(4);
    expect(reduce(base, { type: 'skip-level' }, cfg)).toMatchObject({ currentLevel: 6, levelStreak: 4 });
    expect(reduce(base, { type: 'restart-current-level' }, cfg)).toMatchObject({ currentLevel: 5, phase: 'playing' });
    expect(reduce(base, { type: 'new-game' }, cfg)).toMatchObject({ currentLevel: 1, runNumber: 2, levelStreak: 0 });
    expect(reduce(base, { type: 'reset-run' }, cfg)).toMatchObject({ currentLevel: 1, runNumber: 2, levelStreak: 0 });
    const awaiting = { ...base, phase: 'awaiting-operator', pendingLevel: 6 };
    expect(reduce(awaiting, { type: 'confirm-level-advance' }, cfg)).toMatchObject({ phase: 'playing', currentLevel: 6 });
  });
});
