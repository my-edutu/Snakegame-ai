# Phase 5 — Production Readiness Record

Status: **VERIFIED RELEASE CANDIDATE**

## Release candidate
- Phase: Level System and First 20 Levels
- Pull request: #6
- Feature head: `1d4ad4c340c82dac105a3bff5072e676ee588f9a`
- Base: verified `main` after Phase 4
- Verified PR workflow run: `31954735802`

## Production capabilities
- Dedicated `@snake/levels` package with source-typed package exports.
- Versioned Zod schema plus semantic validation for board, spawn, goals, portals, moving schedules, AI bounds, and theme references.
- Deterministic geometry compilation and level registry.
- Generic engine support for wrap, static obstacles, hazards, one-hop portals, active/shrinking bounds, and typed foods.
- Pure deterministic moving obstacle/hazard, shrinking-boundary, chaos-grid, and food-spawn schedules.
- Goal aggregation and level progression evaluation.
- Twenty declarative levels from Genesis through Singularity.
- AI observation/pathfinding support for wrap, portals, active bounds, obstacles, and hazards with backward-compatible defaults.
- Level-aware headless simulation and batch reports.
- No level-specific movement branches in the core engine.

## Adversarial findings fixed
- Initial wrap test did not cross the board edge; fixture corrected rather than changing engine semantics.
- `@snake/levels` originally pointed type resolution at emitted declarations; changed to source type exports so recursive `--noEmit` typecheck works.
- New AI topology fields initially broke lightweight legacy observation callers; fields were made additive/optional with legacy defaults (`wrap=false`, `portals=[]`).
- Phase 5 all-level release test initially assumed an outdated result wrapper shape; test corrected to the actual public API.
- All-level determinism corpus exceeded Vitest's default 5-second test timeout; production workload was preserved and given an explicit bounded 30-second timeout.

## Verification evidence
The exact feature head `1d4ad4c340c82dac105a3bff5072e676ee588f9a` passed GitHub Actions workflow run `31954735802` through all substantive gates:
- frozen pnpm dependency installation across 6 workspace projects;
- strict TypeScript typecheck;
- **146/146 tests** including all-20-level deterministic corpus and all-level batch;
- package builds;
- deterministic-core forbidden API scan;
- repeated engine headless byte equality;
- repeated AI pathfinding byte equality;
- repeated survival-reasoning byte equality;
- repeated deterministic simulation-report equality;
- worker-thread equivalence;
- worker-failure propagation;
- 1,000-run bounded batch;
- 10,000-run command-path verification.

## Exit criteria coverage
- All 20 levels validate: verified by registry/schema tests.
- All 20 run headlessly: verified by the all-level corpus.
- Strategic definitions differ: each roster entry has distinct metadata/mechanic configuration and schema validation.
- Deterministic outcomes under a seed: every level is executed twice per seed in the production corpus and compared deeply.
- Progression without special-case core movement code: level mechanics compile into generic engine environment primitives.

## Promotion rule
PR #6 may be squash-merged only with expected-head protection against `1d4ad4c340c82dac105a3bff5072e676ee588f9a`. The resulting `main` commit must independently pass the permanent workflow before Phase 6 branches from it.
