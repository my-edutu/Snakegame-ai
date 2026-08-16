import type { SimulationRiskLevel } from './types.js';
export interface NearDeathState { readonly lastEventTick: number | null; readonly sequence: number }
export interface NearDeathEvidence { readonly tick: number; readonly safeMoves: number; readonly riskLevel: SimulationRiskLevel; readonly riskScore: number; readonly summary: string | null }
export interface NearDeathEvent extends NearDeathEvidence { readonly type: 'near-death'; readonly id: string }
export const createNearDeathState = (): NearDeathState => ({ lastEventTick: null, sequence: 0 });
export function detectNearDeathEvent(state: NearDeathState, evidence: NearDeathEvidence, options: { readonly minimumGapTicks: number }): { readonly state: NearDeathState; readonly event: NearDeathEvent | null } {
  if (!Number.isInteger(options.minimumGapTicks) || options.minimumGapTicks < 0) throw new RangeError('minimumGapTicks must be a nonnegative integer.');
  const dangerous = evidence.safeMoves <= 1 || evidence.riskLevel === 'critical' || (evidence.riskLevel === 'high' && evidence.riskScore >= 80);
  const gapOpen = state.lastEventTick === null || evidence.tick - state.lastEventTick >= options.minimumGapTicks;
  if (!dangerous || !gapOpen) return { state: { ...state }, event: null };
  const sequence = state.sequence + 1;
  return { state: { lastEventTick: evidence.tick, sequence }, event: { ...evidence, type: 'near-death', id: `near-death-${evidence.tick}-${sequence}` } };
}
