# Phase 01 Core Deterministic Snake Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a strict-TypeScript, browser-independent, deterministic Snake engine with seeded replay, snapshots, lifecycle commands, typed events, deterministic food placement, and a verified headless runtime.

**Architecture:** Establish the workspace and public contracts first, then implement independent deterministic primitives, snake rules, and lifecycle/runtime behavior against those contracts. Integrate food, snapshots, and the headless harness only after the core contracts stabilize. Authoritative simulation state remains framework-independent and serializable.

**Tech Stack:** pnpm workspaces, TypeScript 5.x strict mode, Vitest, Node.js ESM-compatible packages.

## Global Constraints

- Package manager: pnpm workspaces.
- Engine packages must not import React, Next.js, PixiJS, DOM APIs, IndexedDB, Web Audio, OBS APIs, or browser-only globals.
- `Math.random()` is forbidden in authoritative simulation code.
- Simulation truth advances only through explicit fixed ticks; wall-clock time does not mutate gameplay state.
- Public state and snapshots are serializable immutable values.
- TDD is mandatory for behavior: write a failing test, verify RED, implement minimally, verify GREEN, then refactor.
- Same seed + config + direction sequence must produce identical state and event sequences.
- Phase 1 does not implement AI pathfinding, level content beyond the baseline runtime config, rendering, persistence, audio, or streaming UI.

---

## File Map

### Root
- `package.json` — workspace scripts and development dependencies.
- `pnpm-workspace.yaml` — package discovery.
- `tsconfig.base.json` — shared strict compiler configuration.
- `vitest.config.ts` — workspace test discovery.
- `.gitignore` — Node/build artifacts.

### `packages/shared`
- `package.json`, `tsconfig.json` — package metadata/build config.
- `src/geometry.ts` — `Vec2`, coordinate helpers.
- `src/directions.ts` — `Direction`, deltas, opposite-direction rules.
- `src/ids.ts` — lightweight branded/basic ID aliases.
- `src/result.ts` — small result utility used by engine validation.
- `src/index.ts` — public exports.

### `packages/engine`
- `src/config.ts` — `EngineConfig`, validation, baseline config helpers.
- `src/state.ts` — canonical `GameState` and subordinate state types.
- `src/commands.ts` — Phase 1 command union.
- `src/events.ts` — typed event union.
- `src/rng.ts` — deterministic seeded PRNG and serialization.
- `src/occupancy.ts` — coordinate encoding and free-cell enumeration.
- `src/snake.ts` — legal-direction, movement, growth, collision semantics.
- `src/food.ts` — deterministic spawn/consume behavior.
- `src/lifecycle.ts` — command-driven lifecycle transitions.
- `src/reducer.ts` — pure tick transition.
- `src/runtime.ts` — runtime API around reducer/state.
- `src/snapshot.ts` — snapshot serialization/restore.
- `src/headless.ts` — Node-compatible headless demonstration.
- `src/index.ts` — public exports.
- `test/*.test.ts` — behavior/scenario tests.

---

### Task 1: Workspace Scaffold and Public Contracts

**Files:** Create all root workspace files, `packages/shared/*`, and engine contract files `config.ts`, `state.ts`, `commands.ts`, `events.ts`, package manifests, tsconfigs, and index exports.

**Interfaces:**
- Produces `Vec2`, `Direction`, `EngineConfig`, `GameState`, `EngineCommand`, `EngineEvent`, `StepResult`, and package exports used by all later tasks.

- [ ] **Step 1: Add root workspace configuration** with scripts `build`, `typecheck`, and `test` using pnpm recursive execution where appropriate.
- [ ] **Step 2: Add `@snake/shared` package** exporting:

```ts
export type Vec2 = Readonly<{ x: number; y: number }>;
export type Direction = 'up' | 'down' | 'left' | 'right';
export const DIRECTION_DELTAS: Readonly<Record<Direction, Vec2>> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
export function isOpposite(a: Direction, b: Direction): boolean;
export function addVec(a: Vec2, b: Vec2): Vec2;
export function equalVec(a: Vec2, b: Vec2): boolean;
```

