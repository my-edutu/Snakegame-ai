import type { NumericSummary } from './types.js';

export function nearestRank(values: readonly number[], percentile: number): number {
  if (values.length === 0) return 0;
  if (!Number.isFinite(percentile) || percentile < 0 || percentile > 1) throw new RangeError('percentile must be in 0..1.');
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.max(1, Math.ceil(percentile * sorted.length));
  return sorted[Math.min(sorted.length - 1, rank - 1)] ?? 0;
}

export function summarizeNumbers(values: readonly number[]): NumericSummary {
  if (values.length === 0) return { min: 0, max: 0, mean: 0, p50: 0, p95: 0, p99: 0 };
  let sum = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    if (!Number.isFinite(value)) throw new TypeError('Numeric summaries require finite values.');
    sum += value;
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  return { min, max, mean: sum / values.length, p50: nearestRank(values, 0.5), p95: nearestRank(values, 0.95), p99: nearestRank(values, 0.99) };
}
