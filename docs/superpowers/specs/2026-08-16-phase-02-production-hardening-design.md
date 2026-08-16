# Phase 2 Production Hardening Design

## Goal

Harden the merged deterministic AI pathfinding layer so it is safe to consume as a production boundary before Phase 3 survival reasoning begins.

## Scope

Phase 2 remains a **static-board pathfinding layer**. It does not simulate future snake-body motion beyond the immediate-move legality rule already shared with the engine. Dynamic future-state reasoning, space preservation, trap prediction, and multi-tick body simulation belong to Phase 3.

## Review Findings

1. The current BFS/A* implementations are deterministic, bounded by board geometry, locally stateful, and free of browser/wall-clock/randomness dependencies.
2. `rankCandidateMoves()` computes target reachability from a hypothetical next head while still using the current body geometry. That is useful only as static-board telemetry; it must not be presented as future survivability.
3. Search endpoint validation is incomplete. Out-of-board endpoints are rejected, but a target blocked by body/obstacle/hazard can currently degrade to `unreachable` rather than a distinct invalid/blocked endpoint result.
4. `AiObservation` is defensively cloned at creation time, but the public contract does not currently prove deep mutation isolation across nested arrays/objects.
5. CI has correctness, deterministic-output, frozen-install, build, forbidden-API, and 100x100 search coverage, but lacks adversarial tests for blocked endpoints, pathological dense boards, route-coordinate isolation, and static candidate-distance semantics.

## Chosen Approach

Use **contract hardening without Phase 3 scope creep**.

Rejected alternatives:

- Documentation-only hardening: insufficient because ambiguous endpoint behavior and unproven mutation isolation remain runtime risks.
- Pull dynamic-body simulation into Phase 2: rejected because it duplicates Phase 3 responsibilities and would blur package boundaries.

## API Semantics

### Search outcomes

Extend `SearchOutcome` to:

- `found`
- `unreachable`
- `invalid-start`
- `invalid-target`
- `blocked-target`

Rules:

- Start outside the board -> `invalid-start`.
- Target outside the board -> `invalid-target`.
- Start may be the current snake head even though the body set includes it.
- A target occupied by body/obstacle/hazard -> `blocked-target`, unless it exactly matches `GraphOptions.traversableTarget`.
- A valid traversable target with no route -> `unreachable`.
- `start === target` returns `found` only when the start is inside the board.

BFS and A* must expose identical endpoint semantics.

### Candidate telemetry

Rename `targetDistance` to `staticTargetDistance` in `CandidateMove`.

This value means: shortest distance from the candidate next cell to the target **using the current observation as static blocked geometry**. It does not mean the move is survivable after future body movement.

This naming prevents Phase 3 consumers and stream telemetry from accidentally treating a Phase 2 heuristic as a future-state guarantee.

### Observation isolation

`createObservation()` must produce a detached deep copy of every nested mutable value sourced from `GameState`:

- board dimensions
- head/tail/body coordinates
- food records and positions
- obstacle records and positions
- hazard records and positions

Tests must mutate observation-owned nested values through deliberate casts and prove the original engine state is unchanged. Tests must also mutate the original engine state fixture after observation creation and prove the observation does not change.

### Result isolation

All returned route coordinates and planner target coordinates must be owned by the result and not aliases to caller input vectors or observation vectors.

## Performance Hardening

Retain the precomputed blocked-cell set per search. Add a dense-board regression fixture at 100x100 that verifies:

- search terminates;
- explored nodes never exceed board cell count;
- frontier peak never exceeds board cell count;
- no route coordinates lie outside the board;
- repeated calls produce structurally identical results.

No wall-clock threshold becomes a correctness gate because hosted-runner timing is noisy; structural bounds are the production invariant.

## CI Hardening

The permanent workflow continues to require:

1. `pnpm install --frozen-lockfile`
2. strict typecheck
3. complete Vitest suite
4. package builds
5. forbidden nondeterministic/browser API scan
6. repeated deterministic engine headless output
7. repeated deterministic AI headless output

The hardening PR must pass the full workflow before merge, and the squash-merged `main` commit must pass again independently.

## Files Expected to Change

- `packages/ai/src/path.ts`
- `packages/ai/src/bfs.ts`
- `packages/ai/src/astar.ts`
- `packages/ai/src/candidates.ts`
- `packages/ai/test/bfs.test.ts`
- `packages/ai/test/astar.test.ts`
- `packages/ai/test/candidates.test.ts`
- `packages/ai/test/observation.test.ts`
- `packages/ai/test/planners.test.ts`
- `packages/ai/test/performance.test.ts`
- `packages/ai/src/headless.ts` if output field names change
- production-readiness documentation

## Non-Goals

This hardening does not add:

- flood fill;
- trap detection;
- future body simulation;
- tail trajectory prediction across multiple ticks;
- Hamiltonian strategy;
- risk scoring;
- strategy switching.

Those remain Phase 3+ concerns.

## Acceptance Criteria

Phase 2 is production-ready after hardening only when:

- BFS and A* have identical endpoint validation semantics;
- blocked targets are distinguishable from genuinely unreachable valid targets;
- candidate distance is explicitly static-board telemetry;
- observation and route aliasing regressions are covered;
- dense 100x100 structural bounds are covered;
- deterministic output remains byte-identical;
- frozen dependencies, typecheck, tests, builds, and forbidden-API checks all pass on the PR head;
- the squash-merged `main` commit passes the same workflow again.
