# Phase 3 Survival Reasoning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver deterministic, production-ready survival reasoning on top of the verified Phase 2 pathfinding foundation.

**Architecture:** Add focused pure modules inside `@snake/ai`: exact lightweight simulation, space/topology analysis, bounded lookahead, Hamiltonian ordering, risk, strategy hysteresis, and final decision orchestration. Keep all decisions deterministic and node-budgeted; use GitHub Actions as the authoritative RED/GREEN and release gate.

**Tech Stack:** TypeScript 5.8.3, pnpm 10.15.0 workspaces, Vitest 3.2.4, Node.js 22.

## Global Constraints
- Preserve all Phase 1 and Phase 2 tests and deterministic headless behavior.
- No wall-clock value may influence a survival decision.
- No random, DOM, browser, storage, timer, network, React, PixiJS, OBS, persistence, or UI dependencies in deterministic AI reasoning.
- Canonical move order remains `up`, `right`, `down`, `left`.
- Production default lookahead: depth 8, node budget 6000.
- Exact PR head and merged `main` must both pass frozen install, typecheck, tests, build, forbidden scan, and all deterministic smoke runs.

---

### Task 1: Exact moving-body simulation

**Files:**
- Create: `packages/ai/src/simulation.ts`
- Create: `packages/ai/test/simulation.test.ts`
- Modify: `packages/ai/src/index.ts`

**Interfaces:**
- Consumes: `AiObservation`, shared direction/vector helpers.
- Produces: `createSimulatedState()`, `simulateMove()`, `SimulatedState`, `SimulationStep`.

- [ ] Write failing tests proving detached observation projection, reversal rejection, wall/body/hazard collision, vacating-tail entry, food consumption, growth, tail advance, and source/result isolation.
- [ ] Run `pnpm test -- packages/ai/test/simulation.test.ts` and confirm RED only on missing Phase 3 APIs.
- [ ] Implement the minimal exact simulator using Phase 1 movement semantics.
- [ ] Run the focused test and full `pnpm typecheck && pnpm test` until GREEN.
- [ ] Commit `feat(ai): add exact survival simulation`.

### Task 2: Flood-fill and topology analysis

**Files:**
- Create: `packages/ai/src/space.ts`
- Create: `packages/ai/test/space.test.ts`
- Modify: `packages/ai/src/index.ts`

**Interfaces:**
- Consumes: `SimulatedState`.
- Produces: `analyzeSpace()` and `SpaceAnalysis`.

- [ ] Write failing tests for reachable area, ratio, tail reachability, escape-route count, dead ends, corridor depth, and bottleneck pressure on deterministic fixtures.
- [ ] Confirm RED.
- [ ] Implement O(board-cells) flood fill plus bounded local corridor/topology analysis.
- [ ] Confirm focused and full GREEN.
- [ ] Commit `feat(ai): add flood fill and topology analysis`.

### Task 3: Bounded future-state lookahead

**Files:**
- Create: `packages/ai/src/lookahead.ts`
- Create: `packages/ai/test/lookahead.test.ts`
- Modify: `packages/ai/src/index.ts`

**Interfaces:**
- Consumes: `SimulatedState`, `simulateMove()`, `analyzeSpace()`.
- Produces: `evaluateSurvivalLookahead()` and `LookaheadResult`.

- [ ] Write failing tests for forced death, survivable horizon, moving-tail escape, deterministic canonical traversal, node-budget exhaustion, and repeated deep equality.
- [ ] Confirm RED.
- [ ] Implement depth-limited deterministic DFS with explicit global node budget and best fully evaluated horizon.
- [ ] Confirm GREEN and prove `nodesEvaluated <= nodeBudget`.
- [ ] Commit `feat(ai): add bounded survival lookahead`.

### Task 4: Hamiltonian endgame order

**Files:**
- Create: `packages/ai/src/hamiltonian.ts`
- Create: `packages/ai/test/hamiltonian.test.ts`
- Modify: `packages/ai/src/index.ts`

**Interfaces:**
- Produces: `createHamiltonianOrder()`, `hamiltonianMovePenalty()`.

- [ ] Write failing tests for even-width/even-height compatible rectangles, odd×odd incompatibility, unique full-board ordering, cycle adjacency including closure, and deterministic move penalties.
- [ ] Confirm RED.
- [ ] Implement deterministic serpentine-cycle construction for compatible rectangles and forward-order penalty calculation.
- [ ] Confirm GREEN.
- [ ] Commit `feat(ai): add Hamiltonian endgame ordering`.

### Task 5: Risk model

**Files:**
- Create: `packages/ai/src/risk.ts`
- Create: `packages/ai/test/risk.test.ts`
- Modify: `packages/ai/src/index.ts`

