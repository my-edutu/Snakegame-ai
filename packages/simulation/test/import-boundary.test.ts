import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sourceFiles = [
  'run.ts', 'batch.ts', 'compare.ts', 'aggregate.ts', 'parallel.ts', 'worker.ts', 'report.ts', 'replay.ts', 'seed-corpus.ts', 'percentiles.ts',
];

describe('simulation import boundary', () => {
  it('contains no renderer, React, PixiJS, DOM, audio, or browser storage dependencies', () => {
    for (const file of sourceFiles) {
      const source = readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8');
      expect(source).not.toMatch(/from ['"](?:react|next|pixi|pixijs|phaser|@pixi|three)/i);
      expect(source).not.toMatch(/\b(?:window|document|localStorage|sessionStorage|AudioContext|requestAnimationFrame)\b/);
    }
  });
});
