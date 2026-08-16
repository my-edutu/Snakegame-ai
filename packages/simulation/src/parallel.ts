import { Worker } from 'node:worker_threads';
import { aggregateRunResults } from './aggregate.js';
import { validateExplicitSeeds } from './seed-corpus.js';
import type { BatchRequest } from './batch.js';
import type { BatchOptions, SimulationBatchReport, SimulationRunResult } from './types.js';

interface WorkerSuccess { readonly ok: true; readonly startIndex: number; readonly rows: readonly SimulationRunResult[] }
interface WorkerFailure { readonly ok: false; readonly startIndex: number; readonly count: number; readonly message: string }
type WorkerMessage = WorkerSuccess | WorkerFailure;

export class SimulationWorkerError extends Error {
  override readonly name = 'SimulationWorkerError';
}

export function partitionSeedRanges(seeds: readonly number[], workerCount: number): readonly { startIndex: number; seeds: readonly number[] }[] {
  if (!Number.isInteger(workerCount) || workerCount < 1 || workerCount > 64) throw new RangeError('workerCount must be an integer in 1..64.');
  const normalized = validateExplicitSeeds(seeds);
  const count = Math.min(workerCount, normalized.length);
  const base = Math.floor(normalized.length / count);
  const remainder = normalized.length % count;
  const parts: { startIndex: number; seeds: readonly number[] }[] = [];
  let cursor = 0;
  for (let index = 0; index < count; index += 1) {
    const size = base + (index < remainder ? 1 : 0);
    parts.push({ startIndex: cursor, seeds: normalized.slice(cursor, cursor + size) });
    cursor += size;
  }
  return parts;
}

function runWorker(part: { startIndex: number; seeds: readonly number[] }, request: BatchRequest): Promise<WorkerSuccess> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./worker.js', import.meta.url), { workerData: { ...part, execution: request.execution } });
    let settled = false;
    worker.once('message', (raw) => {
      settled = true;
      const message = raw as WorkerMessage;
      if (!message.ok) reject(new SimulationWorkerError(`Worker failed for indexes ${message.startIndex}..${message.startIndex + message.count - 1}: ${message.message}`));
      else resolve(message);
    });
    worker.once('error', (error) => { if (!settled) reject(new SimulationWorkerError(`Worker error at index ${part.startIndex}: ${error.message}`)); });
    worker.once('exit', (code) => { if (!settled && code !== 0) reject(new SimulationWorkerError(`Worker exited with code ${code} at index ${part.startIndex}.`)); });
  });
}

function aggregationOptions(request: BatchRequest): BatchOptions {
  return {
    ...(request.retainRuns !== undefined ? { retainRuns: request.retainRuns } : {}),
    ...(request.topFailures !== undefined ? { topFailures: request.topFailures } : {}),
  };
}

export async function runBatchParallel(request: BatchRequest, workerCount: number): Promise<SimulationBatchReport> {
  const parts = partitionSeedRanges(request.seeds, workerCount);
  const chunks = await Promise.all(parts.map((part) => runWorker(part, request)));
  chunks.sort((a, b) => a.startIndex - b.startIndex);
  const rows = chunks.flatMap((chunk) => chunk.rows);
  return aggregateRunResults(rows, aggregationOptions(request));
}
