# Phase 4 — Headless Simulation Harness Design

## Status
Design selected for implementation under the standing instruction to choose the strongest production option without additional clarification.

## Goal
Turn the deterministic engine + survival AI into a reproducible experiment platform capable of running 1, 100, 1,000, and 10,000-run batches without rendering, while retaining exact replay evidence for failures and statistically useful aggregate metrics.

## Approaches considered

### A. In-process sequential runner only
Simplest and easiest to reason about, but wastes multi-core capacity and makes 10,000-run production batches unnecessarily slow.

### B. Worker-thread batch runner with deterministic partitioning — selected
A pure simulation kernel runs one seed at a time. A coordinator partitions an ordered seed corpus into deterministic chunks and may execute chunks with Node worker threads. Results are reassembled by original seed index before aggregation, so worker scheduling cannot alter output. A single-worker mode remains the reference oracle.

### C. Distributed queue/service
Useful much later for very large campaigns, but adds infrastructure, persistence, and operational complexity before the product needs it.

## Architecture

### `@snake/simulation` package
A new framework-independent Node-capable package. It depends on `@snake/engine`, `@snake/ai`, and `@snake/shared`, but never on renderer, browser, React, PixiJS, audio, or stream packages.

Modules:
- `seed-corpus.ts` — deterministic seed generation and explicit seed-set validation.
- `run.ts` — executes one autonomous run from seed/config until a bounded terminal condition.
- `batch.ts` — deterministic sequential batch orchestration.
- `worker.ts` / `parallel.ts` — optional worker-thread execution with deterministic partition/reassembly.
- `metrics.ts` — bounded per-run metric extraction.
- `aggregate.ts` — streaming/online aggregate statistics and fixed-size histograms/counters.
- `percentiles.ts` — deterministic percentile calculation over explicitly retained bounded samples where needed.
- `replay.ts` — replay artifact schema and exact CLI reproduction command.
- `report.ts` — JSON report plus concise human-readable summary.
- `cli.ts` — `simulate` and `replay` command surface.

## Run model
Each simulation starts from a validated engine config and seed, creates an engine observation every tick, calls Phase 3 `decideSurvivalMove`, steps the authoritative engine with the chosen direction, and updates metrics. The harness never reimplements movement/collision rules.

Until the Level Engine exists, Phase 4 runs the baseline level only and reports `levelReached = 1`. Per-level funnel fields are included in the report schema now so Phase 5 can populate multiple levels without redesigning analytics.

Every run has hard bounds:
- maximum ticks;
- maximum decision-node budget inherited from Phase 3 config;
- optional early termination when the engine reaches death or board-filled state.

A run ending because of the harness tick cap is classified `simulation-cap`, not as an engine death.

## Determinism
Determinism is a release invariant.

For the same seed corpus, engine config, AI config, and harness config:
- single-worker results must be byte-identical across repeated executions;
- parallel-worker results must equal single-worker results after canonical reassembly;
- aggregate JSON uses stable field order and deterministic numeric rules;
- worker completion order is never observable in final reports.

Wall-clock duration may be emitted only in a separate operational envelope and must never participate in deterministic report equality, scoring, or balancing decisions.

## Seed corpora
Support explicit seeds and deterministic generated corpora. Generated corpora use a stable integer derivation algorithm from a corpus seed and count. The report records the corpus seed and/or explicit ordered seed list hash plus count.

Named regression corpora live under `packages/simulation/fixtures/` and include seeds for previously discovered failures.

## Metrics
Per run:
- seed;
- terminal reason/death cause;
- ticks survived;
- maximum length;
- maximum occupancy;
- score;
- food consumed;
- strategy tick counts and transitions;
- average and peak risk;
- total/average/peak decision nodes evaluated;
- near-death count (`safeMoves <= 1` while alive);
- Hamiltonian entries and ticks;
- level reached/completion fields reserved for Phase 5;
- replay artifact when the run is classified interesting/failing.

Batch aggregates:
- run count;
- success/death/cap counts;
- mean/min/max and deterministic percentiles for core metrics;
- death-cause frequencies;
- strategy time share;
- strategy transition frequencies;
- near-death totals/rate;
- Hamiltonian usage/outcomes;
- level completion funnel schema;
- top reproducible failure seeds by deterministic ranking.

## Memory policy
10,000-run batches must not accumulate unbounded event or decision logs. The harness keeps only:
- bounded counters/online sums;
- bounded histograms or explicitly required scalar samples;
- a configurable fixed top-N failure/replay set;
- optional full per-run rows only when explicitly requested and bounded by batch count.

No tick-by-tick history is retained in normal batch mode.

## Replay artifact
A replay artifact contains:
- schema version;
- seed;
- engine config;
- AI config;
- harness config relevant to execution;
- expected terminal summary/checkpoints;
- classification/reason;
- exact canonical replay command.

Replay executes the seed again and verifies the expected deterministic terminal summary.

## Parallel execution
Node worker threads are optional optimization, not a semantic dependency. The coordinator chooses worker count from explicit CLI/config input; it never uses timing to change work allocation. Seeds are partitioned by deterministic index ranges. Workers return pure serializable result chunks. Coordinator sorts/reassembles by original index and then aggregates.

Worker crashes produce a batch failure with the affected deterministic seed range; they are never silently dropped or retried with changed semantics.

## CLI
Examples:

```bash
pnpm simulate --runs 100 --corpus-seed 845732916 --max-ticks 5000 --workers 1
pnpm simulate --runs 10000 --corpus-seed 845732916 --max-ticks 5000 --workers 4 --json report.json
pnpm replay --seed 123456 --max-ticks 5000
```

The CLI validates all integer/range inputs and exits non-zero on malformed config, worker failure, replay mismatch, or impossible run setup.

## Error handling
- Invalid config: fail before starting batch.
- Individual deterministic run terminal death: normal data, not process error.
- Harness cap: normal `simulation-cap` terminal classification.
- Worker/process exception: batch error with affected seed/index range.
- Replay mismatch: hard verification failure.
- Serialization failure: hard failure; no partial report presented as complete.

## Testing
TDD coverage will include:
- deterministic seed corpus generation;
- one-run deterministic replay;
- autonomous engine/AI integration;
- cap/death/board-filled terminal classification;
- metric accuracy on controlled fixtures;
- aggregate math and percentile edge cases;
- bounded top-N failure retention;
- stable JSON serialization;
- single-worker repeated byte equality;
- 1-worker vs N-worker semantic equality;
- worker failure propagation;
- malformed CLI/config rejection;
- replay mismatch detection;
- import-boundary test proving no renderer/browser dependency;
- CI fast regression corpus.

## Production gates
- existing Phase 1–3 tests remain green;
- new simulation tests green;
- strict TypeScript build green;
- deterministic forbidden-API rules preserved for engine/AI;
- simulation deterministic report equality proven;
- parallel equality proven on CI;
- selected fast seed corpus run on every merge;
- 1,000-run production benchmark completes without unbounded memory growth;
- 10,000-run command path exists and is validated with a release/nightly profile rather than making every PR wait for a full long batch.

## Phase boundary
Phase 4 does not implement 20 levels, failure injection, rendering, persistence UI, or balancing changes. It creates the quantitative harness that Phase 5 and later phases will use to measure those systems.
