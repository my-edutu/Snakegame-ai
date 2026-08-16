# Phase 2 — Deterministic AI Pathfinding Design

## Status
Approved for execution under the operator's standing instruction to proceed without further clarification and choose the strongest production-oriented option.

## Goal
Add deterministic, renderer-independent route finding that lets the autonomous Snake reason about legal static-board routes to food and the current tail, while deliberately stopping short of Phase 3 survival reasoning.

## Context
Phase 1 established a deterministic `@snake/engine` and `@snake/shared` foundation with seeded simulation, immutable external state access, snapshots, headless execution, frozen dependencies, and permanent CI. Phase 2 must preserve those invariants and consume `GameState` without introducing browser or rendering dependencies.

## Approaches considered

### A. Put pathfinding directly inside `@snake/engine`
Rejected. It would couple simulation rules to decision policy and make later AI strategy evolution harder to test, profile, or replace.

### B. Create `@snake/ai` with deterministic pure search primitives — selected
The AI package consumes immutable observations derived from `GameState`, owns graph/search/planner logic, and returns routes plus evidence. The engine remains authoritative for state transitions.

### C. Use a third-party graph/pathfinding library
Rejected for Phase 2. The algorithms required are small, deterministic, performance-sensitive, and easier to audit when implemented directly. A dependency would add bundle and tie-breaking behavior we do not control.

## Package boundary
Create `packages/ai` as `@snake/ai`.

Dependencies:
- `@snake/shared` for `Direction`, `Vec2`, and geometry helpers.
- `@snake/engine` for read-only `GameState` types only.

`@snake/engine` must not import `@snake/ai` in Phase 2. Integration remains one-way so the core simulator can run independently.

## Observation model
`createObservation(state: GameState): AiObservation` creates a defensive immutable snapshot containing only search-relevant data:
- board width/height
- head
- full snake body
- current tail
- current direction
- food targets
- obstacles
- hazards that are statically blocking in the current tick
- current tick and run identifier for diagnostics

The observation never exposes mutable references from `GameState`.

## Graph semantics
The board is an orthogonal unweighted grid.

Canonical deterministic neighbor order:
1. `up`
2. `right`
3. `down`
4. `left`

A normal search treats all snake body cells, obstacles, and blocking hazards as unavailable, except:
- the start/head cell is always valid;
- a planner may explicitly mark its target cell traversable;
- tail planning marks only the current tail cell traversable.

No Phase 2 planner predicts future tail motion. That belongs to Phase 3.

## Core search API

```ts
export type SearchAlgorithm = 'bfs' | 'astar';

export interface PathRoute {
  readonly coordinates: readonly Vec2[];
  readonly directions: readonly Direction[];
}

export interface SearchTelemetry {
  readonly algorithm: SearchAlgorithm;
  readonly outcome: 'found' | 'unreachable' | 'invalid-target';
  readonly nodesExplored: number;
  readonly frontierPeak: number;
  readonly pathLength: number | null;
}

export interface SearchResult {
  readonly route: PathRoute | null;
  readonly telemetry: SearchTelemetry;
}
```

Core search contains no wall-clock calls. Optional elapsed timing is supplied through an injected timing adapter so time measurement cannot influence route selection or replay parity.

## BFS
BFS is the canonical shortest-path oracle for the unweighted grid.

Requirements:
- deterministic queue traversal using canonical neighbor order;
- predecessor map for exact route reconstruction;
- reusable distance-map API for later candidate evaluation;
- zero-length route when start equals target;
- explicit unreachable result rather than exceptions.

## A*
A* uses Manhattan distance.

Deterministic priority order:
1. lowest `f = g + h`;
2. lowest `h`;
3. earliest insertion sequence.

A* must return the same shortest path as BFS for fixtures where deterministic tie-breaking produces the same canonical route. It is an optimization, not a different policy.

## Planner APIs

### Food planner
`planPathToFood(observation, options?)`
- considers all current food items;
- selects the reachable target with shortest route;
- ties resolve by row-major target position (`y`, then `x`), then food id;
- returns the selected target and search result.

### Tail planner
`planPathToTail(observation, options?)`
- targets the current tail;
- makes that tail cell traversable for this static search only;
- does not claim the route remains safe after body movement.

## Candidate move ranking
Phase 2 introduces an interface, not the Phase 3 survival score.

```ts
export interface CandidateMove {
  readonly direction: Direction;
  readonly legal: boolean;
  readonly targetDistance: number | null;
  readonly order: number;
}
```

Ranking order:
1. legal before illegal;
2. finite shortest target distance before unreachable;
3. lower distance;
4. canonical direction order.

This gives later survival reasoning a deterministic baseline without pretending distance equals safety.

## Debug-safe evidence
Search results may expose coordinate routes, directions, explored-node count, frontier peak, selected target, and failure reason. They must not import PixiJS, React, DOM, or renderer types.

## Performance requirements
On a 100x100 static board with representative blocked cells:
- BFS and A* must terminate without recursion or stack-risk;
- search is bounded by board cell count;
- no retained global frontier/search state between calls;
- A* must not explore more nodes than BFS on the standard open-board long-route benchmark.

Performance tests use deterministic operation counts for correctness. Wall-clock thresholds are avoided in CI to prevent runner flakiness.

## Error handling
Invalid targets outside the board return `invalid-target`.
Empty target sets return a planner result with no selected target and no route.
Malformed observations are prevented through construction from validated engine state; lower-level graph functions still safely reject out-of-bounds cells.

## Testing strategy
Required automated coverage:
- immutable observation derivation;
- legal neighbor enumeration at corners/edges/interior;
- blocked-body/obstacle handling;
- BFS open-board shortest route;
- deterministic obstacle detour;
- unreachable target;
- zero-length route;
- distance map correctness;
- route reconstruction consistency;
- A* shortest-path equivalence;
- deterministic A* tie-breaking;
- food selection across multiple targets;
- tail target traversability;
- candidate ranking determinism;
- route never crosses blocked cells;
- 100x100 large-board operation-count benchmark;
- repeated identical calls return deep-equal results.

## CI and production readiness
Extend the permanent GitHub Actions gate so Phase 2 requires:
- `pnpm install --frozen-lockfile`;
- strict typecheck for all workspaces;
- all Phase 1 and Phase 2 tests;
- all package builds;
- forbidden API scan across `shared`, `engine`, and pure AI core;
- deterministic pathfinding smoke execution repeated twice with identical output.

Phase 2 is production-ready only after the exact merge candidate passes CI, is squash-merged to `main`, and the post-merge `main` workflow also passes.

## Explicit non-goals
Deferred to Phase 3:
- flood-fill survivability scoring;
- future-state body simulation;
- trap/corridor analysis;
- food-safety rejection;
- dynamic tail prediction;
- Hamiltonian logic;
- risk score;
- final autonomous strategy switching.

## Exit criteria
The AI package can deterministically find and explain shortest static routes to food or tail targets on representative boards; route results never cross currently blocked geometry; APIs are immutable and renderer-independent; large-board searches are bounded; all regression/CI gates pass on `main`.