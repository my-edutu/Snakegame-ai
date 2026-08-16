import { createBaselineConfig } from './config.js';
import { createEngine } from './runtime.js';
import type { Direction } from '@snake/shared';

export function runHeadless(seed = 845732916, steps = 24): Readonly<{ seed: number; tick: number; score: number; length: number; lifecycle: string }> {
  const engine = createEngine(createBaselineConfig(seed));
  const cycle: readonly Direction[] = ['right', 'down', 'left', 'up'];
  for (let i = 0; i < steps && engine.getState().snake.alive; i += 1) {
    engine.step(cycle[i % cycle.length]);
  }
  const state = engine.getState();
  return { seed, tick: state.tick, score: state.score.score, length: state.snake.body.length, lifecycle: state.lifecycle };
}

const runtimeProcess = (globalThis as { process?: { argv?: readonly string[] } }).process;
const entryPath = runtimeProcess?.argv?.[1];
if (entryPath && import.meta.url === `file://${entryPath}`) {
  console.log(JSON.stringify(runHeadless()));
}
