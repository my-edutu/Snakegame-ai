import type { SurvivalDecisionConfig, StrategyMode } from '@snake/ai';
import type { DeathCause, EngineConfig } from '@snake/engine';

export type SimulationTerminalReason = 'death' | 'board-filled' | 'simulation-cap' | 'no-move';
export type SimulationRiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface SimulationHarnessConfig {
  readonly maxTicks: number;
}

export interface StrategyTransition {
  readonly from: StrategyMode;
  readonly to: StrategyMode;
  readonly tick: number;
}

export interface TerminalDecisionContext {
  readonly strategy: StrategyMode | null;
  readonly riskLevel: SimulationRiskLevel | null;
  readonly riskScore: number;
  readonly safeMoves: number;
  readonly summary: string | null;
}

export interface SimulationRunResult {
  readonly seed: number;
  readonly terminalReason: SimulationTerminalReason;
  readonly deathCause: DeathCause | null;
  readonly ticksSurvived: number;
  readonly maxLength: number;
  readonly maxOccupancyPercent: number;
  readonly score: number;
  readonly foodConsumed: number;
  readonly strategyTicks: Readonly<Record<string, number>>;
  readonly strategyTransitions: readonly StrategyTransition[];
  readonly averageRisk: number;
  readonly peakRisk: number;
  readonly totalDecisionNodes: number;
  readonly averageDecisionNodes: number;
  readonly peakDecisionNodes: number;
  readonly nearDeathCount: number;
  readonly hamiltonianEntries: number;
  readonly hamiltonianTicks: number;
  readonly terminalContext: TerminalDecisionContext;
  readonly levelReached: 1;
  readonly levelCompleted: boolean;
}

export interface SimulationExecutionConfig {
  readonly engine: EngineConfig;
  readonly ai?: Partial<SurvivalDecisionConfig>;
  readonly harness: SimulationHarnessConfig;
}

export interface BatchOptions {
  readonly retainRuns?: boolean;
  readonly topFailures?: number;
}

export interface NumericSummary {
  readonly min: number;
  readonly max: number;
  readonly mean: number;
  readonly p50: number;
  readonly p95: number;
  readonly p99: number;
}

export interface ReplayArtifact {
  readonly schemaVersion: 1;
  readonly seed: number;
  readonly fileName: string;
  readonly execution: SimulationExecutionConfig;
  readonly expected: SimulationRunResult;
  readonly command: string;
}

export interface StrategyEffectiveness {
  readonly runsUsed: number;
  readonly deaths: number;
  readonly boardFilled: number;
  readonly meanMaxOccupancyPercent: number;
  readonly meanTicksSurvived: number;
}

export interface SimulationBatchReport {
  readonly schemaVersion: 1;
  readonly runCount: number;
  readonly terminalCounts: Readonly<Record<SimulationTerminalReason, number>>;
  readonly deathCauses: Readonly<Record<string, number>>;
  readonly failurePatterns: Readonly<Record<string, number>>;
  readonly ticks: NumericSummary;
  readonly maxLength: NumericSummary;
  readonly maxOccupancyPercent: NumericSummary;
  readonly score: NumericSummary;
  readonly risk: Readonly<{ meanAverage: number; peak: number }>;
  readonly decisionNodes: Readonly<{ total: number; meanPerRun: number; peakPerDecision: number }>;
  readonly nearDeathCount: number;
  readonly strategyTicks: Readonly<Record<string, number>>;
  readonly strategyTransitions: Readonly<Record<string, number>>;
  readonly strategyEffectiveness: Readonly<Record<string, StrategyEffectiveness>>;
  readonly hamiltonian: Readonly<{ entries: number; ticks: number }>;
  readonly levelFunnel: readonly [{ readonly level: 1; readonly reached: number; readonly completed: number }];
  readonly topFailures: readonly SimulationRunResult[];
  readonly topReplays: readonly ReplayArtifact[];
  readonly runs?: readonly SimulationRunResult[];
}
