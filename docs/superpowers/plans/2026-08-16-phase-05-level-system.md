# Phase 5 Level System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready deterministic level domain with generic engine environment mechanics and 20 validated, strategically distinct headless levels.

**Architecture:** Add `@snake/levels` for Zod schemas, semantic validation, migrations, registry, geometry, mechanics, goals, and level definitions. Extend `@snake/engine` only with generic environment semantics; integrate `@snake/simulation` through a level-aware adapter so existing reports and worker determinism remain authoritative.

**Tech Stack:** TypeScript 5.8, pnpm 10.15 workspaces, Vitest 3.2, Node.js 22, Zod 4, existing `@snake/shared`, `@snake/engine`, `@snake/ai`, and `@snake/simulation`.

## Global Constraints
- No level name/number special cases in engine movement code.
- No renderer, browser, React, PixiJS, audio, OBS, or stream dependencies in levels/engine/simulation domains.
- Same level + seed + AI config + harness config must produce byte-identical deterministic results.
- No wall-clock reads or unseeded randomness in deterministic mechanics.
- Portals resolve at most once per move and never recurse.
- Runtime mechanic invariant violations fail hard with level/seed/tick context.
- Existing baseline behavior remains unchanged when environment options are omitted.
- All 20 levels must validate, run headlessly, and have a tested defining mechanic.

---

### Task 1: Generic engine environment primitives

**Files:**
- Modify: `packages/engine/src/config.ts`
- Modify: `packages/engine/src/state.ts`
- Modify: `packages/engine/src/snake.ts`
- Modify: `packages/engine/src/reducer.ts`
- Modify: `packages/engine/src/runtime.ts`
- Modify: `packages/engine/src/events.ts`
- Test: `packages/engine/test/environment.test.ts`
- Test: `packages/engine/test/determinism.test.ts`

**Interfaces:**
- Produces `EngineEnvironmentConfig` with optional `wrap`, `obstacles`, `hazards`, `portals`, `food`, and `activeBounds`.
- Produces generic death causes `obstacle-collision`, `hazard-collision`, and `bounds-collision` in addition to existing causes.
- Preserves existing `createBaselineConfig(seed)` output semantics.

- [ ] Write failing tests proving wrap movement, obstacle collision, hazard collision, one-hop portal transport, blocked portal exit failure, active-boundary collision, typed food growth/score effects, and unchanged baseline snapshots.
- [ ] Run `pnpm test -- packages/engine/test/environment.test.ts packages/engine/test/determinism.test.ts` and confirm RED because environment fields/semantics are absent.
- [ ] Extend config/state types with immutable generic descriptors; defaults must remain empty/disabled.
- [ ] Refactor movement resolution into deterministic stages: direction -> raw head -> wrap -> portal -> active bounds -> obstacle/hazard -> self -> food.
- [ ] Extend food resolution so an entity can provide `growthDelta` and `scoreDelta` while legacy normal food still behaves as `growthPerFood`/`scorePerFood`.
- [ ] Re-run focused tests and confirm GREEN.
- [ ] Commit `feat(engine): add generic environment mechanics`.

### Task 2: Zod level schema, migrations, and semantic validation

**Files:**
- Create: `packages/levels/package.json`
- Create: `packages/levels/tsconfig.json`
- Create: `packages/levels/src/types.ts`
- Create: `packages/levels/src/schema.ts`
- Create: `packages/levels/src/migrate.ts`
- Create: `packages/levels/src/validate.ts`
- Create: `packages/levels/src/index.ts`
- Test: `packages/levels/test/schema.test.ts`
- Test: `packages/levels/test/validation.test.ts`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Produces `LevelDefinitionSchema`, `LevelDefinition`, `LevelValidationError`.
- Produces `parseLevelDefinition(input): LevelDefinition`.
- Produces `migrateLevelDefinition(input: unknown): LevelDefinition`.
- Produces `validateLevelDefinition(level: LevelDefinition): void`.

- [ ] Write failing schema tests covering identity, board, snake, timing, obstacles, hazards, portals, typed food rules, goals, completion policy, difficulty, AI modifiers, theme, and mechanics descriptors.
- [ ] Write failing semantic tests for out-of-bounds cells, spawn conflicts, duplicate IDs/cells, incomplete portals, invalid schedules, impossible capacity goals, missing theme refs, and unsafe AI modifiers.
- [ ] Run `pnpm test -- packages/levels/test/schema.test.ts packages/levels/test/validation.test.ts` and confirm RED.
- [ ] Add Zod as the only new runtime dependency for `@snake/levels`; implement schema-v1 parsing and deterministic issue paths.
- [ ] Implement migration dispatch that accepts v1 unchanged and rejects unsupported/future schema versions deterministically.
- [ ] Implement semantic validation as pure cross-field checks after Zod parsing.
- [ ] Re-run focused tests and confirm GREEN.
- [ ] Commit `feat(levels): add versioned level schema`.

