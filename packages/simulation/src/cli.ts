import { readFileSync, writeFileSync } from 'node:fs';
import { createBaselineConfig } from '@snake/engine';
import { runBatch } from './batch.js';
import { runBatchParallel } from './parallel.js';
import { verifyReplay } from './replay.js';
import { humanReport, stableReportJson } from './report.js';
import { generateSeedCorpus } from './seed-corpus.js';
import type { ReplayArtifact, SimulationExecutionConfig } from './types.js';

export interface ParsedArgs { readonly command: 'simulate' | 'replay'; readonly values: Readonly<Record<string, string | boolean>> }

export function parseCliArgs(argv: readonly string[]): ParsedArgs {
  const command = argv[0];
  if (command !== 'simulate' && command !== 'replay') throw new Error('Command must be simulate or replay.');
  const values: Record<string, string | boolean> = {};
  for (let index = 1; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token?.startsWith('--')) throw new Error(`Unexpected argument: ${String(token)}`);
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) values[key] = true;
    else { values[key] = next; index += 1; }
  }
  return { command, values };
}

function integer(values: Readonly<Record<string, string | boolean>>, key: string, fallback?: number, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  const raw = values[key];
  if (raw === undefined && fallback !== undefined) return fallback;
  if (typeof raw !== 'string' || raw.trim() === '') throw new Error(`--${key} requires an integer value.`);
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`--${key} must be an integer in ${min}..${max}.`);
  return value;
}

function execution(seed: number, maxTicks: number, values: Readonly<Record<string, string | boolean>>): SimulationExecutionConfig {
  return {
    engine: createBaselineConfig(seed),
    ai: {
      lookaheadDepth: integer(values, 'ai-depth', 8, 0, 64),
      lookaheadNodeBudget: integer(values, 'ai-nodes', 6000, 0, 1_000_000),
    },
    harness: { maxTicks },
  };
}

export async function runCli(argv: readonly string[]): Promise<string> {
  const parsed = parseCliArgs(argv);
  if (parsed.command === 'replay') {
    const artifactPath = parsed.values['artifact'];
    if (typeof artifactPath === 'string') {
      const artifact = JSON.parse(readFileSync(artifactPath, 'utf8')) as ReplayArtifact;
      return `${JSON.stringify(verifyReplay(artifact))}\n`;
    }
    const seed = integer(parsed.values, 'seed', undefined, 0, 0xffff_ffff);
    const maxTicks = integer(parsed.values, 'max-ticks', 5000, 1, 10_000_000);
    const result = (await import('./run.js')).runSimulation(seed, execution(seed, maxTicks, parsed.values));
    return `${JSON.stringify(result)}\n`;
  }

  const runs = integer(parsed.values, 'runs', 1, 1, 1_000_000);
  const corpusSeed = integer(parsed.values, 'corpus-seed', 845732916, 0, 0xffff_ffff);
  const maxTicks = integer(parsed.values, 'max-ticks', 5000, 1, 10_000_000);
  const workers = integer(parsed.values, 'workers', 1, 1, 64);
  const seeds = generateSeedCorpus(corpusSeed, runs);
  const request = { seeds, execution: execution(corpusSeed, maxTicks, parsed.values), retainRuns: parsed.values['retain-runs'] === true, topFailures: integer(parsed.values, 'top-failures', 10, 0, 1000) };
  const report = workers === 1 ? runBatch(request) : await runBatchParallel(request, workers);
  const json = stableReportJson(report);
  const outputPath = parsed.values['json'];
  if (typeof outputPath === 'string') writeFileSync(outputPath, json, 'utf8');
  return parsed.values['json-only'] === true ? json : humanReport(report);
}
