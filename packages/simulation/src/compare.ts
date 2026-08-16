import type { SurvivalDecisionConfig } from '@snake/ai';
import type { EngineConfig } from '@snake/engine';
import { runBatch } from './batch.js';
import type { BatchOptions, SimulationBatchReport, SimulationHarnessConfig } from './types.js';

export interface AiComparisonVariant {
  readonly name: string;
  readonly ai: Partial<SurvivalDecisionConfig>;
}

export interface AiComparisonReport {
  readonly schemaVersion: 1;
  readonly seeds: readonly number[];
  readonly reports: Readonly<Record<string, SimulationBatchReport>>;
}

export function compareAiConfigurations(
  seeds: readonly number[],
  engine: EngineConfig,
  harness: SimulationHarnessConfig,
  variants: readonly AiComparisonVariant[],
  options: BatchOptions = {},
): AiComparisonReport {
  if (variants.length < 2 || variants.length > 32) throw new RangeError('AI comparison requires 2..32 variants.');
  const names = variants.map((variant) => variant.name);
  if (names.some((name) => name.trim() === '')) throw new TypeError('AI comparison variant names must be non-empty.');
  if (new Set(names).size !== names.length) throw new TypeError('AI comparison variant names must be unique.');

  const reports: Record<string, SimulationBatchReport> = {};
  for (const variant of [...variants].sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
    reports[variant.name] = runBatch({
      seeds,
      execution: { engine, ai: variant.ai, harness },
      ...(options.retainRuns !== undefined ? { retainRuns: options.retainRuns } : {}),
      ...(options.topFailures !== undefined ? { topFailures: options.topFailures } : {}),
    });
  }
  return { schemaVersion: 1, seeds: [...seeds], reports };
}
