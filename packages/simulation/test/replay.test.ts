import { describe, expect, it } from 'vitest';
import { createBaselineConfig } from '@snake/engine';
import { createReplayArtifact, ReplayMismatchError, verifyReplay } from '../src/replay.js';

const execution = {
  engine: createBaselineConfig(1),
  ai: { lookaheadDepth: 2, lookaheadNodeBudget: 64 },
  harness: { maxTicks: 20 },
} as const;

describe('replay artifacts', () => {
  it('replays the exact deterministic terminal result with full execution config', () => {
    const artifact = createReplayArtifact(99, execution);
    expect(verifyReplay(artifact)).toEqual(artifact.expected);
    expect(artifact.fileName).toBe('replay-99.json');
    expect(artifact.command).toBe('pnpm replay --artifact replay-99.json');
    expect(artifact.execution).toEqual(execution);
  });

  it('fails hard when expected replay evidence is tampered', () => {
    const artifact = createReplayArtifact(99, execution);
    const tampered = { ...artifact, expected: { ...artifact.expected, score: artifact.expected.score + 1 } };
    expect(() => verifyReplay(tampered)).toThrow(ReplayMismatchError);
  });

  it('fails when an artifact filename no longer matches its seed', () => {
    const artifact = createReplayArtifact(99, execution);
    expect(() => verifyReplay({ ...artifact, fileName: 'replay-100.json' })).toThrow(ReplayMismatchError);
  });
});
