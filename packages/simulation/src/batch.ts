import { aggregateRunResults } from './aggregate.js';
import { runSimulation } from './run.js';
import { validateExplicitSeeds } from './seed-corpus.js';
import type { BatchOptions, SimulationBatchReport, SimulationExecutionConfig, SimulationRunResult } from './types.js';

export interface BatchRequest extends BatchOptions {
  readonly seeds: readonly number[];
  readonly execution: SimulationExecutionConfig;
}

export function runBatchRows(request: BatchRequest): readonly SimulationRunResult[] {
  const seeds = validateExplicitSeeds(request.seeds);
  return seeds.map((seed) => runSimulation(seed, request.execution));
}

function aggregationOptions(request: BatchRequest): BatchOptions {
  return {
    ...(request.retainRuns !== undefined ? { retainRuns: request.retainRuns } : {}),
    ...(request.topFailures !== undefined ? { topFailures: request.topFailures } : {}),
  };
}

export function runBatch(request: BatchRequest): SimulationBatchReport {
  const rows = runBatchRows(request);
  return aggregateRunResults(rows, aggregationOptions(request));
}
