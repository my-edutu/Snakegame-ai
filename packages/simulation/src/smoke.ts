import { createBaselineConfig } from '@snake/engine';
import { runBatch } from './batch.js';
import { stableReportJson } from './report.js';
import { generateSeedCorpus } from './seed-corpus.js';

const report = runBatch({
  seeds: generateSeedCorpus(845732916, 12),
  execution: {
    engine: createBaselineConfig(1),
    ai: { lookaheadDepth: 2, lookaheadNodeBudget: 64, strategyMinDwellTicks: 1 },
    harness: { maxTicks: 30 },
  },
  topFailures: 3,
});

process.stdout.write(stableReportJson(report));
