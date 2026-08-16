export interface CandidateEvaluation {
  readonly direction: string;
  readonly legal: boolean;
  readonly hardRejected: boolean;
  readonly totalScore: number;
  readonly trapProbability: number;
  readonly reachableAreaRatio: number;
  readonly escapeRouteCount: number;
  readonly corridorDepth: number;
  readonly foodSafe: boolean;
  readonly predictedSurvivalTicks: number;
  readonly tailReachable: boolean;
  readonly hamiltonianPenalty: number;
}

const canonicalOrder = ['up', 'right', 'down', 'left'] as const;
const stableScore = (a: CandidateEvaluation, b: CandidateEvaluation): number => b.totalScore - a.totalScore || canonicalOrder.indexOf(a.direction as any) - canonicalOrder.indexOf(b.direction as any);

export function rankPolicyCandidates(type: string, baselineDirection: string | null, evaluations: readonly CandidateEvaluation[]): readonly CandidateEvaluation[] {
  const alternatives = evaluations.filter((item) => item.legal && !item.hardRejected && item.direction !== baselineDirection);
  switch (type) {
    case 'risky-corridor': return [...alternatives].sort((a, b) => b.trapProbability - a.trapProbability || a.escapeRouteCount - b.escapeRouteCount || stableScore(a, b));
    case 'food-over-weight': return [...alternatives].sort((a, b) => Number(b.foodSafe) - Number(a.foodSafe) || (a.predictedSurvivalTicks - b.predictedSurvivalTicks) || stableScore(a, b));
    case 'delayed-tail-follow': return [...alternatives].sort((a, b) => Number(a.tailReachable) - Number(b.tailReachable) || stableScore(a, b));
    case 'reduced-lookahead': return [...alternatives].sort((a, b) => a.predictedSurvivalTicks - b.predictedSurvivalTicks || stableScore(a, b));
    case 'temporary-scoring-bias': return [...alternatives].sort((a, b) => b.reachableAreaRatio - a.reachableAreaRatio || stableScore(a, b));
    case 'second-best-route':
    default: return [...alternatives].sort(stableScore);
  }
}
