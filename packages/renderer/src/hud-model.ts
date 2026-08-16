import type { HudSnapshot, HudSnapshotInput } from './hud-types.js';

export class HudValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HudValidationError';
  }
}

const finiteNonNegative = (value: number, name: string): number => {
  if (!Number.isFinite(value) || value < 0) throw new HudValidationError(`${name} must be finite and nonnegative.`);
  return value;
};

const integerNonNegative = (value: number, name: string): number => {
  finiteNonNegative(value, name);
  if (!Number.isInteger(value)) throw new HudValidationError(`${name} must be an integer.`);
  return value;
};

const percent = (value: number, name: string): number => {
  finiteNonNegative(value, name);
  if (value > 100) throw new HudValidationError(`${name} must be between 0 and 100.`);
  return value;
};

const nonEmpty = (value: string, name: string): string => {
  if (value.trim().length === 0) throw new HudValidationError(`${name} must not be empty.`);
  return value;
};

const optionalFiniteNonNegative = (value: number | null, name: string): number | null => value === null ? null : finiteNonNegative(value, name);
const optionalPercent = (value: number | null, name: string): number | null => value === null ? null : percent(value, name);

export function createHudSnapshot(input: HudSnapshotInput): HudSnapshot {
  integerNonNegative(input.level.number, 'level.number');
  integerNonNegative(input.level.total, 'level.total');
  if (input.level.number < 1 || input.level.total < 1 || input.level.number > input.level.total) throw new HudValidationError('level number must be within the configured level range.');
  nonEmpty(input.level.name, 'level.name');

  integerNonNegative(input.run.number, 'run.number');
  if (input.run.number < 1) throw new HudValidationError('run.number must be at least 1.');
  integerNonNegative(input.run.elapsedTicks, 'run.elapsedTicks');
  finiteNonNegative(input.run.tickDurationMs, 'run.tickDurationMs');
  if (input.run.tickDurationMs <= 0) throw new HudValidationError('run.tickDurationMs must be greater than zero.');
  integerNonNegative(input.run.levelStreak, 'run.levelStreak');
  integerNonNegative(input.run.countdownTicksRemaining, 'run.countdownTicksRemaining');

  finiteNonNegative(input.primary.score, 'primary.score');
  integerNonNegative(input.primary.length, 'primary.length');
  percent(input.primary.occupancyPercent, 'primary.occupancyPercent');
  integerNonNegative(input.primary.foodEaten, 'primary.foodEaten');
  integerNonNegative(input.primary.safeMoves, 'primary.safeMoves');
  integerNonNegative(input.primary.projectedMoves, 'primary.projectedMoves');

  percent(input.risk.score, 'risk.score');
  nonEmpty(input.strategy.label, 'strategy.label');
  optionalPercent(input.strategy.trapRiskPercent, 'strategy.trapRiskPercent');
  optionalFiniteNonNegative(input.strategy.preservedEscapeRoutes, 'strategy.preservedEscapeRoutes');
  optionalFiniteNonNegative(input.strategy.criticalSafeMoves, 'strategy.criticalSafeMoves');

  percent(input.records.bestOccupancyPercent, 'records.bestOccupancyPercent');
  integerNonNegative(input.records.highestLevel, 'records.highestLevel');
  integerNonNegative(input.records.deaths, 'records.deaths');
  integerNonNegative(input.records.totalGames, 'records.totalGames');
  finiteNonNegative(input.records.highScore, 'records.highScore');
  integerNonNegative(input.records.maxLength, 'records.maxLength');
  integerNonNegative(input.records.longestSurvivalTicks, 'records.longestSurvivalTicks');
  if (input.records.deaths > input.records.totalGames) throw new HudValidationError('records.deaths cannot exceed records.totalGames.');

  if (input.recordTarget !== null) {
    nonEmpty(input.recordTarget.id, 'recordTarget.id');
    nonEmpty(input.recordTarget.label, 'recordTarget.label');
    finiteNonNegative(input.recordTarget.current, 'recordTarget.current');
    finiteNonNegative(input.recordTarget.target, 'recordTarget.target');
  }

  if (input.runSummary !== null) {
    finiteNonNegative(input.runSummary.score, 'runSummary.score');
    integerNonNegative(input.runSummary.maxLength, 'runSummary.maxLength');
    percent(input.runSummary.maxOccupancyPercent, 'runSummary.maxOccupancyPercent');
    integerNonNegative(input.runSummary.foodEaten, 'runSummary.foodEaten');
    integerNonNegative(input.runSummary.ticksSurvived, 'runSummary.ticksSurvived');
    integerNonNegative(input.runSummary.levelReached, 'runSummary.levelReached');
  }

  return Object.freeze({
    completeness: input.completeness ?? 'rich',
    level: Object.freeze({ ...input.level }),
    run: Object.freeze({ ...input.run }),
    primary: Object.freeze({ ...input.primary }),
    risk: Object.freeze({ ...input.risk }),
    strategy: Object.freeze({ ...input.strategy }),
    records: Object.freeze({ ...input.records }),
    recordTarget: input.recordTarget === null ? null : Object.freeze({ ...input.recordTarget }),
    runSummary: input.runSummary === null ? null : Object.freeze({ ...input.runSummary, newRecords: Object.freeze([...input.runSummary.newRecords]) }),
    emittedEventIds: Object.freeze([...input.emittedEventIds]),
  });
}
