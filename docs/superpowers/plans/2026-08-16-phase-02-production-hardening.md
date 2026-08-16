# Phase 2 Production Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Phase 2 deterministic pathfinding package a production-safe static-board routing boundary before Phase 3 begins.

**Architecture:** Preserve `@snake/ai` as a pure deterministic package. Harden endpoint semantics, naming, isolation, and structural performance invariants without adding future-state simulation or survival reasoning.

**Tech Stack:** TypeScript 5.8.3, Vitest 3.2.4, pnpm 10.15.0, Node.js >=22, GitHub Actions.

## Global Constraints

- No Phase 3 survival logic may be introduced.
- No wall-clock, browser, storage, timer, or unseeded-randomness dependency may enter `packages/ai/src`.
- BFS and A* must share endpoint semantics.
- All production verification uses `pnpm install --frozen-lockfile`.
- `main` must pass the permanent workflow after merge before the review is complete.

---

### Task 1: Harden search endpoint outcomes

**Files:**
- Modify: `packages/ai/src/path.ts`
- Modify: `packages/ai/src/bfs.ts`
- Modify: `packages/ai/src/astar.ts`
- Test: `packages/ai/test/bfs.test.ts`
- Test: `packages/ai/test/astar.test.ts`

**Interfaces:**
- Produces: `SearchOutcome = 'found' | 'unreachable' | 'invalid-start' | 'invalid-target' | 'blocked-target'`
- Preserves: `findPathBfs(observation, start, target, options?)`
- Preserves: `findPathAStar(observation, start, target, options?)`

- [ ] **Step 1: Write failing BFS endpoint tests**

Add assertions that an out-of-board start returns `invalid-start`, an out-of-board target returns `invalid-target`, a body/obstacle/hazard target returns `blocked-target`, and `traversableTarget` overrides blocking only for that exact target.

- [ ] **Step 2: Run BFS tests and verify RED**

Run: `pnpm test -- packages/ai/test/bfs.test.ts`
Expected: FAIL because current API collapses start/target validation and blocked targets.

- [ ] **Step 3: Write matching failing A* endpoint tests**

Mirror the BFS endpoint matrix in `astar.test.ts`.

- [ ] **Step 4: Run A* tests and verify RED**

Run: `pnpm test -- packages/ai/test/astar.test.ts`
Expected: FAIL for the same missing endpoint semantics.

- [ ] **Step 5: Implement a shared endpoint classifier**

In `path.ts`, add a pure helper that classifies start/target validity using board bounds and the precomputed blocked set while respecting `traversableTarget`. Use it from both algorithms so semantics cannot drift.

- [ ] **Step 6: Update BFS and A***

Return the exact new outcomes before search begins. Keep `start === target` as `found` when start is in bounds.

- [ ] **Step 7: Run focused tests and verify GREEN**

Run: `pnpm test -- packages/ai/test/bfs.test.ts packages/ai/test/astar.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

Commit message: `fix(ai): harden path endpoint semantics`

---

### Task 2: Make candidate distance semantics explicit

**Files:**
- Modify: `packages/ai/src/candidates.ts`
- Modify: `packages/ai/src/headless.ts`
- Test: `packages/ai/test/candidates.test.ts`

**Interfaces:**
- Replace: `CandidateMove.targetDistance`
- With: `CandidateMove.staticTargetDistance`

- [ ] **Step 1: Write failing contract tests**

Update candidate tests to require `staticTargetDistance` and assert `targetDistance` is absent. Include a fixture where the old head/body geometry makes the value clearly static-board telemetry rather than a future-state guarantee.

- [ ] **Step 2: Run focused test and verify RED**

Run: `pnpm test -- packages/ai/test/candidates.test.ts`
Expected: FAIL because the old property still exists.

- [ ] **Step 3: Rename implementation field**

Rename the interface field and all ranking logic references to `staticTargetDistance`. Preserve ordering behavior.

- [ ] **Step 4: Update headless output**

Emit `staticTargetDistance` so deterministic smoke output reflects the public contract.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `pnpm test -- packages/ai/test/candidates.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

