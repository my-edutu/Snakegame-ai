import type { EngineCommand } from './commands.js';
import type { EngineEvent } from './events.js';
import type { GameState, LifecycleState } from './state.js';

function withLifecycle(state: GameState, to: LifecycleState): Readonly<{ state: GameState; events: readonly EngineEvent[] }> {
  if (state.lifecycle === to) return { state, events: [] };
  return {
    state: { ...state, lifecycle: to },
    events: [{ type: 'LifecycleChanged', tick: state.tick, from: state.lifecycle, to }],
  };
}

export function applyLifecycleCommand(state: GameState, command: EngineCommand): Readonly<{ state: GameState; events: readonly EngineEvent[] }> {
  switch (command.type) {
    case 'Pause':
      return state.lifecycle === 'playing' ? withLifecycle(state, 'paused') : { state, events: [] };
    case 'Resume':
      return state.lifecycle === 'paused' ? withLifecycle(state, 'playing') : { state, events: [] };
    case 'StartNewGame':
    case 'RestartLevel':
      return withLifecycle(state, 'new-game');
  }
}
