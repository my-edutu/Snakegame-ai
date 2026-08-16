# Phase 7 — Progression, Records, Run Lifecycle Design

## Goal
Complete the autonomous run lifecycle so the game can advance levels, classify endings, update persistent records/statistics, emit meaningful spectator events, produce summaries, count down, and begin another run indefinitely without UI-specific logic.

## Architecture
Phase 7 stays inside `@snake/simulation` rather than creating a new workspace package. Existing Phase 5 goal evaluation remains authoritative; Phase 7 adds small pure modules for records, milestones, summaries, persistence, and lifecycle state transitions, plus a thin session orchestrator that consumes existing level simulation results.

The lifecycle is deterministic and tick-driven. It never reads wall-clock time, browser APIs, rendering state, or random values. Restart and celebration delays are represented as integer ticks. UI phases may render these states later but cannot own transition rules.

## Components

### Records and cumulative statistics
`records.ts` owns immutable all-time records and cumulative counters. It tracks total games, deaths, food, play ticks, highest level, longest level streak, max length, max occupancy, longest survival, high score, and fastest level completion. Maxima update only on strict improvement; fastest completion updates only on a strictly smaller positive completed tick count.

### Death classification and run summary
`run-summary.ts` maps internal engine death causes to spectator-friendly labels while preserving the original cause. It builds a structured `RunSummary`, captures level/run metrics, milestone/near-death evidence, and emits explicit `newRecords` markers derived from the records update result.

### Milestone and near-death events
`milestones.ts` emits deterministic milestone events from length, occupancy, food, score, survival, level, and streak thresholds. Event keys are deduplicated for the lifetime of a run and a minimum tick gap prevents spam. `near-death.ts` converts AI decision evidence (`safeMoves <= 1`, high/critical risk) into rate-limited structured events without changing the selected move.

### Lifecycle reducer and commands
`lifecycle.ts` implements the pure state machine. States are `playing`, `celebrating`, `awaiting-operator`, `paused`, `summary`, and `restart-countdown`. Completion policies are `immediate-advance`, `celebration-then-advance`, `pause`, and `operator-confirm`.

Supported commands are `new-game`, `restart-current-level`, `reset-run`, `skip-level`, `previous-level`, `next-level`, `pause`, `resume`, and `confirm-level-advance`. Invalid transitions are deterministic no-ops with state preserved.

Death flows through `summary` then `restart-countdown` then a fresh run. Countdown expiry increments run number and returns to `playing`. Level completion advances within the current run and increments the level streak. Death/reset clears the active streak while preserving the all-time longest streak.

### Persistence
`persistence.ts` serializes a versioned Phase 7 snapshot containing records plus lifecycle position. Parsing validates schema version and finite/nonnegative numeric fields, rejects malformed state, and returns a canonical copy rather than retaining external object references.

### Autonomous session orchestration
`autonomous-session.ts` coordinates existing level definitions and simulation results with the lifecycle reducer. It exposes bounded cycle helpers for deterministic tests and callers, while the reducer itself supports indefinite operation. No infinite loop is hidden inside a library call.

## Data flow
1. Existing level simulation returns authoritative `LevelSimulationResult`.
2. Phase 7 converts that result to `CompletedLevelEvidence` and spectator events.
3. Records update immutably and produce new-record markers.
4. Lifecycle reducer chooses level advance, celebration, operator wait, summary, or restart countdown.
5. Commands/ticks advance the reducer deterministically.
6. Persistence can snapshot/restore records and lifecycle state at any boundary.

## Error handling
All public constructors/parsers reject non-finite values, negative counters, invalid level ranges, invalid countdowns, and unsupported schema versions. Command reducers never throw for contextually invalid commands; they preserve state. Persistence parsing throws descriptive `TypeError`/`RangeError` errors for malformed durable data.

## Testing strategy
- Preserve and re-run Phase 5/6 production corpus.
- Goal evaluator regressions cover every existing goal type plus `all`/`any` aggregation.
- Records tests prove strict-improvement semantics and streak/cumulative correctness.
- Milestone/near-death tests prove dedupe and rate limiting.
- Lifecycle tests cover every completion policy and every manual command.
- End-to-end deterministic lifecycle test proves death → summary → countdown → new run repeatedly.
- Persistence tests prove round-trip equality, copy isolation, and malformed-state rejection.
- A Phase 7 production corpus runs thousands of pure lifecycle cycles deterministically and verifies bounded state/event growth.

## Scope boundaries
Phase 7 does not implement rendering, HUD layout, audio, OBS/browser integration, or operator dashboard UI. Those consume the state/events introduced here in later phases. Engine physics, AI scoring, level definitions, and Phase 6 failure probabilities are not modified.