### Task 3: Deterministic geometry, spawn compilation, and registry

**Files:**
- Create: `packages/levels/src/geometry.ts`
- Create: `packages/levels/src/spawn.ts`
- Create: `packages/levels/src/registry.ts`
- Create: `packages/levels/src/compile.ts`
- Test: `packages/levels/test/geometry.test.ts`
- Test: `packages/levels/test/registry.test.ts`
- Test: `packages/levels/test/compile.test.ts`

**Interfaces:**
- Produces geometry helpers for wall, corridor, chamber/crossroads, islands, maze/labyrinth, ring/bounds, and seeded grid patterns.
- Produces `compileLevel(level: LevelDefinition, seed: number): CompiledLevel`.
- Produces `registerLevels(levels)`, `getLevel(id)`, `getLevelByNumber(number)`, `listLevels()`.

- [ ] Write failing tests asserting every geometry helper is coordinate-valid, duplicate-free, deterministic, and stable for fixed inputs.
- [ ] Write failing compilation tests proving spawn body generation respects direction/length, generated geometry stays in bounds, and compiled engine config contains no level-name branching.
- [ ] Write failing registry tests for unique IDs/numbers and stable numeric order.
- [ ] Run the focused tests and confirm RED.
- [ ] Implement pure geometry/spawn functions and deterministic seeded grid generation using existing deterministic integer mixing, never `Math.random()`.
- [ ] Implement registry and compiler that converts declarative descriptors into generic engine config/environment data.
- [ ] Re-run focused tests and confirm GREEN.
- [ ] Commit `feat(levels): add deterministic geometry and registry`.

### Task 4: Mechanic schedules and progression-goal evaluator

**Files:**
- Create: `packages/levels/src/mechanics.ts`
- Create: `packages/levels/src/goals.ts`
- Test: `packages/levels/test/mechanics.test.ts`
- Test: `packages/levels/test/goals.test.ts`

**Interfaces:**
- Produces `resolveMechanics(level, seed, tick, engineState): MechanicFrame`.
- Produces `evaluateProgression(level, state, mechanicState): ProgressionEvaluation`.

- [ ] Write failing tests for periodic moving obstacles, periodic hazards, shrinking active bounds, Chaos Grid seed/tick reconfiguration, deterministic food cadence metadata, and repeated-call equality.
- [ ] Write failing goal tests for length, food count, survival ticks, occupancy, score, mechanic objective, `all`, and `any` aggregation with per-goal evidence.
- [ ] Run focused tests and confirm RED.
- [ ] Implement mechanic schedule resolution as pure descriptor interpretation over `(level, seed, tick, state)`.
- [ ] Implement progression evaluation without mutating engine state.
- [ ] Re-run focused tests and confirm GREEN.
- [ ] Commit `feat(levels): add mechanics and progression goals`.

### Task 5: First 20 production level definitions

**Files:**
- Create: `packages/levels/src/definitions.ts`
- Test: `packages/levels/test/levels.test.ts`
- Test: `packages/levels/test/fixtures.test.ts`

**Interfaces:**
- Produces ordered `LEVELS: readonly LevelDefinition[]` containing exactly levels 1–20.
- Each level exposes a deterministic `mechanicFingerprint` derived from structural gameplay descriptors for test comparison.

- [ ] Write failing roster test requiring exactly 20 unique IDs/numbers/names in the documented order.
- [ ] Write one failing defining-mechanic assertion for every level: open baseline; pressure area; wall; corridors; crossroads; speed; islands; maze; moving walls; famine; hunter; portals; dual food; poison; shrink; chaos; hyper speed; labyrinth; large start; singularity occupancy.
- [ ] Write failing validation loop requiring all definitions to pass schema + semantic validation.
- [ ] Run focused tests and confirm RED.
- [ ] Implement all 20 definitions using only schema-supported descriptors and shared geometry helpers.
- [ ] Tune safe starting values so every level has a valid spawn and at least one legal opening move.
- [ ] Re-run focused tests and confirm GREEN.
- [ ] Commit `feat(levels): ship first twenty levels`.

### Task 6: Level-aware AI observation and simulation orchestration

**Files:**
- Modify: `packages/ai/src/observation.ts`
- Modify: `packages/ai/src/graph.ts`
- Create: `packages/simulation/src/level-run.ts`
- Create: `packages/simulation/src/level-batch.ts`
- Modify: `packages/simulation/src/index.ts`
- Test: `packages/ai/test/environment-observation.test.ts`
- Test: `packages/simulation/test/level-run.test.ts`
- Test: `packages/simulation/test/level-batch.test.ts`

