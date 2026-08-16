import { z } from 'zod';
import { DEVIATION_TYPES, type FailureConfig } from './types.js';

const schema = z.object({
  enabled: z.boolean(),
  targetFailuresPerHour: z.number().finite().nonnegative().optional(),
  probabilityPerMinute: z.number().finite().nonnegative().optional(),
  minimumEligibleRunTicks: z.number().int().nonnegative(),
  maximumRunTicks: z.number().int().positive().optional(),
  maximumProbabilityPerDecision: z.number().finite().min(0).max(1),
  minimumLevel: z.number().int().positive().optional(),
  maximumLevel: z.number().int().positive().optional(),
  minimumRisk: z.number().finite().min(0).max(1).optional(),
  minimumLength: z.number().int().positive().optional(),
  minimumOccupancyPercent: z.number().finite().min(0).max(1).optional(),
  naturalLookingOnly: z.boolean(),
  deviationTypes: z.array(z.enum(DEVIATION_TYPES)).min(1),
  riskMultiplier: z.number().finite().nonnegative().optional(),
  occupancyMultiplier: z.number().finite().nonnegative().optional(),
  levelMultiplier: z.number().finite().nonnegative().optional(),
}).superRefine((value, ctx) => {
  if (value.targetFailuresPerHour === undefined && value.probabilityPerMinute === undefined && value.enabled) ctx.addIssue({ code: 'custom', message: 'Enabled failure config requires a target rate.' });
  if (value.maximumRunTicks !== undefined && value.maximumRunTicks < value.minimumEligibleRunTicks) ctx.addIssue({ code: 'custom', message: 'maximumRunTicks must be >= minimumEligibleRunTicks.' });
  if (value.minimumLevel !== undefined && value.maximumLevel !== undefined && value.maximumLevel < value.minimumLevel) ctx.addIssue({ code: 'custom', message: 'maximumLevel must be >= minimumLevel.' });
});

export function parseFailureConfig(value: unknown): FailureConfig { return schema.parse(value); }
