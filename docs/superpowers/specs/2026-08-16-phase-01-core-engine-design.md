# Phase 01 Core Deterministic Snake Engine — Design

## Status
Approved approach: pnpm workspaces, strict TypeScript, Vitest, deterministic headless engine, no browser/runtime coupling.

## Goal
Build a production-oriented, framework-independent Snake simulation that can run entirely headlessly from a seed and configuration, produce deterministic state/event sequences, serialize/restore snapshots, and provide the stable domain foundation for every later AI, level, rendering, livestream, analytics, and persistence phase.

## Scope
Phase 1 includes:
- pnpm workspace scaffold
- strict TypeScript configuration
- `@snake/shared`
- `@snake/engine`
- deterministic seeded RNG with serializable state
- canonical immutable game state
- fixed-tick runtime
- snake movement, legal-direction rules, growth
- wall/self collision
- deterministic food placement
- score, food count, snake length, board occupancy
- lifecycle transitions required for a complete seeded run
- typed domain events
- snapshot serialization/restoration
- replay-ready deterministic state encoding
- Vitest unit and deterministic scenario tests
- a small headless harness proving browser-free execution

Phase 1 explicitly excludes React, Next.js application routes, PixiJS, AI pathfinding, advanced survival reasoning, 20-level content, failure engine behavior, IndexedDB, OBS mode, audio, and stream HUD.

## Technology Decisions

### Package manager
Use `pnpm` workspaces.

Rationale:
- strict dependency boundaries are desirable for `@snake/*` packages
- efficient install model for a growing monorepo
- mature workspace filtering for package-specific tests/builds
- no need for Turborepo until build orchestration across more apps/packages becomes material

### Language and compilation
Use TypeScript in `strict` mode with project-local package configs extending a root base config. Build output should be ESM-compatible and Node-executable for the headless harness.

### Testing
Use Vitest for unit, deterministic scenario, snapshot parity, and package-level integration tests.

### Runtime dependencies
Keep Phase 1 domain packages dependency-light. `@snake/shared` should have no runtime dependencies. `@snake/engine` should depend only on `@snake/shared` unless a dependency is clearly justified by deterministic simulation requirements.

## Repository Structure

```text
/
├─ package.json
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
├─ vitest.config.ts
├─ .gitignore
├─ packages/
│  ├─ shared/
│  │  ├─ package.json
│  │  ├─ tsconfig.json
│  │  └─ src/
│  │     ├─ index.ts
│  │     ├─ geometry.ts
│  │     ├─ directions.ts
│  │     ├─ ids.ts
│  │     └─ result.ts
│  └─ engine/
│     ├─ package.json
│     ├─ tsconfig.json
│     ├─ src/
│     │  ├─ index.ts
│     │  ├─ config.ts
│     │  ├─ state.ts
│     │  ├─ commands.ts
│     │  ├─ events.ts
│     │  ├─ rng.ts
│     │  ├─ occupancy.ts
│     │  ├─ snake.ts
│     │  ├─ food.ts
│     │  ├─ lifecycle.ts
│     │  ├─ reducer.ts
│     │  ├─ runtime.ts
│     │  ├─ snapshot.ts
│     │  └─ headless.ts
│     └─ test/
│        ├─ rng.test.ts
│        ├─ snake.test.ts
│        ├─ collision.test.ts
│        ├─ food.test.ts
│        ├─ lifecycle.test.ts
│        ├─ determinism.test.ts
│        ├─ snapshot.test.ts
│        └─ runtime.test.ts
└─ docs/
   └─ superpowers/
      └─ specs/
```

## Package Boundaries

### `@snake/shared`
Own only cross-domain primitives with no simulation policy:
- `Vec2`
- coordinate encoding/helpers
- `Direction`
- direction deltas and opposite-direction helpers
- nominal/basic IDs where helpful
- tiny generic utility types

It must not import `@snake/engine` or any future package.

