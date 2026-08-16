# Phase 7 Progression, Records, Run Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build deterministic level/run lifecycle, persistent records/statistics, spectator milestones, run summaries, commands, and restart behavior on top of the verified Phase 6 simulation stack.

**Architecture:** Add focused pure modules inside `packages/simulation/src` and expose them through the existing package index. Existing `evaluateProgression` and level runners remain authoritative; Phase 7 consumes their evidence and never changes physics, AI scoring, or failure probabilities.

**Tech Stack:** TypeScript 5.8, Vitest 3, pnpm workspace, existing `@snake/levels`, `@snake/engine`, `@snake/ai`, `@snake/failure` contracts.

## Global Constraints
- Deterministic and tick-driven; no wall-clock, browser, rendering, or unseeded-random APIs.
- No Phase 8+ rendering/HUD/audio/operator-dashboard implementation.
- Preserve all Phase 1–6 test and production gates.
- Public state must be immutable/read-only shaped and serializable.
- Invalid contextual commands are deterministic no-ops; malformed durable input is rejected.

---

### Task 1: Records and cumulative statistics
**Files:** Create `packages/simulation/src/records.ts`; create `packages/simulation/test/records.test.ts`.
**Produces:** `AllTimeRecords`, `CompletedLevelEvidence`, `createEmptyRecords()`, `updateRecords(records, evidence)`.
- [ ] Write RED tests for total games/deaths/food/play ticks, highest level, streaks, max length/occupancy/survival/high score, fastest completion, and strict-improvement markers.
- [ ] Run `pnpm test -- packages/simulation/test/records.test.ts` and verify RED.
- [ ] Implement immutable record updates and marker list.
- [ ] Re-run focused tests and typecheck.
- [ ] Commit.

### Task 2: Milestones and near-death events
**Files:** Create `packages/simulation/src/milestones.ts`, `packages/simulation/src/near-death.ts`; create tests `milestones.test.ts`, `near-death.test.ts`.
**Produces:** `MilestoneEvent`, `MilestoneState`, `evaluateMilestones(...)`, `NearDeathEvent`, `detectNearDeathEvent(...)`.
- [ ] Write RED tests proving milestone threshold events, lifetime dedupe, minimum-tick spacing, and deterministic ordering.
- [ ] Write RED tests mapping AI safe-move/risk evidence into rate-limited near-death events.
- [ ] Implement minimal pure evaluators.
- [ ] Run focused tests/typecheck and commit.

### Task 3: Death classification and run summaries
**Files:** Create `packages/simulation/src/run-summary.ts`; create `packages/simulation/test/run-summary.test.ts`.
**Produces:** `SpectatorDeath`, `RunSummary`, `classifyDeath(...)`, `buildRunSummary(...)`.
- [ ] Write RED tests for all engine death-cause families, preservation of internal cause, configured-deviation attribution passthrough, and new-record markers.
- [ ] Implement classification and summary construction from `LevelSimulationResult`/record update evidence.
- [ ] Run focused tests/typecheck and commit.

### Task 4: Lifecycle reducer and completion policies
**Files:** Create `packages/simulation/src/lifecycle.ts`; create `packages/simulation/test/lifecycle-phase7.test.ts`.
**Produces:** `LifecycleState`, `LifecycleConfig`, `CompletionPolicy`, `LifecycleCommand`, `createLifecycleState()`, `reduceLifecycle()`, `completeLevel()`, `endRun()`.
- [ ] Write RED tests for immediate advance, celebration, pause, operator-confirm, death→summary→countdown→new-run, streak increment/reset, and every command.
- [ ] Implement deterministic state transitions and no-op invalid commands.
- [ ] Run focused tests/typecheck and commit.

### Task 5: Versioned persistence
**Files:** Create `packages/simulation/src/persistence.ts`; create `packages/simulation/test/persistence-phase7.test.ts`.
**Produces:** `ProgressionSnapshotV1`, `serializeProgressionState(...)`, `parseProgressionState(...)`.
- [ ] Write RED tests for round trip, reference isolation, unsupported schema, negative/non-finite counters, invalid lifecycle phase/countdown/level.
- [ ] Implement canonical serializer/parser.
- [ ] Run focused tests/typecheck and commit.

### Task 6: Autonomous session orchestration and telemetry hook
**Files:** Modify `packages/simulation/src/level-run.ts`; create `packages/simulation/src/autonomous-session.ts`; create `packages/simulation/test/autonomous-session.test.ts`.
**Produces:** optional `LevelDecisionObserver`, `AutonomousSessionState`, `applyLevelResultToSession(...)`, `advanceAutonomousSession(...)`.
- [ ] Write RED test that decision observation emits near-death evidence without changing selected direction or baseline run output.
- [ ] Write RED deterministic multi-cycle tests across level completion/death/restart and manual commands.
- [ ] Add neutral observer hook to level runner, preserving existing output byte-for-byte when absent.
- [ ] Implement session orchestration using lifecycle/records/summary modules.
- [ ] Run focused tests plus existing level/failure parity tests and commit.

### Task 7: Export, harden, and production corpus
**Files:** Modify `packages/simulation/src/index.ts`, `scripts/check-forbidden-apis.mjs`; create `packages/simulation/test/phase7-production.test.ts`; create `docs/production/PHASE_07_PRODUCTION_READINESS.md`.
**Produces:** stable public exports and permanent Phase 7 release evidence.
- [ ] Export all Phase 7 APIs.
- [ ] Extend forbidden-API scan to `packages/simulation/src`.
- [ ] Add a deterministic thousands-cycle lifecycle corpus proving bounded milestone/event state and repeatable serialized snapshots.
- [ ] Run full `pnpm typecheck`, `pnpm test`, `pnpm build`, forbidden scan, determinism/worker checks, 1,000-run benchmark, and 10,000-run command path.
- [ ] Inspect PR diff for Phase 8+ scope leakage and accidental physics/AI/failure changes.
- [ ] Write production-readiness record with exact green SHA and gates.
- [ ] Re-run full workflow on the exact documentation head.
- [ ] Mark PR ready, squash-merge with expected-head protection, and independently verify merged `main` through the full workflow.