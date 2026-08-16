import { parentPort, workerData } from 'node:worker_threads';
import { runBatchRows } from './batch.js';
import type { SimulationExecutionConfig } from './types.js';

interface WorkerPayload {
  readonly startIndex: number;
  readonly seeds: readonly number[];
  readonly execution: SimulationExecutionConfig;
}

const payload = workerData as WorkerPayload;
if (!parentPort) throw new Error('Simulation worker requires a parent port.');

try {
  const rows = runBatchRows({ seeds: payload.seeds, execution: payload.execution });
  parentPort.postMessage({ ok: true, startIndex: payload.startIndex, rows });
} catch (error) {
  parentPort.postMessage({ ok: false, startIndex: payload.startIndex, count: payload.seeds.length, message: error instanceof Error ? error.message : String(error) });
}