Commit message: `refactor(ai): clarify static candidate distance semantics`

---

### Task 3: Prove deep observation and result isolation

**Files:**
- Test: `packages/ai/test/observation.test.ts`
- Test: `packages/ai/test/planners.test.ts`
- Test: `packages/ai/test/bfs.test.ts`

**Interfaces:**
- Preserves: `createObservation(state)`
- Preserves: route/planner result shapes except renamed candidate field from Task 2.

- [ ] **Step 1: Add observation mutation-isolation tests**

Create an engine state fixture, build an observation, deliberately mutate nested observation vectors/records through casts, and assert the original engine state remains unchanged. Then mutate the original fixture/state after observation creation and assert the observation remains unchanged.

- [ ] **Step 2: Add route aliasing test**

Pass mutable `start` and `target` vectors into BFS, mutate them after the call, and assert returned route coordinates are unchanged.

- [ ] **Step 3: Add planner target isolation test**

Plan to food/tail, mutate observation coordinates afterward, and assert returned planner target coordinates remain unchanged.

- [ ] **Step 4: Run focused tests**

Run: `pnpm test -- packages/ai/test/observation.test.ts packages/ai/test/bfs.test.ts packages/ai/test/planners.test.ts`
Expected: PASS if existing defensive-copy behavior is complete; otherwise fix only the aliasing source and rerun.

- [ ] **Step 5: Commit**

Commit message: `test(ai): lock down observation and result isolation`

---

### Task 4: Add pathological structural performance invariants

**Files:**
- Modify: `packages/ai/test/performance.test.ts`

**Interfaces:**
- No public API changes.

- [ ] **Step 1: Add dense 100x100 fixture**

Construct a deterministic dense obstacle pattern with at least one traversable corridor and one unreachable region.

- [ ] **Step 2: Add structural assertions**

For BFS and A*, assert `nodesExplored <= 10000`, `frontierPeak <= 10000`, every returned coordinate is in bounds, and two repeated calls are deeply equal.

- [ ] **Step 3: Run performance tests**

Run: `pnpm test -- packages/ai/test/performance.test.ts`
Expected: PASS without introducing wall-clock thresholds.

- [ ] **Step 4: Commit**

Commit message: `test(ai): add dense-board structural bounds`

---

### Task 5: Production verification and release review

**Files:**
- Modify only if needed: `docs/PHASE_02_PRODUCTION_READINESS.md`

**Interfaces:**
- No runtime API changes beyond Tasks 1-2.

- [ ] **Step 1: Run complete local/CI-equivalent verification**

Run: `pnpm typecheck && pnpm test && pnpm build && pnpm check:forbidden && pnpm headless && pnpm headless:ai`
Expected: PASS.

- [ ] **Step 2: Open a PR against `main`**

The PR must contain only Phase 2 hardening files and documentation.

- [ ] **Step 3: Verify PR workflow**

Require frozen install, typecheck, complete tests, builds, forbidden API scan, repeated engine output, and repeated AI output to pass on the exact PR head.

- [ ] **Step 4: Perform adversarial diff review**

Check for Phase 3 scope creep, nondeterministic ordering, mutable aliasing, unbounded collections, accidental package-boundary changes, and misleading telemetry naming.

- [ ] **Step 5: Squash-merge with expected-head guard**

Merge only the exact green head.

- [ ] **Step 6: Verify merged `main`**

Wait for the permanent `main` workflow on the squash commit and require success before declaring Phase 2 production-ready.

- [ ] **Step 7: Update production-readiness documentation**

Record final test count, main commit SHA, workflow result, and the explicit static-board contract.

- [ ] **Step 8: Commit documentation if needed and re-verify `main`**

Any post-merge documentation-only change must still trigger and pass permanent CI.
