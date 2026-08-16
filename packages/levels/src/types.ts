export type { LevelDefinition, LevelGoal, LevelHazard, LevelMechanic, LevelObstacle } from './schema.js';

export interface LevelValidationIssue {
  readonly path: string;
  readonly message: string;
}

export interface ProgressionGoalEvidence {
  readonly key: string;
  readonly current: number;
  readonly target: number;
  readonly met: boolean;
}

export interface ProgressionEvaluation {
  readonly complete: boolean;
  readonly goals: readonly ProgressionGoalEvidence[];
}
