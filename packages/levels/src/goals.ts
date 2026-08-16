import type { LevelDefinition } from './schema.js';
import type { ProgressionEvaluation, ProgressionGoalEvidence } from './types.js';

export interface ProgressionMetrics {
  readonly length: number;
  readonly foodEaten: number;
  readonly ticksSurvived: number;
  readonly occupancyPercent: number;
  readonly score: number;
  readonly objectives?: Readonly<Record<string, number>>;
}

export function evaluateProgression(level: LevelDefinition, metrics: ProgressionMetrics): ProgressionEvaluation {
  const goals: ProgressionGoalEvidence[] = level.progression.goals.map((goal, index) => {
    let current: number;
    let key: string;
    if (goal.type === 'length') { current = metrics.length; key = 'length'; }
    else if (goal.type === 'food') { current = metrics.foodEaten; key = 'food'; }
    else if (goal.type === 'survival-ticks') { current = metrics.ticksSurvived; key = 'survival-ticks'; }
    else if (goal.type === 'occupancy-percent') { current = metrics.occupancyPercent; key = 'occupancy-percent'; }
    else if (goal.type === 'score') { current = metrics.score; key = 'score'; }
    else { current = metrics.objectives?.[goal.key] ?? 0; key = `mechanic:${goal.key}`; }
    return { key: `${index}:${key}`, current, target: goal.target, met: current >= goal.target };
  });
  const complete = level.progression.mode === 'all' ? goals.every((goal) => goal.met) : goals.some((goal) => goal.met);
  return { complete, goals };
}
