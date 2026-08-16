import { describe, expect, it } from 'vitest';
import { createBaselineConfig } from '@snake/engine';
import { createReplayArtifact, ReplayMismatchError, verifyReplay } from '../src/replay.js';

const execution = {
  engine: createBaselineConfig(1),
  ai: { lookaheadDepth: 2, lookaheadNodeBudget: 64 },
  harness: { maxTicks: 20 },
} as const;

describe('replay artifacts', () => {
  it('replays the exact deterministic terminal result', () => {
    const artifact = createReplayArtifact(99, execution);
    expect(verifyReplay(artifact)).toEqual(artifact.expected);
    expect(artifact.command).toContain('pnpm replay --seed 99 --max-ticks 20');
  });

  it('fails hard when expected replay evidence is tampered', () => {
    const artifact = createReplayArtifact(99, execution);
    const tampered = { ...artifact, expected: { ...artifact.expected, score: artifact.expected.score + 1 } };
    expect(() => verifyReplay(tampered)).toThrow(ReplayMismatchError);
  });
});
