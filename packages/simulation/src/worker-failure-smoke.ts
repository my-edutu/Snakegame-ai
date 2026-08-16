import { createBaselineConfig } from '@snake/engine';
import { runBatchParallel, SimulationWorkerError } from './parallel.js';

const invalidEngine = { ...createBaselineConfig(1), board: { width: 0, height: 8 } };

let observed = false;
try {
  await runBatchParallel({
    seeds: [1, 2],
    execution: {
      engine: invalidEngine,
      ai: { lookaheadDepth: 1, lookaheadNodeBudget: 8 },
      harness: { maxTicks: 2 },
    },
  }, 2);
} catch (error) {
  if (!(error instanceof SimulationWorkerError)) throw error;
  if (!/indexes?\s+0\.\.0|index\s+0/i.test(error.message)) throw new Error(`Worker failure omitted deterministic range context: ${error.message}`);
  observed = true;
}

if (!observed) throw new Error('Expected invalid worker simulation to fail.');
process.stdout.write('worker failure propagation: PASS\n');
