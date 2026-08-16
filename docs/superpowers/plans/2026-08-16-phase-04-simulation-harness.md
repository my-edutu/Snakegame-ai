# Phase 4 Simulation Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready deterministic headless simulation harness that can run and replay autonomous Snake batches at 1/100/1,000/10,000 scale with bounded memory and optional deterministic worker-thread parallelism.

**Architecture:** Add a new `@snake/simulation` workspace package that orchestrates the authoritative `@snake/engine` and `@snake/ai` packages without reimplementing gameplay. A pure single-run kernel feeds deterministic per-run metrics into bounded aggregation; a coordinator optionally partitions ordered seed corpora across worker threads and canonically reassembles results so worker scheduling cannot alter reports.

**Tech Stack:** TypeScript 5.8, pnpm workspaces, Vitest 3.2, Node.js 22 worker_threads, existing `@snake/shared`, `@snake/engine`, and `@snake/ai` packages.

## Global Constraints
- No renderer, browser, React, PixiJS, audio, or stream dependencies in `@snake/simulation`.
- Same seed corpus + engine config + AI config + harness config must produce byte-identical deterministic report JSON.
- Parallel output must equal single-worker output after canonical reassembly.
- No wall-clock values may influence deterministic simulation results or aggregate balancing output.
- Every run has a validated hard `maxTicks` bound.
- Normal batch mode stores no tick-by-tick history.
- Worker failures and replay mismatches are hard failures, never silently dropped.
- Phase 4 remains baseline-level only; Level Engine integration is deferred to Phase 5.

---

### Task 1: Package scaffold and deterministic seed corpora

**Files:**
- Create: `packages/simulation/package.json`
- Create: `packages/simulation/tsconfig.json`
- Create: `packages/simulation/src/index.ts`
- Create: `packages/simulation/src/seed-corpus.ts`
- Test: `packages/simulation/test/seed-corpus.test.ts`
- Modify: `tsconfig.json`
- Modify: `vitest.config.ts`

**Interfaces:**
- Produces: `generateSeedCorpus(corpusSeed: number, count: number): readonly number[]`
- Produces: `validateExplicitSeeds(seeds: readonly number[]): readonly number[]`

- [ ] Write failing tests for repeatability, uniqueness over representative corpora, unsigned-32-bit normalization, count bounds, and defensive output ownership.
- [ ] Run `pnpm test -- packages/simulation/test/seed-corpus.test.ts` and verify RED.
- [ ] Implement stable xorshift-derived corpus generation and validation without `Math.random()`.
- [ ] Re-run the focused test and verify GREEN.
- [ ] Commit package scaffold and seed corpus implementation.

### Task 2: Single autonomous run kernel

**Files:**
- Create: `packages/simulation/src/types.ts`
- Create: `packages/simulation/src/run.ts`
- Create: `packages/simulation/src/metrics.ts`
- Test: `packages/simulation/test/run.test.ts`
- Test: `packages/simulation/test/metrics.test.ts`

**Interfaces:**
- Produces: `SimulationHarnessConfig`, `SimulationRunResult`, `SimulationTerminalReason`.
- Produces: `runSimulation(seed, engineConfig, aiConfig, harnessConfig): SimulationRunResult`.

- [ ] Write failing tests proving the harness calls the Phase 3 decision engine against authoritative state, classifies `death` vs `simulation-cap`, accumulates score/food/length/occupancy/risk/decision-node/strategy metrics, and remains deterministic.
- [ ] Run focused tests and verify RED.
- [ ] Implement a pure bounded tick loop using `createEngine`, `createObservation`, `decideSurvivalMove`, `queueDirection`, and `step`/authoritative runtime APIs already exported by Phase 1–3.
- [ ] Re-run focused tests and verify GREEN.
- [ ] Commit the single-run kernel.

### Task 3: Replay artifacts and mismatch verification

**Files:**
- Create: `packages/simulation/src/replay.ts`
- Test: `packages/simulation/test/replay.test.ts`

**Interfaces:**
- Produces: `ReplayArtifact` schema v1.
- Produces: `createReplayArtifact(...)` and `verifyReplay(artifact): SimulationRunResult`.

- [ ] Write failing tests for exact terminal-summary replay, tampered expected-summary mismatch, and canonical replay command generation.
- [ ] Run focused tests and verify RED.
- [ ] Implement replay artifact creation and strict comparison.
- [ ] Re-run and verify GREEN.
- [ ] Commit replay support.

### Task 4: Bounded aggregation and deterministic reports

**Files:**
- Create: `packages/simulation/src/aggregate.ts`
- Create: `packages/simulation/src/percentiles.ts`
- Create: `packages/simulation/src/report.ts`
- Test: `packages/simulation/test/aggregate.test.ts`
- Test: `packages/simulation/test/report.test.ts`

