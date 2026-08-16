# Phase 4 — Production Readiness Record

Status: **VERIFIED RELEASE CANDIDATE**

## Release candidate

- Phase: Headless Simulation Harness
- Pull request: #5
- Feature head: `8385a06172bfbfa65ad3385a76e1c948d59d7f27`
- Base: `main` at `8149a70efbbad89e3639475d907d03e5a3026faf`
- Pre-release branch status: 63 commits ahead, 0 behind `main`
- Verified PR workflow run: `31948656257`

## Implemented production capabilities

- New framework-independent `@snake/simulation` workspace package.
- Deterministic generated and explicit seed corpora.
- Autonomous single-run kernel delegating movement/state to `@snake/engine` and decisions to Phase 3 `@snake/ai`.
- Hard per-run tick caps with distinct death, board-filled, no-move, and simulation-cap classifications.
- Per-run survival, score, food, occupancy, risk, decision-node, near-death, strategy, transition, Hamiltonian, and terminal-context metrics.
- Deterministic nearest-rank p50/p95/p99 summaries.
- Death-cause frequencies and deterministic clustered failure-pattern reporting.
- Per-strategy outcome/effectiveness reporting.
- Bounded top-failure retention and complete replay artifacts containing seed, exact engine/AI/harness config, expected terminal result, artifact filename, and canonical replay command.
- Strict replay mismatch detection.
- Same-seed AI-configuration comparison API.
- Deterministic sequential batch execution.
- Real Node worker-thread parallel execution with deterministic contiguous partitioning and canonical reassembly.
- Explicit worker error propagation with affected deterministic range context.
- CLI support for simulation, replay, JSON output, retained rows, worker counts, AI budgets, batch sizes, and hard input validation.
- Human-readable and stable JSON reports.
- Import-boundary tests preventing browser/render/audio dependencies from entering the simulation package.
- Commands for 1/100/1,000/10,000-run workflows.

## Determinism and memory policy

The report contract excludes wall-clock data from deterministic balancing output. Normal batch runs do not retain tick histories or complete per-run rows unless explicitly requested. Failure evidence is bounded by `topFailures`; aggregate failure-pattern clusters are capped and deterministically ranked. Worker completion order is never represented in output.

## Adversarial review findings fixed before release

- Strict TypeScript `exactOptionalPropertyTypes` and index-signature access violations were corrected without weakening compiler settings.
- Top failing seeds originally lacked enough configuration to reproduce exactly; reports now attach full replay artifacts.
- Original aggregate output counted causes but did not identify recurring terminal-state patterns; terminal decision context and clustered failure patterns were added.
- Strategy usage lacked outcome-level comparison; strategy effectiveness was added.
- AI configuration comparisons lacked a first-class same-seed API; deterministic comparison support was added.
- Worker exceptions were handled but not release-gated; a compiled deterministic worker-failure propagation probe is now part of permanent CI.

## Verification evidence

The exact feature head `8385a06172bfbfa65ad3385a76e1c948d59d7f27` passed GitHub Actions workflow run `31948656257` with conclusion `success`.

Verified gates:

- frozen pnpm dependency installation across 5 workspace projects;
- strict TypeScript typecheck for shared, engine, AI, and simulation packages;
- **128/128 tests across 38 test files**;
- builds for all four executable/library packages;
- deterministic-core forbidden API scan;
- repeated engine headless byte equality;
- repeated Phase 2 AI pathfinding byte equality;
- repeated Phase 3 survival-reasoning byte equality;
- repeated Phase 4 deterministic simulation-report byte equality;
- real 4-worker vs sequential report equality;
- compiled worker-failure propagation verification (`worker failure propagation: PASS`);
- deterministic 100-seed regression corpus;
- 1,000-run bounded batch production gate, completed successfully on the hosted runner;
- 10,000-run command-path gate, completed successfully on the hosted runner.

The final PR run completed the 1,000-run gate in approximately 46 seconds and the 10,000-run command-path gate in approximately 10 seconds on the GitHub-hosted Ubuntu runner. Runtime timing is operational evidence only and is not part of deterministic report semantics.

## Phase boundary

Phase 4 deliberately remains baseline-level only. The report schema contains a level funnel so Phase 5 can populate multi-level progression without changing the simulation architecture. Phase 4 does not implement the Level Engine, controlled failure injection, rendering, operator UI, persistence UI, or livestream features.

## Final production transition

After this documentation-only head passes the same permanent PR workflow, PR #5 may be squash-merged with expected-head protection. The actual merge commit on `main` must independently pass the permanent workflow before this record is upgraded to **VERIFIED PRODUCTION READY**.
