import type { HudRecordTarget, HudSnapshot, HudStrategyEvidence } from './hud-types.js';

const assertTimeInputs = (ticks: number, tickDurationMs: number): void => {
  if (!Number.isFinite(ticks) || ticks < 0 || !Number.isFinite(tickDurationMs) || tickDurationMs <= 0) throw new RangeError('ticks must be nonnegative and tickDurationMs must be positive.');
};

export function formatHudDuration(elapsedTicks: number, tickDurationMs: number): string {
  assertTimeInputs(elapsedTicks, tickDurationMs);
  const totalSeconds = Math.floor((elapsedTicks * tickDurationMs) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${String(hours).padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatCountdown(ticksRemaining: number, tickDurationMs: number): string {
  assertTimeInputs(ticksRemaining, tickDurationMs);
  if (ticksRemaining === 0) return '0';
  return String(Math.ceil((ticksRemaining * tickDurationMs) / 1000));
}

const neutralLabel = (label: string): string => label.trim().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').toUpperCase();

export function derivePublicStrategyCopy(evidence: HudStrategyEvidence): string {
  if (evidence.criticalSafeMoves !== null && evidence.criticalSafeMoves <= 1) {
    return `CRITICAL SURVIVAL — ${evidence.criticalSafeMoves} safe move${evidence.criticalSafeMoves === 1 ? '' : 's'}`;
  }
  if (evidence.endgame) return 'ENDGAME MODE ACTIVATED';
  if (evidence.label === 'food-path-rejected' && evidence.trapRiskPercent !== null) return `FOOD PATH REJECTED — trap risk ${Math.round(evidence.trapRiskPercent)}%`;
  if (evidence.label === 'tail-follow' && evidence.preservedEscapeRoutes !== null) return `FOLLOWING TAIL — ${evidence.preservedEscapeRoutes} escape route${evidence.preservedEscapeRoutes === 1 ? '' : 's'} preserved`;
  if (evidence.label === 'space-preservation') return 'SPACE PRESERVATION';
  return neutralLabel(evidence.label);
}

const OCCUPANCY_MILESTONES = [25, 50, 75, 90, 95] as const;

export function selectNextHudTarget(snapshot: HudSnapshot): HudRecordTarget | null {
  const nextOccupancy = OCCUPANCY_MILESTONES.find((threshold) => snapshot.primary.occupancyPercent < threshold);
  if (nextOccupancy !== undefined) {
    return Object.freeze({ id: `occupancy-${nextOccupancy}`, label: 'NEXT MILESTONE', current: snapshot.primary.occupancyPercent, target: nextOccupancy, unit: 'percent' as const });
  }
  if (snapshot.recordTarget !== null && snapshot.recordTarget.current < snapshot.recordTarget.target) return Object.freeze({ ...snapshot.recordTarget });
  return null;
}
