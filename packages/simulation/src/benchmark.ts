import { createBaselineConfig } from '@snake/engine';
import { runBatch } from './batch.js';
import { stableReportJson } from './report.js';
import { generateSeedCorpus } from './seed-corpus.js';

function positiveInteger(raw: string | undefined, fallback: number, max: number): number {
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > max) throw new Error(`Expected integer in 1..${max}.`);
  return value;
}

const runs = positiveInteger(process.argv[2], 1000, 1_000_000);
const maxTicks = positiveInteger(process.argv[3], 100, 10_000_000);
const report = runBatch({
  seeds: generateSeedCorpus(0x5eed1234, runs),
  execution: {
    engine: createBaselineConfig(1),
    ai: { lookaheadDepth: 1, lookaheadNodeBudget: 24, strategyMinDwellTicks: 1 },
    harness: { maxTicks },
  },
  retainRuns: false,
  topFailures: 10,
});
if (report.runCount !== runs || report.runs !== undefined || report.topFailures.length > 10) throw new Error('Batch retention invariant failed.');
process.stdout.write(stableReportJson(report));
