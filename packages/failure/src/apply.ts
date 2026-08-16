import { rankPolicyCandidates } from './policies.js';
import type { DeviationType } from './types.js';

export interface DeviationDecisionLike {
  readonly direction: string | null;
  readonly evaluations: readonly any[];
}
export interface DeviationApplication {
  readonly applied: boolean;
  readonly direction: string | null;
  readonly baselineDirection: string | null;
  readonly baselineScore: number | null;
  readonly appliedScore: number | null;
  readonly type: DeviationType;
}

function naturalEnough(candidate: any, baseline: any): boolean {
  if (!baseline) return true;
  const scoreFloor = baseline.totalScore - Math.max(35, Math.abs(baseline.totalScore) * 0.4);
  return candidate.totalScore >= scoreFloor && candidate.trapProbability <= Math.min(0.85, baseline.trapProbability + 0.45) && candidate.escapeRouteCount > 0;
}

export function applyConfiguredDeviation(input: Readonly<{ decision: DeviationDecisionLike; deviationType: DeviationType; naturalLookingOnly: boolean; draw01: number }>): DeviationApplication {
  if (!Number.isFinite(input.draw01) || input.draw01 < 0 || input.draw01 >= 1) throw new RangeError('draw01 must be in [0,1).');
  const baseline = input.decision.evaluations.find((item: any) => item.direction === input.decision.direction) ?? null;
  let candidates = rankPolicyCandidates(input.deviationType, input.decision.direction, input.decision.evaluations);
  if (input.naturalLookingOnly) candidates = candidates.filter((candidate) => naturalEnough(candidate, baseline));
  if (candidates.length === 0) return { applied: false, direction: input.decision.direction, baselineDirection: input.decision.direction, baselineScore: baseline?.totalScore ?? null, appliedScore: baseline?.totalScore ?? null, type: input.deviationType };
  const index = Math.min(candidates.length - 1, Math.floor(input.draw01 * candidates.length));
  const chosen = candidates[index]!;
  return { applied: chosen.direction !== input.decision.direction, direction: chosen.direction, baselineDirection: input.decision.direction, baselineScore: baseline?.totalScore ?? null, appliedScore: chosen.totalScore, type: input.deviationType };
}
