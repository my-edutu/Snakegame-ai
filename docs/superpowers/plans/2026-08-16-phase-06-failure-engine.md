# Phase 6 Failure Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic, configurable, plausible failure/deviation engine that never selects illegal movement, keeps operator settings private, and attributes downstream failures without mislabeling natural deaths.

**Architecture:** Add a pure `@snake/failure` package between AI decision evidence and the simulation runner. It consumes the baseline `SurvivalDecision`, validated private configuration, run/level/risk context, and a deterministic RNG draw supplied by the simulation; it returns either the baseline decision or one legal alternative plus an audit record. Physics remain entirely owned by `@snake/engine`; the failure package never mutates game state.

**Tech Stack:** TypeScript 5.8, pnpm workspaces, Zod 4, Vitest 3.2, existing `@snake/ai`, `@snake/engine`, `@snake/simulation`, seeded engine RNG semantics.

## Global Constraints
- No `Math.random()` or wall-clock time in deterministic failure selection.
- Disabled configuration produces zero deviations.
- A deviation can only choose a legal candidate already supported by AI evidence.
- `naturalLookingOnly` must reject obviously suicidal alternatives when materially safer legal options exist.
- Per-decision probability is always clamped by `maximumProbabilityPerDecision`.
- Operator/private rates, presets, and hidden pacing configuration never enter public stream state.
- A configured deviation is not automatically the cause of a later death; attribution uses a bounded causal window.
- Existing deterministic engine/AI/simulation behavior is unchanged when failure is disabled.

---

### Task 1: Failure configuration, presets, and eligibility

**Files:**
- Create: `packages/failure/package.json`
- Create: `packages/failure/tsconfig.json`
- Create: `packages/failure/src/types.ts`
- Create: `packages/failure/src/config.ts`
- Create: `packages/failure/src/presets.ts`
- Create: `packages/failure/src/eligibility.ts`
- Test: `packages/failure/test/config-eligibility.test.ts`
- Modify: `vitest.config.ts`

**Interfaces:**
- Produces: `FailureConfig`, `FailureContext`, `FailurePresetName`, `parseFailureConfig`, `FAILURE_PRESETS`, `evaluateFailureEligibility`.

- [ ] Write failing tests covering disabled mode, minimum runtime, maximum runtime, level range, minimum risk, empty deviation type rejection, probability clamp bounds, and all five presets.
- [ ] Verify RED on focused tests.
- [ ] Implement Zod validation and pure eligibility evaluation with explicit reason codes.
- [ ] Verify GREEN and commit.

### Task 2: Hazard-rate conversion and deterministic probability model

**Files:**
- Create: `packages/failure/src/probability.ts`
- Test: `packages/failure/test/probability.test.ts`

**Interfaces:**
- Produces: `probabilityPerEligibleDecision(config, decisionsPerSecond, context)`.
- Produces: `shouldApplyDeviation(probability, draw01)`.

- [ ] Write failing tests for hourly-rate conversion, minute-rate conversion, curve multipliers, finite normalization, clamp enforcement, and boundary draws.
- [ ] Verify RED.
- [ ] Implement rate conversion as a hazard probability, never a scheduled guarantee.
- [ ] Verify GREEN and commit.

### Task 3: Legal deviation policy registry and natural-looking mode

**Files:**
- Create: `packages/failure/src/policies.ts`
- Create: `packages/failure/src/apply.ts`
- Test: `packages/failure/test/policies.test.ts`

**Interfaces:**
- Produces: `DeviationType`, `DeviationApplication`, `applyConfiguredDeviation(input)`.
- Supported policies: `second-best-route`, `reduced-lookahead`, `food-over-weight`, `delayed-tail-follow`, `risky-corridor`, `temporary-scoring-bias`.

- [ ] Write failing tests proving illegal candidates are never selected, baseline best evidence is retained, each policy is deterministic, and natural-looking mode rejects a materially suicidal alternative.
- [ ] Verify RED.
- [ ] Implement deterministic policy ranking from existing AI candidate evaluations and stable tie-breaking.
- [ ] Verify GREEN and commit.

### Task 4: Audit events, private/public projection, and causal attribution

**Files:**
- Create: `packages/failure/src/audit.ts`
- Create: `packages/failure/src/attribution.ts`
- Test: `packages/failure/test/audit-attribution.test.ts`

**Interfaces:**
- Produces: `FailureAuditEvent`, `PublicDeviationEvent`, `toPublicDeviationEvent`, `attributeDeathToDeviation`.

- [ ] Write failing tests proving public projection excludes config/rates/preset name, attribution is contributory only inside the configured decision/tick window, and natural deaths outside the window remain natural.
- [ ] Verify RED.
- [ ] Implement immutable audit evidence and bounded causal attribution.
- [ ] Verify GREEN and commit.

### Task 5: Simulation integration and deterministic replay

**Files:**
- Modify: `packages/simulation/package.json`
- Create: `packages/simulation/src/failure-run.ts`
- Modify: `packages/simulation/src/index.ts`
- Test: `packages/simulation/test/failure-run.test.ts`

**Interfaces:**
- Produces: `runLevelSimulationWithFailure(level, seed, harness, failureConfig)`.
- Result includes baseline decision evidence, deviation audit events, and final failure provenance while preserving the existing Phase 5 runner unchanged.

- [ ] Write failing tests for disabled parity with the Phase 5 runner, same-seed replay equality, configured deviation timing/type equality, and legal-move-only integration.
- [ ] Verify RED.
- [ ] Integrate failure selection using deterministic draws derived from simulation seed/tick/decision sequence; do not import rendering or UI.
- [ ] Verify GREEN and commit.

### Task 6: Statistical production verification and release

**Files:**
- Create: `packages/failure/test/statistical-production.test.ts`
- Create: `docs/production/PHASE_06_PRODUCTION_READINESS.md`
- Modify: `.github/workflows/phase-01-ci.yml` only if a permanent dedicated Phase 6 probe is needed beyond the normal test suite.

**Interfaces:**
- Production corpus verifies disabled zero, target-rate approximation, probability cap, exact eligibility, deterministic timing/type, and legal-only deviation behavior.

- [ ] Run a large deterministic sample proving disabled mode emits zero deviations.
- [ ] Run deterministic Bernoulli/hazard samples with an explicit tolerance around the configured target probability.
- [ ] Verify maximum probability is never exceeded and eligibility filters are exact.
- [ ] Verify same seed/config produces byte-identical deviation audit sequences.
- [ ] Review the complete Phase 6 diff for physics leakage, private-config exposure, time-bomb behavior, invalid probability math, and attribution overreach.
- [ ] Run frozen install, strict typecheck, all tests, all builds, forbidden scan, deterministic probes, 1,000-run and 10,000-run inherited gates.
- [ ] Record exact evidence, mark PR ready, squash-merge with expected-head protection, and independently verify the merged `main` commit.