### `@snake/engine`
Own authoritative simulation behavior:
- runtime configuration
- canonical game state
- RNG
- movement/growth/collision
- food spawning
- lifecycle
- commands
- events
- fixed tick execution
- snapshots
- headless harness

It must not import React, PixiJS, DOM APIs, browser storage, OBS APIs, or future presentation packages.

## Canonical State Model

Phase 1 uses a minimal but extensible `GameState` that preserves the architectural contract already defined in the repository while avoiding fake Phase 2+ implementation.

```ts
interface GameState {
  readonly schemaVersion: 1;
  readonly runId: string;
  readonly seed: number;
  readonly tick: number;
  readonly lifecycle: LifecycleState;
  readonly level: LevelRuntimeState;
  readonly snake: SnakeState;
  readonly food: readonly FoodEntity[];
  readonly obstacles: readonly ObstacleEntity[];
  readonly hazards: readonly HazardEntity[];
  readonly score: ScoreState;
  readonly progression: ProgressionState;
  readonly ai: AIState;
  readonly risk: RiskState;
  readonly run: RunStats;
  readonly rng: SerializedRngState;
  readonly lastDeath?: DeathRecord;
}
```

For fields whose advanced behavior belongs to later phases (`ai`, `risk`, rich progression), Phase 1 provides deterministic neutral/default state only. It does not implement placeholder logic that pretends advanced AI/risk systems already exist.

## Engine Configuration

Phase 1 defines one baseline runtime configuration capable of supporting a complete headless game:

```ts
interface EngineConfig {
  readonly board: {
    readonly width: number;
    readonly height: number;
  };
  readonly seed: number;
  readonly initialSnake: {
    readonly body: readonly Vec2[];
    readonly direction: Direction;
  };
  readonly growthPerFood: number;
  readonly scorePerFood: number;
}
```

Validation is explicit in engine initialization. Invalid dimensions, duplicate snake coordinates, out-of-bounds snake coordinates, and invalid initial self-overlap fail fast before the first tick.

## Deterministic RNG

Use one self-contained 32-bit seeded PRNG implementation with:
- deterministic output for the same serialized state
- `nextUint32()`
- `nextFloat()` in `[0, 1)`
- `nextInt(maxExclusive)` with well-defined behavior
- serializable internal state
- restore constructor/function

`Math.random()` is forbidden in `@snake/engine`.

The exact algorithm is part of replay compatibility. Once tests are committed, changing it is a simulation-breaking change unless snapshot/replay versioning is introduced.

## Board Occupancy Model

Gameplay truth uses integer grid coordinates. Phase 1 should use a compact coordinate key representation for constant-time occupancy checks, while `GameState.snake.body` remains serializable and readable.

Recommended Phase 1 implementation:
- coordinate key: `y * width + x`
- transient `Set<number>` built/maintained for collision and free-cell queries
- body stored head-first as immutable/read-only coordinates in the externally visible state

Avoid premature custom deque/ring-buffer complexity unless profiling shows array operations are already material in Phase 1 tests. The public state model must not expose implementation-specific buffer internals.

## Movement and Growth

Each playing tick resolves one accepted direction and one snake move.

Rules:
- no instantaneous 180-degree reversal for snakes longer than one segment
- the head advances exactly one grid cell per simulation tick
- when not growing, the tail vacates during the same tick
- when growing, tail removal is deferred according to `pendingGrowth`
- food consumption increases `pendingGrowth`, score, and food counters deterministically

Collision semantics must be exact around the moving tail: moving into the current tail cell is legal when that tail is guaranteed to vacate on the same tick and no growth prevents removal.

## Collision Rules

Phase 1 supports:
- wall collision
- self collision

No obstacle/hazard mechanics are active beyond empty canonical arrays.

Death records include at least:
- tick
- cause (`wall-collision` or `self-collision`)
- head position attempted/final position as appropriate

On death, `snake.alive` becomes false and lifecycle transitions deterministically to `death`.

## Food Placement

