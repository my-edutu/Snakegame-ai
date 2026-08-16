# Phase 1 Production Readiness Gate

Phase 1 may be considered production-ready only when every gate below is green on the exact commit proposed for merge.

## Required gates

- Workspace installs successfully with pnpm 10.15.0 on Node.js 22.
- `pnpm typecheck` passes under strict TypeScript.
- `pnpm test` passes all unit and deterministic scenario tests.
- `pnpm build` produces both workspace packages without errors.
- `pnpm check:forbidden` confirms the deterministic domain has no wall-clock, browser-storage, rendering-loop, or unseeded-randomness dependencies.
- Two independent `pnpm headless` executions from the same seed/config produce byte-identical output.
- `pnpm-lock.yaml` is committed and CI installs with `--frozen-lockfile` before merge.
- The branch is not behind `main` at merge time.
- The final GitHub Actions workflow run for the merge candidate concludes successfully.

## Core behavior coverage

The Phase 1 test suite must cover:

- movement in all four directions
- illegal 180-degree reversal prevention
- growth after food consumption
- wall collision
- self collision
- moving into a tail cell that vacates on the same tick
- food never spawning inside the snake
- full-board food-spawn behavior
- board occupancy calculation
- pause/resume behavior
- restart behavior
- seeded whole-engine determinism
- RNG state restoration
- snapshot serialize/restore continuation parity

## Scope guard

Phase 1 remains a browser-independent domain foundation. Production readiness does not require React, PixiJS, AI pathfinding, IndexedDB, audio, OBS integration, or livestream UI. Those belong to later phases.
