export const DEVIATION_TYPES = ['second-best-route', 'reduced-lookahead', 'food-over-weight', 'delayed-tail-follow', 'risky-corridor', 'temporary-scoring-bias'] as const;
export type DeviationType = (typeof DEVIATION_TYPES)[number];

export interface FailureConfig {
  readonly enabled: boolean;
  readonly targetFailuresPerHour?: number;
  readonly probabilityPerMinute?: number;
  readonly minimumEligibleRunTicks: number;
  readonly maximumRunTicks?: number;
  readonly maximumProbabilityPerDecision: number;
  readonly minimumLevel?: number;
  readonly maximumLevel?: number;
  readonly minimumRisk?: number;
  readonly minimumLength?: number;
  readonly minimumOccupancyPercent?: number;
  readonly naturalLookingOnly: boolean;
  readonly deviationTypes: readonly DeviationType[];
  readonly riskMultiplier?: number;
  readonly occupancyMultiplier?: number;
  readonly levelMultiplier?: number;
}

export interface FailureContext {
  readonly tick: number;
  readonly level: number;
  readonly risk: number;
  readonly length: number;
  readonly occupancyPercent: number;
}

export type FailureEligibilityReason = 'eligible' | 'disabled' | 'before-minimum-runtime' | 'after-maximum-runtime' | 'below-level' | 'above-level' | 'below-risk' | 'below-length' | 'below-occupancy';
export interface FailureEligibility { readonly eligible: boolean; readonly reason: FailureEligibilityReason }
