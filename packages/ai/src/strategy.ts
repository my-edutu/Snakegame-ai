export type StrategyMode = 'hunt' | 'explore' | 'expand' | 'escape' | 'tail-follow' | 'survival' | 'high-risk' | 'endgame' | 'hamiltonian' | 'recovery';

export interface StrategyState { readonly mode: StrategyMode; readonly ticksInMode: number }

export interface StrategySignals {
  readonly emergency: boolean;
  readonly allRisky: boolean;
  readonly safeMoves: number;
  readonly riskScore: number;
  readonly highOccupancy: boolean;
  readonly hamiltonianAvailable: boolean;
  readonly hamiltonianPreservable: boolean;
  readonly foodSafe: boolean;
  readonly tailPreferred: boolean;
  readonly expanding: boolean;
  readonly recovered: boolean;
}

function desiredMode(s: StrategySignals): StrategyMode {
  if (s.allRisky) return 'high-risk';
  if (s.emergency || s.safeMoves <= 1) return 'escape';
  if (s.highOccupancy && s.hamiltonianAvailable && s.hamiltonianPreservable) return 'hamiltonian';
  if (s.highOccupancy) return 'endgame';
  if (!s.foodSafe && s.tailPreferred) return 'tail-follow';
  if (!s.foodSafe) return 'survival';
  if (s.foodSafe && s.riskScore < 55) return 'hunt';
  if (s.expanding) return 'expand';
  if (s.recovered) return 'recovery';
  return 'explore';
}

export function selectStrategy(previous: StrategyState, signals: StrategySignals, minimumDwellTicks: number): StrategyState {
  const desired = desiredMode(signals);
  const emergencyOverride = desired === 'escape' || desired === 'high-risk';
  if (desired === previous.mode) return { mode: previous.mode, ticksInMode: previous.ticksInMode + 1 };
  if (!emergencyOverride && previous.ticksInMode < Math.max(0, minimumDwellTicks)) {
    return { mode: previous.mode, ticksInMode: previous.ticksInMode + 1 };
  }
  return { mode: desired, ticksInMode: 0 };
}
