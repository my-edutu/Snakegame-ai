# Phase 13 — Persistence and Recovery

## Primary agents
- Persistence & Recovery Agent
- Architecture Agent
- Release / Stream Reliability Agent

## Objective
Ensure records, configuration, and recoverable run state survive reloads, browser crashes, and long-running sessions.

## Deliverables
- persistence repository interfaces
- IndexedDB adapter
- schema/version migrations
- autosave checkpoints
- active-run restoration
- all-time record durability
- corrupted-state fallback
- config persistence/export/import
- future Supabase adapter boundary

## Persistence classes
### Durable records
All-time records, total games, total deaths, total food, total playtime, best occupancy, highest level, longest run, high score, fastest completions.

### Operator settings
AI settings, stream settings, audio/visual preferences, presets, branding, failure configuration.

### Recovery checkpoint
Seed, RNG state, level runtime, snake body, food/hazards, tick, score, timers, active configuration versions, run stats, lifecycle state.

## Tasks
1. Define repository interfaces independent of IndexedDB.
2. Add versioned persisted schemas validated with Zod.
3. Implement atomic-ish checkpoint writes using transaction boundaries.
4. Autosave on meaningful intervals/events without blocking the game loop.
5. Restore only validated checkpoints.
6. Quarantine/ignore corrupt or incompatible state and start safely.
7. Preserve all-time records even if an active checkpoint is unusable.
8. Add migrations for schema evolution.
9. Add config import/export with redaction/public projection rules.
10. Document future Supabase synchronization strategy without making v1 dependent on the network.

## Tests
- reload restore parity
- migration from older schema fixture
- corrupt checkpoint fallback
- records survive active-run corruption
- async persistence failure does not freeze simulation
- repeated saves do not create unbounded storage growth

## Exit criteria
A stream can reload or recover from common browser failures without losing durable records, and validated checkpoints resume the run deterministically where supported.