Food spawning must be deterministic and uniform over currently free board cells for the chosen RNG state.

Requirements:
- never spawn on the snake
- never spawn outside the board
- never depend on object/set iteration order that could vary by implementation
- free cells are enumerated in a deterministic row-major order before RNG index selection
- if no free cell remains, return a defined `board-filled` outcome rather than looping forever

Phase 1 supports one active normal food entity at a time.

## Lifecycle

Phase 1 supports the subset needed to model a complete autonomous run lifecycle without UI timing:

```text
boot -> new-game -> level-start -> playing
playing -> paused -> playing
playing -> death -> run-summary -> countdown -> new-game
```

`intro` and `level-complete` remain valid canonical states but are not required to drive rich behavior in Phase 1.

Commands include:
- `StartNewGame`
- `Pause`
- `Resume`
- `RestartLevel`

Future commands may exist in the shared union only if their behavior is explicitly inert/rejected in Phase 1; prefer not to expose unsupported commands prematurely.

## Fixed Tick Contract

Simulation truth advances only through explicit `step()` calls. Wall-clock time never changes authoritative state.

Per tick in Phase 1:
1. accept a command boundary change if supplied
2. if not `playing`, do not perform snake movement
3. resolve legal requested direction
4. calculate next head
5. determine whether the tail vacates this tick
6. resolve wall/self collision
7. if alive, move snake
8. resolve food consumption/growth/score
9. spawn replacement food if needed
10. update run counters and occupancy
11. emit typed events
12. increment tick and persist RNG state

The order is covered by replay/determinism tests.

## Domain Events

Phase 1 emits a deliberately small typed set:
- `RunStarted`
- `LevelStarted`
- `SnakeMoved`
- `FoodConsumed`
- `FoodSpawned`
- `SnakeDied`
- `RunEnded`
- `LifecycleChanged`

Events are returned from step/runtime results. The engine does not own a browser event emitter and does not asynchronously dispatch events.

## Runtime API

Target API:

```ts
interface StepResult {
  readonly state: GameState;
  readonly events: readonly EngineEvent[];
}

interface EngineRuntime {
  getState(): GameState;
  dispatch(command: EngineCommand): readonly EngineEvent[];
  step(requestedDirection?: Direction): StepResult;
  snapshot(): EngineSnapshot;
}

function createEngine(config: EngineConfig): EngineRuntime;
function restoreEngine(snapshot: EngineSnapshot): EngineRuntime;
```

The runtime encapsulates mutable execution machinery if needed internally, but externally exposed state/snapshots are treated as immutable values.

## Snapshot and Replay Contract

A snapshot contains every value required for deterministic continuation:
- schema version
- config or stable config payload
- canonical state
- RNG state

JSON serialization must round-trip without losing deterministic behavior.

Required invariant:
1. run engine A for N ticks
2. snapshot A
3. restore engine B
4. feed A and B the same future direction sequence
5. states and emitted events remain deeply equal at every subsequent tick

## Headless Harness

Provide a Node-compatible example/CLI-like harness that:
- creates a seeded engine
- advances it using a deterministic direction sequence or trivial safe controller
- outputs final tick, score, length, lifecycle, and seed

The harness exists only to prove the package has no browser dependency. It is not the Phase 2 AI.

## Error Handling

Fail fast on invalid initialization configuration with typed engine errors or descriptive `Error` subclasses.

At runtime:
- invalid opposite-direction requests are ignored in favor of the current legal direction
- unsupported commands return a deterministic rejection/error result rather than silently mutating state
- stepping a paused/dead state must not accidentally move the snake
- impossible food spawn on a full board returns a defined terminal/progression signal

No hidden retries or wall-clock-dependent recovery logic belongs in the core.

## Testing Strategy

### Unit tests
Cover:
- coordinate helpers
- direction legality
- RNG sequences and restore parity
- occupancy encoding
- movement in all four directions
- growth semantics
- wall collision
- self collision
- moving-tail collision edge case
- deterministic food spawn
- occupancy percentage calculation

