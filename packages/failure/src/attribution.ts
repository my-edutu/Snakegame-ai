import type { FailureAuditEvent } from './audit.js';
export type FailureCategory = 'natural' | 'configured-deviation' | 'level-hazard' | 'operator-action' | 'unknown';
export type FailureAttribution =
  | Readonly<{ category: 'configured-deviation'; naturalCause: string; deviationId: string; contributory: true }>
  | Readonly<{ category: 'natural'; naturalCause: string; contributory: false }>;
export function attributeDeathToDeviation(input: Readonly<{ deathTick: number; naturalCause: string; recentDeviations: readonly FailureAuditEvent[]; causalWindowTicks: number }>): FailureAttribution {
  if (!Number.isInteger(input.causalWindowTicks) || input.causalWindowTicks < 0) throw new RangeError('causalWindowTicks must be a non-negative integer.');
  const eligible = input.recentDeviations.filter((event) => event.tick <= input.deathTick && input.deathTick - event.tick <= input.causalWindowTicks).sort((a, b) => b.tick - a.tick || b.decisionSequence - a.decisionSequence);
  const latest = eligible[0];
  return latest ? { category: 'configured-deviation', naturalCause: input.naturalCause, deviationId: latest.id, contributory: true } : { category: 'natural', naturalCause: input.naturalCause, contributory: false };
}
