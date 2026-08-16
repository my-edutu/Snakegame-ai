import { createObservation, decideSurvivalMove, type StrategyState } from '@snake/ai';
import { createEngine, type EngineConfig } from '@snake/engine';
import type { SimulationExecutionConfig, SimulationRunResult, SimulationTerminalReason, StrategyTransition } from './types.js';

const initialStrategy = (): StrategyState => ({ mode: 'explore', ticksInMode: 10_000 });

function validateHarness(maxTicks: number): void {
  if (!Number.isInteger(maxTicks) || maxTicks < 1 || maxTicks > 10_000_000) {
    throw new RangeError('maxTicks must be an integer in 1..10000000.');
  }
}

function seededEngineConfig(config: EngineConfig, seed: number): EngineConfig {
  return structuredClone({ ...config, seed: seed >>> 0 });
}

export function runSimulation(seed: number, execution: SimulationExecutionConfig): SimulationRunResult {
  validateHarness(execution.harness.maxTicks);
  if (!Number.isInteger(seed)) throw new TypeError('Simulation seed must be an integer.');

  const engine = createEngine(seededEngineConfig(execution.engine, seed));
  let strategy = initialStrategy();
  const strategyTicks: Record<string, number> = {};
  const transitions: StrategyTransition[] = [];
  let riskSum = 0;
  let peakRisk = 0;
  let totalDecisionNodes = 0;
  let peakDecisionNodes = 0;
  let decisionCount = 0;
  let nearDeathCount = 0;
  let hamiltonianEntries = 0;
  let hamiltonianTicks = 0;
  let terminalReason: SimulationTerminalReason = 'simulation-cap';

  for (let index = 0; index < execution.harness.maxTicks; index += 1) {
    const before = engine.getState();
    if (!before.snake.alive || before.lifecycle === 'death') { terminalReason = 'death'; break; }
    if (before.progression.boardFilled) { terminalReason = 'board-filled'; break; }

    const decision = decideSurvivalMove(createObservation(before), strategy, execution.ai ?? {});
    decisionCount += 1;
    riskSum += decision.risk.score;
    peakRisk = Math.max(peakRisk, decision.risk.score);
    totalDecisionNodes += decision.nodesEvaluated;
    peakDecisionNodes = Math.max(peakDecisionNodes, decision.nodesEvaluated);
    if (decision.risk.contributors.safeMoves <= 1) nearDeathCount += 1;

    if (decision.strategy.mode !== strategy.mode) {
      transitions.push({ from: strategy.mode, to: decision.strategy.mode, tick: before.tick });
      if (decision.strategy.mode === 'hamiltonian') hamiltonianEntries += 1;
    }
    strategy = decision.strategy;
    strategyTicks[strategy.mode] = (strategyTicks[strategy.mode] ?? 0) + 1;
    if (strategy.mode === 'hamiltonian') hamiltonianTicks += 1;

    if (!decision.direction) { terminalReason = 'no-move'; break; }
    engine.step(decision.direction);

    const after = engine.getState();
    if (!after.snake.alive || after.lifecycle === 'death') { terminalReason = 'death'; break; }
    if (after.progression.boardFilled) { terminalReason = 'board-filled'; break; }
  }

  const state = engine.getState();
  return {
    seed: seed >>> 0,
    terminalReason,
    deathCause: state.lastDeath?.cause ?? null,
    ticksSurvived: state.run.ticksSurvived,
    maxLength: state.run.maxLength,
    maxOccupancyPercent: state.run.maxOccupancyPercent,
    score: state.score.score,
    foodConsumed: state.score.foodEaten,
    strategyTicks,
    strategyTransitions: transitions,
    averageRisk: decisionCount === 0 ? 0 : riskSum / decisionCount,
    peakRisk,
    totalDecisionNodes,
    averageDecisionNodes: decisionCount === 0 ? 0 : totalDecisionNodes / decisionCount,
    peakDecisionNodes,
    nearDeathCount,
    hamiltonianEntries,
    hamiltonianTicks,
    levelReached: 1,
    levelCompleted: terminalReason === 'board-filled',
  };
}
