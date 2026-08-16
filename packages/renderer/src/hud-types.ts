export type HudRiskBand = 'low' | 'guarded' | 'high' | 'critical';
export type HudLifecycle = 'playing' | 'celebrating' | 'awaiting-operator' | 'paused' | 'summary' | 'restart-countdown';
export type HudTargetUnit = 'percent' | 'score' | 'length' | 'level' | 'ticks' | 'count';

export interface HudLevelIdentity { number: number; name: string; total: number }
export interface HudRunState { number: number; elapsedTicks: number; tickDurationMs: number; levelStreak: number; lifecycle: HudLifecycle; countdownTicksRemaining: number }
export interface HudPrimaryMetrics { score: number; length: number; occupancyPercent: number; foodEaten: number; safeMoves: number; projectedMoves: number }
export interface HudRiskState { score: number; band: HudRiskBand }
export interface HudStrategyEvidence { label: string; trapRiskPercent: number | null; preservedEscapeRoutes: number | null; endgame: boolean; criticalSafeMoves: number | null }
export interface HudRecords { bestOccupancyPercent: number; highestLevel: number; deaths: number; totalGames: number; highScore: number; maxLength: number; longestSurvivalTicks: number }
export interface HudRecordTarget { id: string; label: string; current: number; target: number; unit: HudTargetUnit }
export interface HudRunSummary { score: number; maxLength: number; maxOccupancyPercent: number; foodEaten: number; ticksSurvived: number; levelReached: number; newRecords: readonly string[] }

export interface HudSnapshotInput {
  level: HudLevelIdentity;
  run: HudRunState;
  primary: HudPrimaryMetrics;
  risk: HudRiskState;
  strategy: HudStrategyEvidence;
  records: HudRecords;
  recordTarget: HudRecordTarget | null;
  runSummary: HudRunSummary | null;
  emittedEventIds: string[];
}

export interface HudSnapshot {
  readonly level: Readonly<HudLevelIdentity>;
  readonly run: Readonly<HudRunState>;
  readonly primary: Readonly<HudPrimaryMetrics>;
  readonly risk: Readonly<HudRiskState>;
  readonly strategy: Readonly<HudStrategyEvidence>;
  readonly records: Readonly<HudRecords>;
  readonly recordTarget: Readonly<HudRecordTarget> | null;
  readonly runSummary: (Readonly<Omit<HudRunSummary, 'newRecords'>> & { readonly newRecords: readonly string[] }) | null;
  readonly emittedEventIds: readonly string[];
}
