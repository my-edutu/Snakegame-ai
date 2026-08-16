export type RecordMarker = 'highest-level' | 'longest-level-streak' | 'max-length' | 'max-occupancy' | 'longest-survival' | 'high-score' | 'fastest-completion';

export interface AllTimeRecords {
  readonly totalGames: number;
  readonly deaths: number;
  readonly totalFood: number;
  readonly totalPlayTicks: number;
  readonly highestLevel: number;
  readonly longestLevelStreak: number;
  readonly maxLength: number;
  readonly maxOccupancyPercent: number;
  readonly longestSurvivalTicks: number;
  readonly highScore: number;
  readonly fastestCompletionTicks: number | null;
}

export interface CompletedLevelEvidence {
  readonly levelNumber: number;
  readonly levelCompleted: boolean;
  readonly runEnded: boolean;
  readonly died: boolean;
  readonly ticksSurvived: number;
  readonly maxLength: number;
  readonly maxOccupancyPercent: number;
  readonly score: number;
  readonly foodConsumed: number;
  readonly levelStreak: number;
  readonly completionTicks: number | null;
}

export interface RecordsUpdate { readonly records: AllTimeRecords; readonly newRecords: readonly RecordMarker[] }

const finiteNonNegative = (value: number, name: string): number => {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be finite and nonnegative.`);
  return value;
};

export function createEmptyRecords(): AllTimeRecords {
  return { totalGames: 0, deaths: 0, totalFood: 0, totalPlayTicks: 0, highestLevel: 0, longestLevelStreak: 0, maxLength: 0, maxOccupancyPercent: 0, longestSurvivalTicks: 0, highScore: 0, fastestCompletionTicks: null };
}

export function updateRecords(records: AllTimeRecords, evidence: CompletedLevelEvidence): RecordsUpdate {
  const levelNumber = finiteNonNegative(evidence.levelNumber, 'levelNumber');
  const ticks = finiteNonNegative(evidence.ticksSurvived, 'ticksSurvived');
  const length = finiteNonNegative(evidence.maxLength, 'maxLength');
  const occupancy = finiteNonNegative(evidence.maxOccupancyPercent, 'maxOccupancyPercent');
  const score = finiteNonNegative(evidence.score, 'score');
  const food = finiteNonNegative(evidence.foodConsumed, 'foodConsumed');
  const streak = finiteNonNegative(evidence.levelStreak, 'levelStreak');
  const markers: RecordMarker[] = [];
  if (levelNumber > records.highestLevel) markers.push('highest-level');
  if (streak > records.longestLevelStreak) markers.push('longest-level-streak');
  if (length > records.maxLength) markers.push('max-length');
  if (occupancy > records.maxOccupancyPercent) markers.push('max-occupancy');
  if (ticks > records.longestSurvivalTicks) markers.push('longest-survival');
  if (score > records.highScore) markers.push('high-score');
  const completion = evidence.levelCompleted && evidence.completionTicks !== null ? finiteNonNegative(evidence.completionTicks, 'completionTicks') : null;
  const faster = completion !== null && completion > 0 && (records.fastestCompletionTicks === null || completion < records.fastestCompletionTicks);
  if (faster) markers.push('fastest-completion');
  return {
    records: {
      totalGames: records.totalGames + (evidence.runEnded ? 1 : 0),
      deaths: records.deaths + (evidence.died ? 1 : 0),
      totalFood: records.totalFood + food,
      totalPlayTicks: records.totalPlayTicks + ticks,
      highestLevel: Math.max(records.highestLevel, levelNumber),
      longestLevelStreak: Math.max(records.longestLevelStreak, streak),
      maxLength: Math.max(records.maxLength, length),
      maxOccupancyPercent: Math.max(records.maxOccupancyPercent, occupancy),
      longestSurvivalTicks: Math.max(records.longestSurvivalTicks, ticks),
      highScore: Math.max(records.highScore, score),
      fastestCompletionTicks: faster ? completion : records.fastestCompletionTicks,
    },
    newRecords: markers,
  };
}
