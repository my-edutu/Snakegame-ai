# Controlled Failure Engine

## Purpose
Preserve genuine algorithmic failure while optionally allowing an operator to introduce plausible, auditable strategy deviations for livestream pacing.

## Safety and product rule
The failure system may alter the AI's choice among legal candidates, but it must not secretly rewrite physics, teleport the snake, fabricate collisions, alter historical analytics, or expose private operator settings in the public HUD.

## Internal categories
Every death and deviation records provenance:
- `natural`
- `configured-deviation`
- `level-hazard`
- `operator-action`
- `unknown`

A configured deviation is not automatically the cause of death. Analytics should support causal attribution windows.

## Configuration
```ts
interface FailureConfig {
  enabled: boolean;
  targetFailuresPerHour?: number;
  probabilityPerMinute?: number;
  minimumEligibleRunTicks: number;
  maximumRunTicks?: number;
  maximumProbabilityPerDecision: number;
  minimumLevel?: number;
  maximumLevel?: number;
  minimumRisk?: number;
  lengthCurve?: ProbabilityCurve;
  occupancyCurve?: ProbabilityCurve;
  levelCurve?: ProbabilityCurve;
  riskCurve?: ProbabilityCurve;
  randomFailureWeight?: number;
  naturalLookingOnly: boolean;
  deviationTypes: readonly DeviationType[];
}
```

## Eligibility pipeline
1. Confirm enabled.
2. Confirm minimum runtime reached.
3. Confirm level restrictions.
4. Confirm any risk threshold.
5. Calculate probability from target rate and configured curves.
6. Clamp to maximum probability.
7. Draw from seeded RNG.
8. If selected, evaluate allowed plausible deviations.
9. Apply one deviation and emit `ArtificialDeviationApplied`.

## Plausible deviations
- choose the second-best legal route
- over-weight food value
- reduce lookahead depth for one decision
- under-weight flood-fill area
- delay tail-follow mode
- enter a higher-risk corridor
- ignore a safe Hamiltonian shortcut constraint once, if still legal

`naturalLookingOnly` prohibits obviously suicidal moves when a materially safer plausible alternative exists. A separate chaos/testing preset may relax this internally, but it should not be the default stream behavior.

## Rate semantics
`targetFailuresPerHour` is a target hazard rate, not a guarantee that a death occurs on schedule. Convert it into per-eligible-decision probability based on simulation tick/decision frequency. The system should avoid deterministic time bombs that viewers could infer.

## Causal analytics
Record:
- deviation decision ID
- pre-deviation best candidate
- chosen candidate
- score delta
- risk before/after
- predicted survival horizon delta
- subsequent death tick if any
- whether causal attribution rules classify it as contributing

## Operator presets
- **Record Attempt**: disabled
- **Safe Stream**: very low eligible deviation rate, high risk threshold
- **Balanced Stream**: moderate rate, plausible-only
- **Chaos Stream**: higher rate and broader deviation types
- **Demo**: shorter eligibility window for fast demonstrations

## Tests
- disabled means zero deviations across large seeded sample
- minimum runtime respected
- level restrictions respected
- rate statistically approximates configured hazard rate
- maximum probability clamp respected
- same seed/config produces identical deviations
- deviation never selects illegal movement
- natural and configured failure analytics remain distinguishable
