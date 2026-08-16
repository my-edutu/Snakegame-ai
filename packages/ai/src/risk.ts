export interface RiskContributors {
  readonly safeMoves: number;
  readonly reachableAreaRatio: number;
  readonly escapeRouteCount: number;
  readonly occupancyRatio: number;
  readonly bodyPressure: number;
  readonly trapProbability: number;
  readonly lookaheadFailure: number;
  readonly topologyPressure: number;
}

export interface RiskAssessment {
  readonly score: number;
  readonly level: 'low' | 'moderate' | 'high' | 'critical';
  readonly contributors: RiskContributors;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export function assessRisk(input: RiskContributors): RiskAssessment {
  const contributors: RiskContributors = {
    safeMoves: Math.max(0, Math.min(4, input.safeMoves)),
    reachableAreaRatio: clamp01(input.reachableAreaRatio),
    escapeRouteCount: Math.max(0, Math.min(4, input.escapeRouteCount)),
    occupancyRatio: clamp01(input.occupancyRatio),
    bodyPressure: clamp01(input.bodyPressure),
    trapProbability: clamp01(input.trapProbability),
    lookaheadFailure: clamp01(input.lookaheadFailure),
    topologyPressure: clamp01(input.topologyPressure),
  };
  const weighted =
    (1 - contributors.safeMoves / 4) * 0.18 +
    (1 - contributors.reachableAreaRatio) * 0.18 +
    (1 - contributors.escapeRouteCount / 4) * 0.12 +
    contributors.occupancyRatio * 0.08 +
    contributors.bodyPressure * 0.08 +
    contributors.trapProbability * 0.18 +
    contributors.lookaheadFailure * 0.10 +
    contributors.topologyPressure * 0.08;
  const score = Math.max(0, Math.min(100, Math.round(weighted * 100)));
  const level = score >= 75 ? 'critical' : score >= 55 ? 'high' : score >= 30 ? 'moderate' : 'low';
  return { score, level, contributors };
}
