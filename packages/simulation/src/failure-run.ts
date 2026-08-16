import { createRng } from '@snake/engine';
import { mixSeed, type LevelDefinition } from '@snake/levels';
import {
  applyConfiguredDeviation,
  attributeDeathToDeviation,
  evaluateFailureEligibility,
  parseFailureConfig,
  probabilityPerEligibleDecision,
  shouldApplyDeviation,
  toPublicDeviationEvent,
  type FailureAttribution,
  type FailureAuditEvent,
  type FailureConfig,
  type PublicDeviationEvent,
} from '@snake/failure';
import type { Direction } from '@snake/shared';
import { runLevelSimulation, runLevelSimulationWithPolicy, type LevelSimulationResult } from './level-run.js';
import type { SimulationHarnessConfig } from './types.js';

export interface FailureAwareLevelSimulationResult {
  readonly level: LevelSimulationResult;
  readonly deviations: readonly FailureAuditEvent[];
  readonly publicEvents: readonly PublicDeviationEvent[];
  readonly failureAttribution: FailureAttribution;
}

function naturalAttribution(level: LevelSimulationResult): FailureAttribution {
  return { category: 'natural', naturalCause: level.run.deathCause ?? level.run.terminalReason, contributory: false };
}

export function runLevelSimulationWithFailure(
  level: LevelDefinition,
  seed: number,
  harness: SimulationHarnessConfig,
  inputConfig: FailureConfig,
): FailureAwareLevelSimulationResult {
  const config = parseFailureConfig(inputConfig);
  if (!config.enabled) {
    const baseline = runLevelSimulation(level, seed, harness);
    return { level: baseline, deviations: [], publicEvents: [], failureAttribution: naturalAttribution(baseline) };
  }

  const rng = createRng(mixSeed(seed, level.number, 0xfa11));
  const deviations: FailureAuditEvent[] = [];
  const levelResult = runLevelSimulationWithPolicy(level, seed, harness, ({ state, decision, decisionSequence }) => {
    if (!decision.direction) return null;
    const context = {
      tick: state.tick,
      level: level.number,
      risk: Math.max(0, Math.min(1, decision.risk.score / 100)),
      length: state.snake.body.length,
      occupancyPercent: state.progression.occupancyPercent,
    };
    if (!evaluateFailureEligibility(config, context).eligible) return decision.direction;

    const probability = probabilityPerEligibleDecision(config, level.timing.ticksPerSecond, context);
    const triggerDraw = rng.nextFloat();
    if (!shouldApplyDeviation(probability, triggerDraw)) return decision.direction;

    const deviationType = config.deviationTypes[rng.nextInt(config.deviationTypes.length)]!;
    const selectionDraw = rng.nextFloat();
    const application = applyConfiguredDeviation({ decision, deviationType, naturalLookingOnly: config.naturalLookingOnly, draw01: selectionDraw });
    if (!application.applied || !application.direction) return decision.direction;

    deviations.push({
      id: `${level.id}-dev-${state.tick}-${decisionSequence}`,
      tick: state.tick,
      decisionSequence,
      type: deviationType,
      baselineDirection: application.baselineDirection,
      appliedDirection: application.direction,
      baselineScore: application.baselineScore,
      appliedScore: application.appliedScore,
      probability,
      draw01: triggerDraw,
    });
    return application.direction as Direction;
  });

  const naturalCause = levelResult.run.deathCause ?? levelResult.run.terminalReason;
  const failureAttribution = levelResult.run.terminalReason === 'death'
    ? attributeDeathToDeviation({ deathTick: levelResult.run.ticksSurvived, naturalCause, recentDeviations: deviations.slice(-32), causalWindowTicks: 5 })
    : naturalAttribution(levelResult);
  return { level: levelResult, deviations, publicEvents: deviations.map(toPublicDeviationEvent), failureAttribution };
}
