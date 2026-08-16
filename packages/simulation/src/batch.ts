import { aggregateRunResults } from './aggregate.js';
import { createReplayArtifact } from './replay.js';
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

export function attachReplayEvidence(report: SimulationBatchReport, execution: SimulationExecutionConfig): SimulationBatchReport {
  return {
    ...report,
    topReplays: report.topFailures.map((result) => createReplayArtifact(result.seed, execution, result)),
  };
}

export function runBatch(request: BatchRequest): SimulationBatchReport {
  const rows = runBatchRows(request);
  return attachReplayEvidence(aggregateRunResults(rows, aggregationOptions(request)), request.execution);
}
