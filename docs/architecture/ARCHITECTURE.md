# System Architecture

## Goal
Separate authoritative simulation, AI, presentation, persistence, and livestream concerns so each can evolve independently and the game can run headlessly or visually from the same deterministic core.

## Runtime topology
```text
Operator UI ───────┐
Stream UI ─────────┼──> Command Bus ──> Simulation Runtime
Debug UI ──────────┘                     │
                                         ├─ Game Engine
                                         ├─ Level Engine
                                         ├─ AI Decision Engine
                                         ├─ Failure Engine
                                         └─ Seeded RNG
                                              │
                                              v
                                        State + Events
                                          /   |   \
                                         v    v    v
                                   Renderer Analytics Persistence
                                      |         |        |
                                      v         v        v
                                  PixiJS HUD  Metrics  IndexedDB
```

## Package responsibilities
### `@snake/engine`
Pure deterministic simulation. Owns ticks, movement, growth, collisions, food placement, hazards, level-completion checks, lifecycle state, and canonical `GameState`.

### `@snake/ai`
Consumes immutable observation snapshots and returns a `Decision`. It cannot mutate state. Strategies expose scoring evidence for debugging and spectator summaries.

### `@snake/levels`
Owns configuration schema, level registry, geometry generators, hazard descriptors, progression goals, and visual theme references. Level definitions are data.

### `@snake/failure`
Transforms a normal ranked AI decision into a controlled suboptimal choice only when configured eligibility rules pass. It records deviation provenance.

### `@snake/rendering`
PixiJS scene graph and animation interpolation. Reads snapshots/events. Never determines gameplay collisions or positions.

### `@snake/streaming`
Auto-run lifecycle, stream-safe state projection, milestone/near-death rules, event banners, countdowns, stream-mode restrictions, watchdog hooks.

### `@snake/analytics`
Append-only domain events and bounded aggregators for runs, strategies, deaths, decisions, levels, and performance.

### `@snake/persistence`
Storage interfaces plus IndexedDB implementation. Later adapters can target Supabase/PostgreSQL without changing engine APIs.

### `@snake/config`
Zod schemas, defaults, operator presets, import/export format, migrations, and public-vs-private configuration views.

## Hard boundaries
- Engine imports no React, PixiJS, browser storage, or OBS code.
- AI receives an observation object, not mutable engine internals.
- Renderer cannot call collision or progression mutations.
- Failure engine cannot fabricate impossible moves; it may only choose legal candidates unless a level mechanic explicitly supports otherwise.
- Persistence is asynchronous and must never block a simulation tick.
- Analytics backpressure must be bounded and loss-tolerant for low-priority telemetry.

## Clock model
Use a fixed simulation tick. Rendering uses `requestAnimationFrame` and interpolates between authoritative tick snapshots. High-speed simulation runs execute ticks as fast as CPU allows with rendering disabled.

## Concurrency
Use Web Workers for high-volume simulation. Keep the first interactive game loop single-authoritative-runtime to avoid synchronization complexity. AI can later be worker-isolated if decision budgets demand it.

## Event model
The engine emits typed domain events such as:
- `RunStarted`
- `LevelStarted`
- `SnakeMoved`
- `FoodConsumed`
- `StrategyChanged`
- `NearDeathDetected`
- `MilestoneReached`
- `LevelCompleted`
- `SnakeDied`
- `RunEnded`
- `ArtificialDeviationApplied`

Consumers subscribe through a bounded event bus.

## Dependency direction
`shared <- engine <- ai/levels/failure`

Presentation, analytics, persistence, and streaming may depend on domain types but the domain never depends on them.

## Architecture decision records
Any significant deviation from these boundaries should add an ADR under `docs/architecture/decisions/` explaining context, alternatives, decision, and consequences.