### Runtime scenario tests
Cover:
- same seed/config + same inputs => identical states/events
- different seed changes deterministic food sequence where free-cell choices exist
- pause freezes authoritative gameplay advancement
- resume continues correctly
- restart resets run state according to config/seed rules
- snapshot/restore parity
- death lifecycle
- board-filled food-spawn edge case

### Build-quality checks
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

All must pass before Phase 1 is complete.

## Parallel Implementation Strategy

Use parallel agents only where file ownership is independent. Shared contracts are established first, then parallel work begins.

### Serial foundation gate
Architecture/Core agent owns:
- root workspace scaffold
- root TypeScript/Vitest configuration
- `@snake/shared` public primitives
- `@snake/engine` public interfaces (`config.ts`, `state.ts`, `commands.ts`, `events.ts`, package exports)

These contracts must land first so parallel agents do not invent incompatible APIs.

### Parallel stream A — Deterministic primitives
Owner: Engine Primitives Agent

Files:
- `rng.ts`
- `occupancy.ts`
- deterministic primitive tests

Responsibilities:
- seeded PRNG
- coordinate occupancy encoding
- deterministic free-cell enumeration

### Parallel stream B — Snake domain rules
Owner: Snake Rules Agent

Files:
- `snake.ts`
- movement/growth/collision tests

Responsibilities:
- legal direction resolution
- body movement
- growth
- wall/self collision semantics
- moving-tail edge cases

### Parallel stream C — Lifecycle/runtime behavior
Owner: Runtime Agent

Files:
- `lifecycle.ts`
- initial `runtime.ts` shell against established interfaces
- lifecycle/runtime tests that do not depend on unfinished food internals

Responsibilities:
- command transitions
- pause/resume/restart
- fixed-tick execution boundary

### Integration stream
Owner: Integration Agent

Runs after A/B/C:
- `food.ts`
- reducer integration
- runtime integration
- snapshot/restore
- headless harness
- deterministic end-to-end scenarios

### Independent review stream
Owner: QA/Adversarial Agent

Does not modify implementation until review findings are accepted. Reviews:
- determinism violations
- tail-vacate collision mistakes
- accidental iteration-order dependence
- mutation leaks
- unsupported browser dependencies
- missing edge tests

## Acceptance Criteria

Phase 1 is complete only when all are true:
1. `pnpm install` resolves the workspace.
2. `@snake/shared` and `@snake/engine` compile in strict TypeScript.
3. No browser API is required to instantiate/run the engine.
4. A full seeded run can execute headlessly.
5. Same seed/config/input sequence yields identical state and events.
6. Snapshot restore continues identically to the original runtime.
7. Food never spawns inside the snake.
8. Wall/self collision behavior passes scenario tests.
9. Moving into a vacating tail cell behaves correctly.
10. Pause does not advance gameplay state.
11. Restart produces the documented deterministic reset behavior.
12. Board occupancy is correct.
13. `pnpm typecheck`, `pnpm test`, and `pnpm build` pass.
14. No React, Next.js, PixiJS, IndexedDB, Web Audio, or OBS dependency exists in the engine packages.

## Architecture Guardrails
- Authoritative state has exactly one source of truth.
- Rendering/UI concerns never enter the engine.
- Wall-clock time never drives simulation truth.
- All gameplay randomness flows through the seeded PRNG.
- Public engine state is serializable.
- Unsupported future-phase functionality is not faked in Phase 1.
- Any change to tick order or RNG algorithm after Phase 1 requires explicit replay-compatibility consideration.

## Decision Summary
Use pnpm workspaces with a small, dependency-light TypeScript domain core. Establish public contracts serially, then dispatch parallel implementation streams for deterministic primitives, snake rules, and lifecycle/runtime behavior. Integrate food, reducer, snapshots, and the headless harness only after those contracts stabilize. This minimizes merge collisions while preserving the speed benefit of parallel agents.