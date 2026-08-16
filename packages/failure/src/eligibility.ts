import type { FailureConfig, FailureContext, FailureEligibility } from './types.js';
export function evaluateFailureEligibility(config: FailureConfig, context: FailureContext): FailureEligibility {
  if (!config.enabled) return { eligible: false, reason: 'disabled' };
  if (context.tick < config.minimumEligibleRunTicks) return { eligible: false, reason: 'before-minimum-runtime' };
  if (config.maximumRunTicks !== undefined && context.tick > config.maximumRunTicks) return { eligible: false, reason: 'after-maximum-runtime' };
  if (config.minimumLevel !== undefined && context.level < config.minimumLevel) return { eligible: false, reason: 'below-level' };
  if (config.maximumLevel !== undefined && context.level > config.maximumLevel) return { eligible: false, reason: 'above-level' };
  if (config.minimumRisk !== undefined && context.risk < config.minimumRisk) return { eligible: false, reason: 'below-risk' };
  if (config.minimumLength !== undefined && context.length < config.minimumLength) return { eligible: false, reason: 'below-length' };
  if (config.minimumOccupancyPercent !== undefined && context.occupancyPercent < config.minimumOccupancyPercent) return { eligible: false, reason: 'below-occupancy' };
  return { eligible: true, reason: 'eligible' };
}