**Interfaces:**
- Produces: `assessRisk()`, `RiskAssessment`, `RiskContributors`.

- [ ] Write failing tests for 0–100 clamping, monotonic worsening for fewer safe moves/lower area/fewer escapes/higher trap pressure, deterministic contributor preservation, and level thresholds.
- [ ] Confirm RED.
- [ ] Implement explicit normalized weighted contributors and categorical thresholds.
- [ ] Confirm GREEN.
- [ ] Commit `feat(ai): add explainable survival risk model`.

### Task 6: Strategy selection and hysteresis

**Files:**
- Create: `packages/ai/src/strategy.ts`
- Create: `packages/ai/test/strategy.test.ts`
- Modify: `packages/ai/src/index.ts`

**Interfaces:**
- Produces: `selectStrategy()`, `StrategyMode`, `StrategyState`.

- [ ] Write failing tests for emergency escape/high-risk overrides, hunt/tail-follow/endgame/Hamiltonian selection, minimum dwell hysteresis, recovery, and repeatability.
- [ ] Confirm RED.
- [ ] Implement deterministic priority rules and minimum dwell logic.
- [ ] Confirm GREEN.
- [ ] Commit `feat(ai): add hybrid strategy state machine`.

### Task 7: Survival decision orchestration

**Files:**
- Create: `packages/ai/src/decision.ts`
- Create: `packages/ai/test/decision.test.ts`
- Modify: `packages/ai/src/index.ts`

**Interfaces:**
- Produces: `decideSurvivalMove()`, `SurvivalDecision`, `MoveEvaluation`, `DecisionReason`, `SurvivalDecisionConfig`.

- [ ] Write failing unit tests for canonical evaluation order, hard rejection, safe-food preference, unsafe-food rejection, least-risk fallback, deterministic scoring, evidence ownership, and budget reporting.
- [ ] Confirm RED.
- [ ] Implement candidate evaluation using simulation → space → lookahead → Hamiltonian → trap/risk → strategy.
- [ ] Ensure summaries are derived from evidence (`CRITICAL`, `FOOD PATH REJECTED`, `TAIL FOLLOW`, `HAMILTONIAN MODE`, or neutral strategy summary).
- [ ] Confirm full GREEN.
- [ ] Commit `feat(ai): add survival-first decision engine`.

### Task 8: Adversarial scenario suite

**Files:**
- Create: `packages/ai/test/survival-scenarios.test.ts`

- [ ] Add fixtures for pocket-food trap, one-safe-move escape, tail-follow-only survival, post-growth trap, dynamic-body escape closure, high-occupancy Hamiltonian order, all-risky fallback, and deterministic budget exhaustion.
- [ ] Run scenario suite and treat any failure as an implementation defect, not a test to weaken.
- [ ] Fix root causes in the smallest responsible module.
- [ ] Run all tests until GREEN.
- [ ] Commit `test(ai): add adversarial survival scenarios`.

### Task 9: Performance and deterministic production smoke

**Files:**
- Create: `packages/ai/test/survival-performance.test.ts`
- Create: `packages/ai/src/survival-headless.ts`
- Modify: `packages/ai/package.json`
- Modify: `package.json`
- Modify: `.github/workflows/phase-01-ci.yml`
- Modify: `scripts/check-forbidden-apis.mjs` only if necessary to include new source files automatically.

- [ ] Add 100×100 tests asserting finite completion, `nodesEvaluated <= configured budget`, and repeated deep-equal output.
- [ ] Add deterministic headless survival fixture and root `headless:survival` script.
- [ ] Extend CI to run `headless:survival` twice and `diff` outputs.
- [ ] Run full frozen production gate in PR CI.
- [ ] Commit `ci: add Phase 3 survival production gates`.

### Task 10: Production-readiness record and release

**Files:**
- Create: `docs/PHASE_03_PRODUCTION_READINESS.md`

- [ ] Record scope, invariants, exact test count, performance bounds, and phase boundary.
- [ ] Run Superpowers adversarial code review against `main...phase-03-survival-reasoning`.
- [ ] Fix every Critical/Important issue and add regressions where appropriate.
- [ ] Confirm branch is 0 behind `main` and final exact PR head passes all gates.
- [ ] Mark PR ready, squash-merge with expected-head SHA protection.
- [ ] Verify the exact merged `main` commit passes permanent CI.
- [ ] Update the readiness document with production SHA/workflow evidence and require the evidence commit itself to pass `main` CI.

## Self-review
- Spec coverage: all Phase 3 deliverables map to Tasks 1–10.
- No placeholders or deferred implementation language is used.
- Phase 4 simulation-harness work is not pulled into Phase 3 beyond bounded unit/performance fixtures.
- Public interface names are consistent with the design spec.
- All decision-affecting budgets are structural/node based, preserving determinism.