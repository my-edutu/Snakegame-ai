# Phase 3 Survival Reasoning Design

## Status
Approved for implementation under the user's standing instruction to choose the best production option without additional clarification.

## Goal
Upgrade `@snake/ai` from deterministic static-board pathfinding into deterministic survival-first decision making that can evaluate immediate moves, simulate moving-body futures, reject unsafe food routes, quantify risk, switch strategies with hysteresis, and use Hamiltonian ordering on compatible boards.

## Architectural principles
1. Survival before score: immediate collision and hard trap conditions disqualify a move before weighted scoring.
2. Deterministic decisions: output depends only on observation, explicit AI state, and configuration; wall-clock time never changes move selection.
3. Node budgets, not time budgets: lookahead is capped by deterministic node limits and depth; exhaustion returns the best fully evaluated candidate.
4. Exact one-step simulation: successor states model body movement, pending growth, food consumption, vacating tail, and direction changes.
5. Bounded multi-step lookahead: recursive search operates over lightweight AI simulation state, never authoritative engine state.
6. Explainability from evidence: viewer summaries are derived from structured decision evidence.
7. Phase isolation: no rendering, UI, stream, persistence, failure-engine, level-engine, or chat code enters Phase 3.

## Modules
- `simulation.ts`: detached simulated state and exact deterministic successor simulation using Phase 1 reversal, collision, growth, food, and vacating-tail semantics.
- `space.ts`: flood-fill reachable area, area ratio, tail reachability, escape routes, corridor/dead-end analysis, and deterministic bottleneck pressure.
- `lookahead.ts`: canonical-direction bounded survival search with explicit depth and node budget.
- `hamiltonian.ts`: deterministic Hamiltonian cycle/order for compatible obstacle-free rectangles; no general arbitrary-obstacle solver.
- `risk.ts`: normalized 0-100 risk with transparent contributors.
- `strategy.ts`: `hunt`, `explore`, `expand`, `escape`, `tail-follow`, `survival`, `high-risk`, `endgame`, `hamiltonian`, `recovery` with hysteresis and emergency overrides.
- `decision.ts`: orchestrates Phase 2 routing plus Phase 3 survival evaluation and evidence.

## Candidate evaluation
For each canonical direction `up`, `right`, `down`, `left`:
1. Enforce legality and reversal rules.
2. Produce exact successor state.
3. Flood-fill reachable area.
4. Measure tail reachability and escape routes.
5. Detect corridor/dead-end/topology pressure.
6. Evaluate post-food growth safety.
7. Run bounded moving-body lookahead.
8. Apply Hamiltonian ordering penalty when eligible.
9. Compute deterministic trap score.
10. Apply hard safety rejection.
11. Score remaining candidates and select the best fully evaluated move.

## Food safety
Food progress never outranks survival. A food-consuming candidate is safe only when the post-consumption state passes space and lookahead gates. Phase 2 shortest-food distance is evidence only; Phase 3 may reject the route.

## Moving-tail reasoning
Lookahead advances the full body on every simulated move so cells released by the tail become available naturally. This replaces static-board assumptions for survival decisions without changing Phase 2 pathfinding semantics.

## Hamiltonian behavior
Compatible obstacle-free rectangular boards with at least one even dimension receive a deterministic cycle/order map. At high occupancy, the evaluator penalizes moves that violate forward Hamiltonian ordering. Incompatible boards fall back to endgame survival reasoning.

## Strategy priority
1. `high-risk` when every legal candidate is materially dangerous.
2. `escape` when one or fewer safe moves exist or topology is critical.
3. `hamiltonian` when occupancy is high and a compatible order can be preserved.
4. `endgame` at high occupancy when Hamiltonian mode is unavailable.
5. `tail-follow` when food is unsafe and tail preservation is strongest.
6. `survival` when food is unsafe and optionality dominates.
7. `hunt` when safe food progress exists.
8. `expand` when accessible-space expansion is strongest.
9. `recovery` when exiting a constrained state into healthy topology.
10. `explore` otherwise.

## Production defaults
```ts
{
  lookaheadDepth: 8,
  lookaheadNodeBudget: 6000,
  minimumSafeAreaRatio: 0.35,
  highOccupancyThreshold: 0.72,
  strategyMinDwellTicks: 6
}
```

## Determinism and performance
- Flood fill is O(board cells) per analysis.
- Lookahead is bounded by explicit depth and node budget.
- No wall-clock value influences move selection.
- No `Math.random`, Date/time, DOM, storage, timers, network, or browser APIs enter deterministic reasoning.
- Budget exhaustion returns a deterministic fully evaluated candidate.
- Results own their evidence data and expose no aliases to observation state.

## Required scenario tests
1. Shortest food path enters a pocket and is rejected.
2. Exactly one safe move exists and is selected.
3. Tail following is the only survivable plan.
4. Food is safe before consumption but unsafe after growth.
5. Apparent static escape disappears under exact body movement simulation.
6. High occupancy compatible board preserves Hamiltonian order.
7. All legal moves are risky and the least-risk fully evaluated move is selected.
8. Budget exhaustion returns a deterministic fully evaluated candidate.
9. Same observation/config/strategy produces deep-equal decisions.
10. 100x100 structural bounds remain finite under production budgets.

## Production readiness gates
The exact Phase 3 PR head and merged `main` commit must pass frozen install, strict typecheck, the full regression suite, all package builds, forbidden-API scanning, and byte-identical engine, pathfinding, and survival headless runs. Phase 3 is complete only after adversarial review, 0-behind merge safety, squash merge with expected-head protection, and successful post-merge `main` CI.