# Phase 01 — Core Deterministic Snake Engine

## Primary agents
- Core Game Engine Agent
- Architecture Agent
- QA / Adversarial Scenario Agent

## Objective
Create a framework-independent, deterministic Snake simulation that can run entirely headlessly from a seed and configuration.

## Prerequisites
Read:
- `ROADMAP.md`
- `docs/architecture/ARCHITECTURE.md`
- `docs/architecture/GAME_STATE_MODEL.md`

## Deliverables
- workspace/package scaffold
- strict TypeScript configuration
- `@snake/shared`
- `@snake/engine`
- deterministic seeded RNG
- canonical `GameState`
- command model
- fixed tick runtime
- snake movement/growth
- wall/self collision
- deterministic food spawning
- lifecycle state machine
- engine domain events
- baseline Vitest suite

## Implementation steps
1. Create workspace and package boundaries.
2. Define immutable core types and coordinate utilities.
3. Implement deterministic RNG with serializable state.
4. Implement board occupancy representation optimized for collision checks.
5. Implement snake deque/body model and legal direction rules.
6. Implement fixed-step simulation reducer/runtime.
7. Implement deterministic food placement from currently free cells.
8. Implement score, length, food count, occupancy calculation.
9. Implement lifecycle transitions for new game, playing, death, summary/countdown hooks.
10. Emit typed domain events without any UI dependency.
11. Add snapshot serialization and replay-ready state encoding.

## Required tests
- movement in all directions
- 180° reversal prevented when invalid
- growth after food
- wall collision
- self collision
- food never spawns inside snake
- same seed/config -> identical sequence
- snapshot serialize/restore parity
- pause does not advance ticks
- restart produces expected lifecycle and state
- occupancy percentage correctness

## Non-goals
No PixiJS, React HUD, advanced AI, levels beyond a simple baseline config, persistence adapter, or audio.

## Exit criteria
A command-line/test harness can execute a complete seeded game without browser APIs, and repeated executions with the same seed/config produce identical states and events.
