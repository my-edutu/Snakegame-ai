# Phase 5 Level System Design

## Status
Approved for implementation from the existing Phase 5 product contract in `docs/phases/PHASE_05_LEVEL_SYSTEM.md` and architecture contract in `docs/architecture/LEVEL_SCHEMA.md`.

## Goal
Build a deterministic, configuration-driven level domain that ships the first 20 strategically distinct levels without adding level-specific branches to core snake movement. New levels must be addable through validated data plus generic mechanic descriptors.

## Architecture

Phase 5 uses a hybrid boundary:

- `@snake/levels` owns level schemas, migrations, registry, geometry generation, deterministic schedules, goal evaluation, theme metadata, and the 20 level definitions.
- `@snake/engine` gains generic environment primitives only: wrap-aware movement, static obstacles, hazards, portals, typed food, and externally supplied deterministic environment snapshots. It must not know level names or IDs.
- `@snake/ai` continues consuming engine observations. Its existing obstacle/hazard observation fields remain authoritative; Phase 5 adds portal/wrap metadata only where required for correct path semantics.
- `@snake/simulation` gets level-aware orchestration that compiles a `LevelDefinition` into an engine execution and applies deterministic mechanic schedules before/after ticks. Phase 4 remains the measurement/reporting authority.

This keeps responsibilities explicit: levels describe and schedule; engine resolves movement/state; AI decides; simulation measures.

## Package boundary

### `@snake/levels`
Public API:

- `LevelDefinitionSchema` and schema-derived TypeScript types.
- `parseLevelDefinition(input)` and `validateLevelDefinition(level)`.
- `migrateLevelDefinition(input)` with schema version 1 as the current target.
- `LEVELS`, `getLevel(id)`, `getLevelByNumber(number)`, `listLevels()`.
- `compileLevel(level, seed)` -> deterministic compiled runtime config.
- `evaluateProgression(level, state, mechanicState)`.
- deterministic geometry/schedule helpers.

No browser, renderer, audio, wall-clock, or unseeded randomness dependencies.

## Schema v1

`LevelDefinition` contains:

- identity: `id`, `number`, `version`, `name`, `description`;
- board: dimensions, wrap flag, optional geometry descriptor;
- snake: initial length, direction, deterministic spawn descriptor;
- timing: ticks-per-second and optional speed curve metadata;
- obstacles and hazards as declarative descriptors;
- portals as explicit paired endpoints;
- food rules with one or more typed food definitions and deterministic spawn policy;
- progression goals with `all` or `any` aggregation;
- completion policy;
- difficulty multiplier;
- bounded AI modifiers;
- theme reference metadata;
- optional deterministic mechanics: moving obstacles, moving hazards, shrinking boundary, seeded obstacle reconfiguration, temporary topology/food effects.

Zod performs structural validation. A second static semantic validator checks cross-field invariants Zod alone cannot prove.

## Static validation invariants

A level is rejected when detectable at load time if:

- board dimensions are unsupported or coordinates are non-integral/out of bounds;
- generated or explicit spawn cells overlap, self-overlap, or intersect blocked cells;
- initial length cannot fit its spawn descriptor;
- obstacle/hazard IDs or occupied cells collide unexpectedly;
- portals are unpaired, duplicate endpoints, self-paired, blocked, or outside the board;
- scheduled obstacle/hazard positions leave the legal board;
- shrinking boundaries can contract through the initial snake before their first scheduled change;
- food definitions have invalid weights/values/effects or spawn policy cannot produce any legal initial food cell;
- a statically checkable goal exceeds board capacity or uses an impossible threshold;
- AI modifiers exceed documented safe bounds;
- required theme references are absent.

Errors are deterministic, path-addressable, and suitable for CI output.

## Engine environment model

`EngineConfig` is extended generically with optional environment fields while preserving existing baseline defaults:

- `wrap?: boolean`;
- initial `obstacles`, `hazards`, `portals`, and typed `food`;
- optional active bounds for shrinking arenas.

Collision resolution order is deterministic:

1. resolve requested direction;
2. compute raw next head;
3. apply wrap if enabled;
4. resolve portal entry to paired exit at most once for that move;
5. check active bounds;
6. check obstacle/hazard occupancy;
7. check snake self-collision with existing tail-vacate semantics;
8. resolve typed food effects;
9. commit movement and progression state.

Portals never chain recursively in a single move. A portal exit that is blocked or colliding is a deterministic collision outcome.

## Food model

Engine food entities become generic typed entities while preserving normal-food compatibility. Each food type supplies deterministic engine effects such as score delta, growth delta, and optional poison shrink/penalty. Level rules control simultaneous food count, spawn cadence, weights, and permitted cells. RNG always comes from the engine/level seeded stream; no `Math.random()`.

