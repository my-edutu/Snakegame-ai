import { runSimulation } from './run.js';
import type { ReplayArtifact, SimulationExecutionConfig, SimulationRunResult } from './types.js';

export class ReplayMismatchError extends Error {
  override readonly name = 'ReplayMismatchError';
}

function expectedKey(result: SimulationRunResult): string {
  return JSON.stringify(result);
}

export function replayArtifactFileName(seed: number): string {
  return `replay-${seed >>> 0}.json`;
}

export function canonicalReplayCommand(seed: number): string {
  return `pnpm replay --artifact ${replayArtifactFileName(seed)}`;
}

export function createReplayArtifact(seed: number, execution: SimulationExecutionConfig, result?: SimulationRunResult): ReplayArtifact {
  const normalizedSeed = seed >>> 0;
  const expected = result ?? runSimulation(normalizedSeed, execution);
  const fileName = replayArtifactFileName(normalizedSeed);
  return {
    schemaVersion: 1,
    seed: normalizedSeed,
    fileName,
    execution: structuredClone(execution),
    expected: structuredClone(expected),
    command: canonicalReplayCommand(normalizedSeed),
  };
}

export function verifyReplay(artifact: ReplayArtifact): SimulationRunResult {
  if (artifact.schemaVersion !== 1) throw new TypeError(`Unsupported replay schema: ${String(artifact.schemaVersion)}`);
  if (artifact.fileName !== replayArtifactFileName(artifact.seed)) throw new ReplayMismatchError(`Replay filename mismatch for seed ${artifact.seed}.`);
  const actual = runSimulation(artifact.seed, artifact.execution);
  if (expectedKey(actual) !== expectedKey(artifact.expected)) {
    throw new ReplayMismatchError(`Replay mismatch for seed ${artifact.seed}.`);
  }
  return actual;
}