**Interfaces:**
- Produces: `SimulationBatchReport`, `aggregateRunResults(results, options)`.
- Produces: deterministic JSON and human-readable summaries.

- [ ] Write failing tests for counts, means, min/max, deterministic nearest-rank p50/p95/p99, death-cause frequencies, strategy shares, transition counts, near-death totals, Hamiltonian usage, top-N failure retention, level-1 funnel placeholder, and stable serialization.
- [ ] Verify RED.
- [ ] Implement bounded counters, scalar sample arrays bounded by batch count, deterministic sorting/tie-breaking, and stable report formatting.
- [ ] Verify GREEN.
- [ ] Commit aggregation/reporting.

### Task 5: Sequential batch orchestration

**Files:**
- Create: `packages/simulation/src/batch.ts`
- Test: `packages/simulation/test/batch.test.ts`

**Interfaces:**
- Produces: `runBatch({ seeds, engineConfig, aiConfig, harnessConfig, retainRuns, topFailures })`.

- [ ] Write failing tests for 1/100-run deterministic equality, canonical result order, no retained rows when disabled, and explicit top-N failure evidence.
- [ ] Verify RED.
- [ ] Implement sequential orchestration and bounded retention.
- [ ] Verify GREEN.
- [ ] Commit batch orchestration.

### Task 6: Deterministic worker-thread parallelism

**Files:**
- Create: `packages/simulation/src/worker.ts`
- Create: `packages/simulation/src/parallel.ts`
- Test: `packages/simulation/test/parallel.test.ts`

**Interfaces:**
- Produces: `runBatchParallel(..., workerCount): Promise<SimulationBatchReport>`.

- [ ] Write failing tests asserting 1-worker vs 2/4-worker report equality, stable seed ordering when rows are retained, invalid worker-count rejection, and propagated worker failure with index range.
- [ ] Verify RED.
- [ ] Implement deterministic contiguous index partitions, serializable worker payloads, canonical index reassembly, and fail-fast worker error propagation.
- [ ] Verify GREEN.
- [ ] Commit parallel execution.

### Task 7: CLI and production command surface

**Files:**
- Create: `packages/simulation/src/cli.ts`
- Modify: `packages/simulation/package.json`
- Modify: `package.json`
- Test: `packages/simulation/test/cli.test.ts`

**Interfaces:**
- Root commands: `pnpm simulate`, `pnpm replay`, `pnpm simulate:smoke`.

- [ ] Write failing parser/validation tests for `--runs`, `--corpus-seed`, `--max-ticks`, `--workers`, `--json`, and replay seed/config inputs.
- [ ] Verify RED.
- [ ] Implement CLI parsing, validation, JSON file output, human summary output, and non-zero failure behavior.
- [ ] Verify GREEN.
- [ ] Commit CLI.

### Task 8: Import boundaries, CI regression corpus, and production benchmarks

**Files:**
- Create: `packages/simulation/test/import-boundary.test.ts`
- Create: `packages/simulation/test/production.test.ts`
- Modify: `.github/workflows/phase-01-ci.yml`
- Modify: `scripts/check-forbidden-apis.mjs`

**Interfaces:**
- CI adds deterministic simulation smoke equality and fast regression corpus.

- [ ] Add tests proving no browser/render packages or globals are imported by simulation modules.
- [ ] Add deterministic 100-run CI corpus with fixed config and structural assertions.
- [ ] Add a 1,000-run production benchmark test/command with bounded retention and no tick history; keep it outside the normal unit suite if runtime is excessive.
- [ ] Add a 10,000-run validated release command path with small `maxTicks` smoke in CI and full long profile available manually/nightly.
- [ ] Extend CI to build `@snake/simulation`, run simulation report twice and `diff`, and compare sequential vs worker output.
- [ ] Run the complete suite and production commands.
- [ ] Commit production gates.

### Task 9: Adversarial review, release record, and merge

**Files:**
- Create: `docs/production/PHASE_04_PRODUCTION_READINESS.md`

- [ ] Review the complete Phase 4 diff for deterministic drift, worker nondeterminism, memory growth, replay incompleteness, config validation gaps, serialization of non-finite values, and Phase 5 scope leakage.
- [ ] Convert every Critical/Important finding into a regression test before fixing it.
- [ ] Run frozen install, strict typecheck, complete tests, all builds, forbidden scan, repeated simulation equality, sequential/parallel equality, 1,000-run benchmark, and 10,000-run command-path validation.
- [ ] Confirm branch is 0 commits behind `main` and scope-only.
- [ ] Record exact release evidence in the production-readiness document.
- [ ] Merge the exact green head with expected-head protection.
- [ ] Verify the actual merged `main` commit independently with the permanent workflow.
