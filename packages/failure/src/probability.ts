import type { FailureConfig, FailureContext } from './types.js';
function clamp(value: number, min: number, max: number): number { return Math.max(min, Math.min(max, value)); }
export function probabilityPerEligibleDecision(config: FailureConfig, decisionsPerSecond: number, context: FailureContext): number {
  if (!Number.isFinite(decisionsPerSecond) || decisionsPerSecond <= 0) throw new RangeError('decisionsPerSecond must be positive and finite.');
  if (!config.enabled) return 0;
  const targetPerMinute = config.probabilityPerMinute ?? ((config.targetFailuresPerHour ?? 0) / 60);
  const expectedDecisionsPerMinute = decisionsPerSecond * 60;
  const baseProbability = targetPerMinute <= 0 ? 0 : 1 - Math.exp(-targetPerMinute / expectedDecisionsPerMinute);
  const riskMultiplier = 1 + context.risk * (config.riskMultiplier ?? 0);
  const occupancyMultiplier = 1 + context.occupancyPercent * (config.occupancyMultiplier ?? 0);
  const levelMultiplier = 1 + Math.max(0, context.level - 1) * (config.levelMultiplier ?? 0);
  return clamp(baseProbability * riskMultiplier * occupancyMultiplier * levelMultiplier, 0, config.maximumProbabilityPerDecision);
}
export function shouldApplyDeviation(probability: number, draw01: number): boolean {
  if (!Number.isFinite(probability) || probability < 0 || probability > 1) throw new RangeError('probability must be in [0,1].');
  if (!Number.isFinite(draw01) || draw01 < 0 || draw01 >= 1) throw new RangeError('draw01 must be in [0,1).');
  return probability > 0 && draw01 < probability;
}
