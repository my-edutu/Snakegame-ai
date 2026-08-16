import type { LevelDefinition } from '@snake/levels';
import { runLevelSimulation, type LevelSimulationResult } from './level-run.js';
import type { SimulationHarnessConfig } from './types.js';

export interface LevelBatchReport {
  readonly schemaVersion: 1;
  readonly runCount: number;
  readonly rows: readonly LevelSimulationResult[];
  readonly levelFunnel: readonly Readonly<{ level: number; reached: number; completed: number }>[];
}

export function runLevelBatch(levels: readonly LevelDefinition[], seeds: readonly number[], harness: SimulationHarnessConfig): LevelBatchReport {
  const ordered = [...levels].sort((a, b) => a.number - b.number);
  const rows: LevelSimulationResult[] = [];
  for (const level of ordered) for (const seed of seeds) rows.push(runLevelSimulation(level, seed, harness));
  return {
    schemaVersion: 1,
    runCount: rows.length,
    rows,
    levelFunnel: ordered.map((level) => ({ level: level.number, reached: seeds.length, completed: rows.filter((row) => row.levelNumber === level.number && row.levelCompleted).length })),
  };
}
