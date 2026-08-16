# Phase 02 — AI Pathfinding

## Primary agents
- AI Pathfinding Agent
- Core Game Engine Agent
- QA / Adversarial Scenario Agent

## Objective
Give the snake deterministic route-finding that can find food and tail routes without yet claiming full long-term survival intelligence.

## Deliverables
- board graph abstraction
- legal neighbor enumeration
- BFS distance maps
- shortest-path reconstruction
- A* implementation where useful
- path-to-food planner
- path-to-tail planner
- candidate move ranking interface
- pathfinding telemetry

## Tasks
1. Build an immutable AI observation derived from `GameState`.
2. Implement board graph semantics for boundaries and occupied cells.
3. Implement BFS as the baseline unweighted solver.
4. Add A* with Manhattan heuristic for larger boards/complex geometry.
5. Return routes as direction sequences and coordinate paths.
6. Add deterministic tie-breaking so replay parity is guaranteed.
7. Track nodes explored, path length, decision time, and failure reason.
8. Expose debug-safe path data without importing renderer code.

## Required tests
- shortest route on open board
- obstacle detour
- unreachable target
- tail route
- deterministic tie breaking
- path never crosses currently blocked cells
- route reconstruction correctness
- performance on large boards

## Exit criteria
The AI can reliably reach food or tail targets on representative static boards, all pathfinding is deterministic, and pathfinding APIs are ready to be consumed by survival reasoning.