**Interfaces:**
- AI observation gains generic `wrap`, portal, and active-bounds topology metadata needed for path legality.
- Produces `runLevelSimulation(level, seed, aiConfig, harnessConfig)`.
- Produces `runLevelBatch(levels, seeds, options)` with existing Phase 4 aggregation/funnel semantics.

- [ ] Write failing AI tests proving obstacles/hazards/portal exits/wrap metadata reach the graph without importing levels package into AI.
- [ ] Write failing simulation tests proving mechanics are applied deterministically before decisions/ticks, progression completion ends a level correctly, and identical seed runs are byte-equal.
- [ ] Write failing batch test proving ordered multi-level funnel data and deterministic replay context include level ID/version.
- [ ] Run focused tests and confirm RED.
- [ ] Extend observation/topology generically and implement level-aware simulation adapter that compiles `@snake/levels` inputs while preserving Phase 4 report contracts.
- [ ] Re-run focused tests and confirm GREEN.
- [ ] Commit `feat(simulation): run deterministic level batches`.

### Task 7: Headless all-level smoke and difficulty tuning

**Files:**
- Create: `packages/levels/src/headless.ts`
- Create: `packages/simulation/src/levels-smoke.ts`
- Modify: `packages/levels/package.json`
- Modify: `package.json`
- Test: `packages/levels/test/headless.test.ts`
- Test: `packages/simulation/test/levels-production.test.ts`

**Interfaces:**
- Root command `pnpm levels:validate` validates and summarizes all 20 levels.
- Root command `pnpm simulate:levels-smoke` runs every level on a fixed small deterministic corpus.

- [ ] Write failing production test requiring all 20 levels to start, execute at least one legal decision or deterministic terminal event, remain finite, and serialize deterministic summaries.
- [ ] Add broad difficulty-band structural assertions using fixed corpora: later bands must increase at least one of occupancy pressure, obstacle/hazard density, speed pressure, food scarcity, start length, or topology constraint; do not assert brittle exact win percentages.
- [ ] Run production-focused tests and confirm RED.
- [ ] Implement validation/headless commands and tune only declarative level parameters until the structural difficulty progression is monotonic enough to satisfy the broad assertions.
- [ ] Re-run focused tests and confirm GREEN.
- [ ] Commit `test(levels): add all-level production corpus`.

### Task 8: Permanent CI gates and import boundaries

**Files:**
- Modify: `.github/workflows/phase-01-ci.yml`
- Modify: `scripts/check-forbidden-apis.mjs`
- Create: `packages/levels/test/import-boundary.test.ts`

**Interfaces:**
- CI validates all 20 levels, repeats all-level smoke twice and diffs output, and preserves Phase 1–4 production probes.

- [ ] Write failing import-boundary test rejecting browser/render/audio dependencies and globals in `@snake/levels`.
- [ ] Extend forbidden scan to include `packages/levels/src` while allowing only deterministic Node-free domain code.
- [ ] Add CI steps `pnpm levels:validate`, repeated `pnpm simulate:levels-smoke` byte diff, and existing full test/build/determinism gates.
- [ ] Run focused boundary test and full local-equivalent commands through GitHub Actions on the branch.
- [ ] Commit `ci: gate Phase 5 level determinism`.

### Task 9: Adversarial review, production readiness, and merge

**Files:**
- Create: `docs/production/PHASE_05_PRODUCTION_READINESS.md`

**Interfaces:**
- Release record captures exact PR head, workflow run, test counts, all-level smoke evidence, and merge/main verification.

- [ ] Review the complete Phase 5 diff for core special-casing, impossible levels, portal recursion, moving-object races, schedule nondeterminism, unsafe food effects, stale active bounds, duplicate geometry, worker/report drift, and rendering dependency leakage.
- [ ] Convert every Critical/Important finding into a regression before fixing it.
- [ ] Run frozen install, strict typecheck, complete tests, all builds, forbidden scan, Phase 1–4 deterministic probes, all-level validation, repeated all-level report equality, worker equivalence, and representative multi-level corpus.
- [ ] Confirm branch is 0 behind `main` and changed files are Phase 5 scoped.
- [ ] Record exact release evidence in `docs/production/PHASE_05_PRODUCTION_READINESS.md`.
- [ ] Run the permanent PR workflow on the documentation-only final head.
- [ ] Squash-merge the exact green head with expected-head protection.
- [ ] Verify the actual merged `main` commit independently with the permanent workflow before declaring Phase 5 production ready.