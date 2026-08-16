import { createBaselineConfig } from '@snake/engine';
import { runBatch } from './batch.js';
import { runBatchParallel } from './parallel.js';
import { stableReportJson } from './report.js';
import { generateSeedCorpus } from './seed-corpus.js';

const request = {
  seeds: generateSeedCorpus(424242, 16),
  execution: {
    engine: createBaselineConfig(1),
    ai: { lookaheadDepth: 2, lookaheadNodeBudget: 48, strategyMinDwellTicks: 1 },
    harness: { maxTicks: 20 },
  },
  retainRuns: true,
  topFailures: 4,
} as const;

const sequential = stableReportJson(runBatch(request));
const parallel = stableReportJson(await runBatchParallel(request, 4));
if (parallel !== sequential) throw new Error('Parallel simulation report differs from sequential reference report.');
process.stdout.write(parallel);
