# Phase 2 Deterministic AI Pathfinding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready deterministic `@snake/ai` pathfinding package with immutable observations, grid graph semantics, BFS/A*, food/tail planners, candidate ranking, telemetry, and CI verification.

**Architecture:** `@snake/ai` consumes read-only Phase 1 engine state but never owns simulation state. Search functions are pure and deterministic; BFS is the canonical shortest-path solver and A* is a deterministic optimization. Search evidence is renderer-independent and timing is injected outside the pure search core.

**Tech Stack:** TypeScript 5.8.3, pnpm 10.15.0 workspaces, Vitest 3.2.4, Node.js 22, GitHub Actions.

## Global Constraints
- Preserve Phase 1 deterministic simulation and all 30 existing tests.
- `@snake/engine` must not import `@snake/ai` in Phase 2.
- Canonical neighbor order is `up`, `right`, `down`, `left`.
- Core search must not call wall-clock, browser, DOM, storage, or unseeded randomness APIs.
- Phase 3 survival reasoning is out of scope.
- Production readiness requires green CI on the exact PR head and again on merged `main`.

---

## File structure

Create:
- `packages/ai/package.json` — package metadata and scripts.
- `packages/ai/tsconfig.json` — strict package compilation.
- `packages/ai/src/observation.ts` — immutable `GameState` projection.
- `packages/ai/src/graph.ts` — board bounds, blocking, canonical neighbors.
- `packages/ai/src/path.ts` — route types and reconstruction helpers.
- `packages/ai/src/bfs.ts` — BFS and distance maps.
- `packages/ai/src/astar.ts` — deterministic A*.
- `packages/ai/src/planners.ts` — food/tail planning.
- `packages/ai/src/candidates.ts` — deterministic baseline move ranking.
- `packages/ai/src/timing.ts` — optional injected timing wrapper.
- `packages/ai/src/index.ts` — public exports.
- `packages/ai/test/observation.test.ts`
- `packages/ai/test/graph.test.ts`
- `packages/ai/test/bfs.test.ts`
- `packages/ai/test/astar.test.ts`
- `packages/ai/test/planners.test.ts`
- `packages/ai/test/candidates.test.ts`
- `packages/ai/test/performance.test.ts`
- `packages/ai/test/determinism.test.ts`
- `packages/ai/src/headless.ts` — deterministic smoke output.

Modify:
- `package.json` — Phase 2 headless script and production gate.
- `vitest.config.ts` — aliases for source-level workspace resolution.
- `scripts/check-forbidden-apis.mjs` — scan pure AI source while excluding timing adapter if it uses injected time only.
- `.github/workflows/phase-01-ci.yml` — rename/display as core CI if desired and include Phase 2 smoke verification.

---

### Task 1: Scaffold `@snake/ai` and immutable observation

**Files:**
- Create: `packages/ai/package.json`
- Create: `packages/ai/tsconfig.json`
- Create: `packages/ai/src/observation.ts`
- Create: `packages/ai/src/index.ts`
- Test: `packages/ai/test/observation.test.ts`
- Modify: `vitest.config.ts`

**Interfaces:**
- Consumes: `GameState` from `@snake/engine`, `Vec2` and `Direction` from `@snake/shared`.
- Produces: `AiObservation`, `createObservation(state)`.

- [ ] **Step 1: Write failing observation tests**

Tests must assert: dimensions/head/tail/body/food are projected correctly; mutating the returned observation cannot mutate the engine state; repeated observations are deep-equal.

- [ ] **Step 2: Run the focused test**

Run: `pnpm vitest run packages/ai/test/observation.test.ts`
Expected: FAIL because `@snake/ai`/`createObservation` does not exist.

- [ ] **Step 3: Implement package scaffold and observation**

Use cloned coordinate arrays/objects and readonly TypeScript interfaces. Export from `src/index.ts`. Add a Vite alias for `@snake/ai` to `packages/ai/src/index.ts` while retaining existing `@snake/shared` and engine source resolution.

- [ ] **Step 4: Run observation test and workspace typecheck**