- [ ] **Step 3: Add engine public types** matching the approved design, with `schemaVersion: 1`, head-first snake body, neutral Phase 1 AI/risk state, empty obstacles/hazards, and lifecycle union including `boot`, `new-game`, `level-start`, `playing`, `death`, `run-summary`, `countdown`, `paused`, plus reserved canonical `intro`/`level-complete`.
- [ ] **Step 4: Add Phase 1 commands**: `StartNewGame`, `Pause`, `Resume`, `RestartLevel`.
- [ ] **Step 5: Add Phase 1 events**: `RunStarted`, `LevelStarted`, `SnakeMoved`, `FoodConsumed`, `FoodSpawned`, `SnakeDied`, `RunEnded`, `LifecycleChanged`.
- [ ] **Step 6: Run `pnpm install`, `pnpm typecheck`, and `pnpm build`** and fix configuration-only issues until clean.
- [ ] **Step 7: Commit** with message `chore: scaffold deterministic engine workspace`.

### Task 2: Deterministic RNG and Occupancy Primitives

**Files:** Create `packages/engine/src/rng.ts`, `occupancy.ts`, `test/rng.test.ts`, `test/occupancy.test.ts`.

**Interfaces:**
- Produces `createRng(seed)`, `restoreRng(state)`, `SerializedRngState`, `encodeCell`, `isInsideBoard`, `enumerateFreeCells`.

- [ ] **Step 1: Write failing RNG tests** asserting identical sequences from identical seeds, differing sequences from differing seeds, range correctness, and serialize/restore continuation parity.
- [ ] **Step 2: Run RNG tests and verify RED** because the module/functions do not yet exist.
- [ ] **Step 3: Implement a self-contained 32-bit PRNG** exposing `nextUint32()`, `nextFloat()`, `nextInt(maxExclusive)`, and `serialize()`; reject `maxExclusive <= 0`.
- [ ] **Step 4: Run RNG tests and verify GREEN**.
- [ ] **Step 5: Write failing occupancy tests** for row-major encoding, in-bounds checks, deterministic free-cell enumeration, and exclusion of occupied cells.
- [ ] **Step 6: Run occupancy tests and verify RED**.
- [ ] **Step 7: Implement occupancy helpers** using `key = y * width + x` and deterministic row-major enumeration.
- [ ] **Step 8: Run occupancy tests and full engine tests**.
- [ ] **Step 9: Commit** with message `feat: add deterministic rng and board occupancy`.

### Task 3: Snake Rules, Growth, and Collision Semantics

**Files:** Create `packages/engine/src/snake.ts`, `test/snake.test.ts`, `test/collision.test.ts`.

**Interfaces:**
- Consumes `Vec2`, `Direction`, `EngineConfig` board dimensions.
- Produces `resolveDirection`, `computeNextHead`, `moveSnake`, `detectCollision`.

- [ ] **Step 1: Write failing direction/movement tests** for all four directions and 180-degree reversal prevention when body length > 1.
- [ ] **Step 2: Verify RED**.
- [ ] **Step 3: Implement minimal legal-direction and next-head helpers**.
- [ ] **Step 4: Verify GREEN**.
- [ ] **Step 5: Write failing growth tests** proving normal ticks remove the tail, `pendingGrowth > 0` preserves the tail and decrements growth, and body ordering stays head-first.
- [ ] **Step 6: Verify RED, implement movement, verify GREEN**.
- [ ] **Step 7: Write failing collision tests** for wall collision, body collision, and the critical moving-tail case where entering the current tail is legal only when that tail vacates this tick.
- [ ] **Step 8: Verify RED, implement collision semantics, verify GREEN**.
- [ ] **Step 9: Run the whole suite and commit** with message `feat: implement snake movement growth and collisions`.

### Task 4: Lifecycle Commands and Runtime Shell

**Files:** Create `packages/engine/src/lifecycle.ts`, `runtime.ts`, `test/lifecycle.test.ts`, `test/runtime.test.ts`.

**Interfaces:**
- Produces lifecycle transition helper and runtime methods:

```ts
interface EngineRuntime {
  getState(): GameState;
  dispatch(command: EngineCommand): readonly EngineEvent[];
  step(requestedDirection?: Direction): StepResult;
  snapshot(): EngineSnapshot;
}
```

- [ ] **Step 1: Write failing lifecycle tests** for `boot -> new-game -> level-start -> playing`, pause/resume, restart, death/run-summary/countdown transitions, and lifecycle event emission.
- [ ] **Step 2: Verify RED**.
- [ ] **Step 3: Implement deterministic lifecycle transition logic** without timers or browser APIs.
- [ ] **Step 4: Verify GREEN**.
- [ ] **Step 5: Write failing runtime-shell tests** asserting paused state does not move the snake and `getState()` returns the current authoritative snapshot.
- [ ] **Step 6: Verify RED, implement runtime shell, verify GREEN**.
- [ ] **Step 7: Commit** with message `feat: add lifecycle commands and engine runtime shell`.

