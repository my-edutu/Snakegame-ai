import type { FailureConfig } from './types.js';

const base = { minimumEligibleRunTicks: 120, maximumProbabilityPerDecision: 0.02, naturalLookingOnly: true, deviationTypes: ['second-best-route', 'risky-corridor'] as const };
export const FAILURE_PRESETS: Readonly<Record<'Record Attempt' | 'Safe Stream' | 'Balanced Stream' | 'Chaos Stream' | 'Demo', FailureConfig>> = {
  'Record Attempt': { ...base, enabled: false, targetFailuresPerHour: 0 },
  'Safe Stream': { ...base, enabled: true, targetFailuresPerHour: 0.25, maximumProbabilityPerDecision: 0.002 },
  'Balanced Stream': { ...base, enabled: true, targetFailuresPerHour: 1.25, maximumProbabilityPerDecision: 0.01 },
  'Chaos Stream': { ...base, enabled: true, targetFailuresPerHour: 4, maximumProbabilityPerDecision: 0.04, naturalLookingOnly: false, deviationTypes: ['second-best-route', 'risky-corridor', 'food-over-weight', 'temporary-scoring-bias'] },
  Demo: { ...base, enabled: true, targetFailuresPerHour: 12, minimumEligibleRunTicks: 10, maximumProbabilityPerDecision: 0.08, naturalLookingOnly: false },
};