Run: `pnpm vitest run packages/ai/test/observation.test.ts && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat(ai): add immutable pathfinding observation"`

---

### Task 2: Deterministic grid graph semantics

**Files:**
- Create: `packages/ai/src/graph.ts`
- Test: `packages/ai/test/graph.test.ts`

**Interfaces:**
- Produces:
  - `CANONICAL_DIRECTIONS: readonly Direction[]`
  - `cellKey(cell, width): number`
  - `isTraversable(observation, cell, options?): boolean`
  - `enumerateNeighbors(observation, cell, options?): readonly Neighbor[]`

- [ ] **Step 1: Write failing graph tests**

Cover interior/corner order, board edges, snake body blocking, obstacle blocking, and explicit target-cell traversal.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `pnpm vitest run packages/ai/test/graph.test.ts`
Expected: FAIL because graph functions are missing.

- [ ] **Step 3: Implement minimal graph helpers**

Neighbor order must always be `up`, `right`, `down`, `left`. Do not use sets/maps with iteration order as a policy decision unless insertion is explicitly canonical.

- [ ] **Step 4: Run graph tests**

Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat(ai): add deterministic board graph"`

---

### Task 3: Route representation, reconstruction, and BFS

**Files:**
- Create: `packages/ai/src/path.ts`
- Create: `packages/ai/src/bfs.ts`
- Test: `packages/ai/test/bfs.test.ts`

**Interfaces:**
- Produces `PathRoute`, `SearchTelemetry`, `SearchResult`.
- Produces `findPathBfs(observation, start, target, options?)` and `buildDistanceMap(...)`.

- [ ] **Step 1: Write failing BFS tests**

Cover open-board shortest route, zero-length route, obstacle detour, unreachable target, invalid target, distance map values, canonical route reconstruction, and route directions matching coordinate deltas.

- [ ] **Step 2: Verify RED**

Run: `pnpm vitest run packages/ai/test/bfs.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement BFS with predecessor map**

Use an array queue with a numeric cursor to avoid repeated `shift()`. Record `nodesExplored`, `frontierPeak`, outcome, and path length. Search is bounded by board cell count.

- [ ] **Step 4: Run BFS tests plus previous suites**

Run: `pnpm vitest run packages/ai/test/bfs.test.ts packages/ai/test/graph.test.ts packages/ai/test/observation.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat(ai): add deterministic BFS pathfinding"`

---

### Task 4: Deterministic A*

**Files:**
- Create: `packages/ai/src/astar.ts`
- Test: `packages/ai/test/astar.test.ts`

**Interfaces:**
- Produces `findPathAStar(observation, start, target, options?)`.

- [ ] **Step 1: Write failing A* tests**

Assert shortest-path equivalence with BFS, deterministic ties, obstacle detour, invalid/unreachable cases, and repeated deep equality.

- [ ] **Step 2: Verify RED**

Run: `pnpm vitest run packages/ai/test/astar.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement A***

Use Manhattan `h`; priority comparator is `(f, h, insertionSequence)`. A binary heap or bounded sorted frontier is acceptable; choose a binary min-heap for predictable large-board behavior.

- [ ] **Step 4: Run BFS and A* suites**

Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat(ai): add deterministic A-star search"`

---

### Task 5: Food and tail planners

**Files:**
- Create: `packages/ai/src/planners.ts`
- Test: `packages/ai/test/planners.test.ts`

**Interfaces:**
- Produces `planPathToFood(observation, options?)`.
- Produces `planPathToTail(observation, options?)`.

- [ ] **Step 1: Write failing planner tests**

Food tests: no food, one food, multiple reachable targets, unreachable closer target with reachable farther target, deterministic row-major/id tie resolution. Tail tests: tail cell is traversable; other body cells remain blocked; no future-tail safety claim is made.

- [ ] **Step 2: Verify RED**

Run: `pnpm vitest run packages/ai/test/planners.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement planners**

Default to BFS. Permit optional `'astar'` algorithm selection while preserving planner target-selection policy.

- [ ] **Step 4: Run planner/search suites**

Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat(ai): add food and tail route planners"`

---

### Task 6: Candidate move ranking

