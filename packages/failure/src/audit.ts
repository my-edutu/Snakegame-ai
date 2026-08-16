import type { DeviationType } from './types.js';
export interface FailureAuditEvent {
  readonly id: string;
  readonly tick: number;
  readonly decisionSequence: number;
  readonly type: DeviationType;
  readonly baselineDirection: string | null;
  readonly appliedDirection: string | null;
  readonly baselineScore: number | null;
  readonly appliedScore: number | null;
  readonly probability: number;
  readonly draw01: number;
}
export interface PublicDeviationEvent { readonly id: string; readonly tick: number; readonly type: 'configured-deviation'; readonly direction: string | null }
export function toPublicDeviationEvent(event: FailureAuditEvent): PublicDeviationEvent { return { id: event.id, tick: event.tick, type: 'configured-deviation', direction: event.appliedDirection }; }
