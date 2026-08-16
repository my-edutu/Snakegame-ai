import { describe, expect, it } from 'vitest';
import { parseCliArgs, runCli } from '../src/cli.js';

describe('simulation CLI', () => {
  it('parses named values and boolean switches without side effects', () => {
    expect(parseCliArgs(['simulate', '--runs', '10', '--retain-runs'])).toEqual({
      command: 'simulate', values: { runs: '10', 'retain-runs': true },
    });
  });

  it('runs a deterministic JSON-only simulation', async () => {
    const args = ['simulate', '--runs', '3', '--corpus-seed', '7', '--max-ticks', '5', '--workers', '1', '--ai-depth', '1', '--ai-nodes', '16', '--json-only'];
    const first = await runCli(args);
    const second = await runCli(args);
    expect(second).toBe(first);
    const report = JSON.parse(first) as { runCount: number };
    expect(report.runCount).toBe(3);
  });

  it('rejects malformed integer ranges and unknown commands', async () => {
    expect(() => parseCliArgs(['wat'])).toThrow();
    await expect(runCli(['simulate', '--runs', '0'])).rejects.toThrow();
    await expect(runCli(['simulate', '--workers', '65'])).rejects.toThrow();
  });
});