**Files:**
- Create: `packages/ai/src/candidates.ts`
- Test: `packages/ai/test/candidates.test.ts`

**Interfaces:**
- Produces `CandidateMove` and `rankCandidateMoves(observation, target?)`.

- [ ] **Step 1: Write failing ranking tests**

Cover illegal directions, finite vs unreachable target distance, lower distance preference, canonical tie order, and stable repeated results.

- [ ] **Step 2: Verify RED**

Run focused Vitest suite; expected FAIL.

- [ ] **Step 3: Implement deterministic ranking**

Ranking is legal-first, reachable-first, lower-distance, then canonical order. Do not add Phase 3 safety weights.

- [ ] **Step 4: Run ranking suite**

Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat(ai): add deterministic candidate ranking"`

---

### Task 7: Optional timing adapter and deterministic telemetry boundary

**Files:**
- Create: `packages/ai/src/timing.ts`
- Test: extend `packages/ai/test/determinism.test.ts`

**Interfaces:**
- Produces `Clock { now(): number }` and `withTiming(searchFn, clock)` wrapper returning `elapsedMs` separately from pure `SearchResult`.

- [ ] **Step 1: Write failing injected-clock test**

Use a fake clock and verify elapsed calculation while the underlying route/telemetry remain identical.

- [ ] **Step 2: Verify RED**

Expected: FAIL.

- [ ] **Step 3: Implement wrapper with no global clock dependency**

No `Date.now()` or `performance.now()` inside pure search.

- [ ] **Step 4: Run determinism suite**

Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat(ai): add injected pathfinding timing telemetry"`

---

### Task 8: Large-board performance and determinism gates

**Files:**
- Create: `packages/ai/test/performance.test.ts`
- Create: `packages/ai/test/determinism.test.ts`
- Create: `packages/ai/src/headless.ts`

**Interfaces:**
- Headless command emits stable JSON containing representative BFS/A* route lengths, nodes explored, and selected directions.

- [ ] **Step 1: Write failing 100x100 operation-count tests**

Assert bounded nodes, no recursion failure, A* explores no more nodes than BFS on the standard long open-board benchmark, and repeated calls are deep-equal.

- [ ] **Step 2: Verify RED where headless/export behavior is missing**

- [ ] **Step 3: Implement headless deterministic smoke runner**

Use fixed engine seed/state fixtures and JSON output with no elapsed-time fields.

- [ ] **Step 4: Run all AI tests**

Run: `pnpm vitest run packages/ai/test`
Expected: all PASS.

- [ ] **Step 5: Commit**

`git commit -m "test(ai): add large-board and deterministic smoke gates"`

---

### Task 9: Production CI integration and final hardening

**Files:**
- Modify: `package.json`
- Modify: `scripts/check-forbidden-apis.mjs`
- Modify: `.github/workflows/phase-01-ci.yml`
- Create: `docs/PHASE_02_PRODUCTION_READINESS.md`

**Interfaces:**
- Root scripts add `headless:ai` and include AI in `verify`/production checks.

- [ ] **Step 1: Extend forbidden API scan to pure AI core**

Scan all AI source except the injected timing boundary if necessary; injected timing itself may not access global clocks.

- [ ] **Step 2: Add CI repeated AI headless output comparison**

Run `pnpm headless:ai` twice and `diff -u` outputs.

- [ ] **Step 3: Run full local/CI-equivalent verification**

Commands:
`pnpm install --frozen-lockfile`
`pnpm typecheck`
`pnpm test`
`pnpm build`
`pnpm check:forbidden`
`pnpm headless`
`pnpm headless:ai`

Expected: all exit 0.

- [ ] **Step 4: Open PR and inspect GitHub Actions**

Fix root causes for any failure using systematic debugging; never weaken a gate to make it green.

- [ ] **Step 5: Final review**

Verify no Phase 3 features leaked into scope, branch is not behind `main`, all tests are green, lockfile is frozen, and PR diff contains only Phase 2/relevant CI changes.

- [ ] **Step 6: Squash merge exact green head and verify `main` CI**

Phase 2 is complete only when the post-merge workflow on `main` passes the same production gate.
