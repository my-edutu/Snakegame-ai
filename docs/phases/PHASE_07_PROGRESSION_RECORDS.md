# Phase 07 — Progression, Records, Run Lifecycle

## Primary agents
- Core Game Engine Agent
- Persistence & Recovery Agent
- Livestream UX Agent

## Objective
Complete the run lifecycle, level progression, records, summaries, milestones, and auto-restart behavior.

## Deliverables
- progression-goal evaluator
- level-complete policies
- run state machine
- all-time record model
- milestone engine
- death classification
- run summary model
- auto-restart countdown
- streaks and cumulative statistics

## Tasks
1. Implement goal aggregation (`all` / `any`).
2. Implement immediate advance, celebration-then-advance, pause, and operator-confirm completion policies.
3. Track run number, level streak, total games, deaths, food, playtime, highest level, max length, max occupancy, longest survival, high score, fastest completion.
4. Implement spectator-friendly death labels backed by internal causes.
5. Implement meaningful milestone events with deduplication/rate limits.
6. Add near-death events sourced from AI evidence.
7. Build `RunSummary` with new-record markers.
8. Add configurable restart delay and indefinite auto-run lifecycle.
9. Ensure manual New Game, Restart Current Level, Reset Run, Skip, Previous, Next, Pause, Resume are represented as commands.

## Required tests
- each progression goal type
- multi-goal aggregation
- record updates only when exceeded
- no duplicate milestone spam
- death -> summary -> countdown -> new run
- manual actions produce valid state transitions
- streak reset/increment correctness

## Exit criteria
The autonomous game can progress through levels, end a run, produce a correct summary, preserve/update records, countdown, and start another run indefinitely without UI-specific logic in the engine.