## Mechanic runtime

Mechanics are descriptor-driven and compiled into deterministic schedules rather than arbitrary user callbacks. The Phase 5 runtime exposes lifecycle hook points equivalent to `onLevelStart`, `beforeDecision`, `afterMove`, and `onTickEnd`, but built-in mechanics are pure functions over `(level, tick, seed, state)`.

Supported v1 mechanics:

- periodic moving obstacle schedules;
- periodic moving hazard schedules;
- paired portals;
- multiple food types/spawn rules;
- shrinking active bounds;
- seeded obstacle reconfiguration for Chaos Grid;
- speed/timing metadata;
- level-specific objective counters needed by progression evaluation.

The schedule for a given level seed and tick is byte-stable regardless of worker count or host timing.

## Progression goals

Goals support:

- snake length;
- food consumed;
- survival ticks;
- occupancy percentage;
- score;
- named mechanic objective.

`evaluateProgression` returns per-goal evidence plus overall completion. Evaluation is pure and never mutates engine state.

## Twenty-level roster

1. Genesis — open baseline growth.
2. Growing Pressure — smaller effective area and faster occupancy target.
3. The Wall — static barrier routing.
4. Corridors — narrow lanes and tail-awareness.
5. Crossroads — chamber bottlenecks.
6. Velocity — elevated timing metadata and reduced AI budget.
7. Islands — irregular blocked clusters.
8. The Maze — deterministic maze topology.
9. Moving Walls — periodic obstacle schedules.
10. Famine — sparse food cadence and survival goal.
11. Hunter — deterministic moving hazards.
12. Portals — paired graph shortcuts.
13. Dual Feast — simultaneous food types with value/risk trade-offs.
14. Poison Garden — harmful food effects.
15. Shrinking Arena — scheduled active-boundary contraction.
16. Chaos Grid — seed-derived obstacle reconfiguration.
17. Hyper Speed — extreme timing and constrained AI budget.
18. Labyrinth — deep maze with constrained exits.
19. Endgame — large initial snake and immediate space pressure.
20. Singularity — extreme occupancy/Hamiltonian endgame.

Each definition must include a unique mechanic fingerprint asserted by tests; strategic distinctness is not inferred only from names or theme metadata.

## Simulation integration and balancing

Phase 4 reports become the tuning loop. Level-aware simulations run the same seed corpus across each level and record the existing level funnel, survival, occupancy, strategy, risk, and failure-pattern data.

Difficulty bands are targets, not encoded probabilities:

- 1–5: usually successful;
- 6–10: moderate;
- 11–15: significant;
- 16–19: very difficult;
- 20: extreme.

CI validates structural ordering using deterministic fixed corpora and broad non-flaky bands rather than brittle exact success percentages.

## Testing strategy

- Schema parsing/migration tests.
- Semantic-invalid fixture tests for every invariant class.
- Geometry generator snapshot/determinism tests.
- Engine regression tests proving baseline behavior remains unchanged when environment options are omitted.
- Focused engine tests for wrap, obstacles, hazards, portals, typed food, and active bounds.
- Mechanic schedule determinism tests.
- Goal evaluator tests.
- Registry tests proving 20 unique ordered levels.
- One defining-mechanic fixture per level.
- Headless deterministic run for every level and fixed seed.
- Repeat-run byte equality for level reports.
- Level-aware worker/sequential equivalence.
- Import-boundary test preventing rendering dependencies.

## Error handling

Invalid level data fails before a run starts with a deterministic `LevelValidationError` containing issue paths. Runtime mechanic invariant violations are hard failures with level ID, seed, tick, and mechanic context; they are never silently repaired. Worker failures continue propagating through the Phase 4 error contract.

## Production exit gate

Phase 5 is releasable only when:

- all 20 definitions parse and pass semantic validation;
- all 20 execute headlessly and deterministically;
- every level has a tested defining mechanic;
- baseline Phase 1–4 tests stay green;
- repeated level reports are byte-identical;
- sequential and worker level runs agree;
- no renderer/browser/audio dependency enters engine/levels/simulation domains;
- branch is 0 behind `main`;
- exact PR head passes frozen install, strict typecheck, all tests/builds, deterministic probes, and a level-registry production smoke;
- the merged `main` commit passes the same permanent workflow independently.

## Deliberate non-goals

Phase 5 does not implement controlled failure injection (Phase 6), persistence/records (Phase 7), rendering/HUD/audio, operator controls, OBS integration, or livestream automation.