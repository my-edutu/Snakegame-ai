import { summarizeNumbers } from './percentiles.js';
import type { BatchOptions, SimulationBatchReport, SimulationRunResult, SimulationTerminalReason, StrategyEffectiveness } from './types.js';

const terminalOrder: readonly SimulationTerminalReason[] = ['death', 'board-filled', 'simulation-cap', 'no-move'];

function increment(map: Record<string, number>, key: string, amount = 1): void {
  map[key] = (map[key] ?? 0) + amount;
}

function sortedRecord(source: Readonly<Record<string, number>>): Readonly<Record<string, number>> {
  return Object.fromEntries(Object.entries(source).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
}

function rankedRecord(source: Readonly<Record<string, number>>, limit: number): Readonly<Record<string, number>> {
  return Object.fromEntries(Object.entries(source)
    .sort(([a, ac], [b, bc]) => bc - ac || (a < b ? -1 : a > b ? 1 : 0))
    .slice(0, limit));
}

function failureRank(a: SimulationRunResult, b: SimulationRunResult): number {
  return b.maxOccupancyPercent - a.maxOccupancyPercent || b.ticksSurvived - a.ticksSurvived || a.seed - b.seed;
}

interface StrategyAccumulator { runsUsed: number; deaths: number; boardFilled: number; occupancy: number; ticks: number }

export function aggregateRunResults(results: readonly SimulationRunResult[], options: BatchOptions = {}): SimulationBatchReport {
  const terminalCounts: Record<SimulationTerminalReason, number> = { death: 0, 'board-filled': 0, 'simulation-cap': 0, 'no-move': 0 };
  const deathCauses: Record<string, number> = {};
  const failurePatterns: Record<string, number> = {};
  const strategyTicks: Record<string, number> = {};
  const transitionCounts: Record<string, number> = {};
  const strategyOutcomes: Record<string, StrategyAccumulator> = {};
  let averageRiskSum = 0;
  let peakRisk = 0;
  let decisionNodeTotal = 0;
  let decisionPeak = 0;
  let nearDeathCount = 0;
  let hamiltonianEntries = 0;
  let hamiltonianTicks = 0;
  let levelCompleted = 0;

  for (const result of results) {
    terminalCounts[result.terminalReason] += 1;
    if (result.deathCause) increment(deathCauses, result.deathCause);
    if (result.terminalReason !== 'board-filled') {
      const context = result.terminalContext;
      const pattern = `${result.terminalReason}|cause:${result.deathCause ?? 'none'}|strategy:${context.strategy ?? 'none'}|risk:${context.riskLevel ?? 'none'}|safe:${context.safeMoves}`;
      increment(failurePatterns, pattern);
    }
    for (const [mode, ticks] of Object.entries(result.strategyTicks)) {
      increment(strategyTicks, mode, ticks);
      const outcome = strategyOutcomes[mode] ?? { runsUsed: 0, deaths: 0, boardFilled: 0, occupancy: 0, ticks: 0 };
      outcome.runsUsed += 1;
      outcome.deaths += result.terminalReason === 'death' ? 1 : 0;
      outcome.boardFilled += result.terminalReason === 'board-filled' ? 1 : 0;
      outcome.occupancy += result.maxOccupancyPercent;
      outcome.ticks += result.ticksSurvived;
      strategyOutcomes[mode] = outcome;
    }
    for (const transition of result.strategyTransitions) increment(transitionCounts, `${transition.from}->${transition.to}`);
    averageRiskSum += result.averageRisk;
    peakRisk = Math.max(peakRisk, result.peakRisk);
    decisionNodeTotal += result.totalDecisionNodes;
    decisionPeak = Math.max(decisionPeak, result.peakDecisionNodes);
    nearDeathCount += result.nearDeathCount;
    hamiltonianEntries += result.hamiltonianEntries;
    hamiltonianTicks += result.hamiltonianTicks;
    if (result.levelCompleted) levelCompleted += 1;
  }

  const effectiveness: Record<string, StrategyEffectiveness> = {};
  for (const [mode, value] of Object.entries(strategyOutcomes).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    effectiveness[mode] = {
      runsUsed: value.runsUsed,
      deaths: value.deaths,
      boardFilled: value.boardFilled,
      meanMaxOccupancyPercent: value.runsUsed === 0 ? 0 : value.occupancy / value.runsUsed,
      meanTicksSurvived: value.runsUsed === 0 ? 0 : value.ticks / value.runsUsed,
    };
  }

  const topN = Math.max(0, Math.min(results.length, Math.floor(options.topFailures ?? 10)));
  const failures = results.filter((result) => result.terminalReason !== 'board-filled').sort(failureRank).slice(0, topN);
  const runCount = results.length;

  return {
    schemaVersion: 1,
    runCount,
    terminalCounts: Object.fromEntries(terminalOrder.map((key) => [key, terminalCounts[key]])) as Record<SimulationTerminalReason, number>,
    deathCauses: sortedRecord(deathCauses),
    failurePatterns: rankedRecord(failurePatterns, 20),
    ticks: summarizeNumbers(results.map((result) => result.ticksSurvived)),
    maxLength: summarizeNumbers(results.map((result) => result.maxLength)),
    maxOccupancyPercent: summarizeNumbers(results.map((result) => result.maxOccupancyPercent)),
    score: summarizeNumbers(results.map((result) => result.score)),
    risk: { meanAverage: runCount === 0 ? 0 : averageRiskSum / runCount, peak: peakRisk },
    decisionNodes: { total: decisionNodeTotal, meanPerRun: runCount === 0 ? 0 : decisionNodeTotal / runCount, peakPerDecision: decisionPeak },
    nearDeathCount,
    strategyTicks: sortedRecord(strategyTicks),
    strategyTransitions: sortedRecord(transitionCounts),
    strategyEffectiveness: effectiveness,
    hamiltonian: { entries: hamiltonianEntries, ticks: hamiltonianTicks },
    levelFunnel: [{ level: 1, reached: runCount, completed: levelCompleted }],
    topFailures: failures,
    topReplays: [],
    ...(options.retainRuns ? { runs: results.map((result) => structuredClone(result)) } : {}),
  };
}