### Task 5: Food, Tick Reducer, and Deterministic Integration

**Files:** Create `packages/engine/src/food.ts`, `reducer.ts`, `test/food.test.ts`, `test/determinism.test.ts` and extend runtime tests.

**Interfaces:**
- Consumes RNG, occupancy, snake rules, lifecycle.
- Produces deterministic one-tick transition and replacement-food behavior.

- [ ] **Step 1: Write failing food tests** proving food never spawns inside the snake, uses row-major free-cell selection plus seeded RNG, and returns `board-filled` when no free cell exists.
- [ ] **Step 2: Verify RED, implement deterministic spawn helper, verify GREEN**.
- [ ] **Step 3: Write failing reducer tests** for tick ordering: direction resolution, next-head calculation, collision, movement, consumption, growth/score counters, replacement spawn, occupancy/run updates, events, tick increment, RNG-state persistence.
- [ ] **Step 4: Verify RED, implement the pure reducer, verify GREEN**.
- [ ] **Step 5: Write failing determinism scenario**: two engines with identical config/seed/input sequence must deep-equal state and events every step; differing seeds must change at least one food-selection outcome in a scenario with multiple free cells.
- [ ] **Step 6: Verify RED if integration is incomplete, wire reducer into runtime, then verify GREEN**.
- [ ] **Step 7: Commit** with message `feat: integrate deterministic food and simulation ticks`.

### Task 6: Snapshots, Restore Parity, and Headless Harness

**Files:** Create `packages/engine/src/snapshot.ts`, `headless.ts`, `test/snapshot.test.ts`; update package scripts/exports as needed.

**Interfaces:**
- Produces `EngineSnapshot`, `serializeSnapshot`, `parseSnapshot`, `restoreEngine`.

- [ ] **Step 1: Write failing snapshot round-trip test** asserting JSON serialization preserves schema/config/state/RNG payload.
- [ ] **Step 2: Verify RED, implement snapshot codec, verify GREEN**.
- [ ] **Step 3: Write failing continuation parity test**: run A for N ticks, snapshot, restore B, apply the same future direction sequence, then deep-equal state/events after every subsequent tick.
- [ ] **Step 4: Verify RED, implement `restoreEngine`, verify GREEN**.
- [ ] **Step 5: Add a Node-compatible headless harness** that creates a seeded engine, runs a deterministic safe/basic input sequence, and prints final tick, seed, score, snake length, and lifecycle.
- [ ] **Step 6: Run harness directly through the package script** and confirm no browser globals are required.
- [ ] **Step 7: Commit** with message `feat: add deterministic snapshots and headless harness`.

### Task 7: Adversarial QA and Phase 1 Gate

**Files:** Add or extend tests only where gaps are discovered; update documentation only for confirmed behavior.

**Interfaces:** Reviews the entire branch against the approved design and Phase 1 acceptance criteria.

- [ ] **Step 1: Review source for forbidden nondeterminism** including `Math.random`, `Date.now`, timers, DOM globals, environment-dependent iteration, or hidden async mutation.
- [ ] **Step 2: Review moving-tail collision semantics** and add a regression test if any ambiguity remains.
- [ ] **Step 3: Review mutation boundaries** ensuring callers cannot mutate authoritative engine internals through returned arrays/objects.
- [ ] **Step 4: Run `pnpm typecheck`**; expected: exit 0.
- [ ] **Step 5: Run `pnpm test`**; expected: all tests pass with no skipped Phase 1 requirements.
- [ ] **Step 6: Run `pnpm build`**; expected: exit 0.
- [ ] **Step 7: Run the headless harness twice with the same seed**; expected: identical output.
- [ ] **Step 8: Commit any QA regressions/fixes** with message `test: harden Phase 1 deterministic engine`.

## Parallel Execution Notes

The shared contracts in Task 1 are a hard serial gate. After Task 1 lands, Tasks 2, 3, and the lifecycle portion of Task 4 are independent by file ownership and may be dispatched concurrently using the Superpowers parallel-agent skill. Runtime integration, reducer, food, snapshots, and the headless harness remain integration tasks and must run after those streams converge. Any agent must stay within its assigned files unless a contract defect is escalated to the coordinator.

## Completion Gate

Phase 1 is complete only when the branch demonstrates all approved acceptance criteria and a clean fresh install can run `pnpm typecheck`, `pnpm test`, `pnpm build`, plus the headless harness without browser dependencies.