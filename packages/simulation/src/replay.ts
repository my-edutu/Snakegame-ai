import { runSimulation } from './run.js';
import type { ReplayArtifact, SimulationExecutionConfig, SimulationRunResult } from './types.js';

export class ReplayMismatchError extends Error {
  override readonly name = 'ReplayMismatchError';
}

function expectedKey(result: SimulationRunResult): string {
  return JSON.stringify(result);
}

export function canonicalReplayCommand(seed: number, execution: SimulationExecutionConfig): string {
  return `pnpm replay --seed ${seed >>> 0} --max-ticks ${execution.harness.maxTicks}`;
}

export function createReplayArtifact(seed: number, execution: SimulationExecutionConfig, result?: SimulationRunResult): ReplayArtifact {
  const expected = result ?? runSimulation(seed, execution);
  return {
    schemaVersion: 1,
    seed: seed >>> 0,
    execution: structuredClone(execution),
    expected: structuredClone(expected),
    command: canonicalReplayCommand(seed, execution),
  };
}

export function verifyReplay(artifact: ReplayArtifact): SimulationRunResult {
  if (artifact.schemaVersion !== 1) throw new TypeError(`Unsupported replay schema: ${String(artifact.schemaVersion)}`);
  const actual = runSimulation(artifact.seed, artifact.execution);
  if (expectedKey(actual) !== expectedKey(artifact.expected)) {
    throw new ReplayMismatchError(`Replay mismatch for seed ${artifact.seed}.`);
  }
  return actual;
}
