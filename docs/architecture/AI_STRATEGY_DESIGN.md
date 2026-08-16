# AI Strategy Design

## Objective
The AI optimizes **survival first**, then progress/food. A short path to food is rejected when it materially reduces survivability.

## Decision pipeline
1. Enumerate legal immediate moves.
2. Produce short-horizon successor states for each move.
3. Score hard safety constraints.
4. Evaluate accessible free space with flood fill.
5. Evaluate head-to-tail reachability.
6. Detect corridors, chambers, loops, and dead ends.
7. Score food route safety.
8. Run bounded future-state lookahead.
9. Evaluate Hamiltonian compatibility when occupancy is high.
10. Select strategy mode.
11. Rank candidate moves and attach evidence.

## Strategy modes
- `hunt`: pursue food when route and post-consumption state are safe.
- `explore`: preserve optionality while repositioning.
- `expand`: maximize accessible territory and avoid premature enclosure.
- `escape`: prioritize exit from tightening local topology.
- `tail-follow`: exploit moving-tail space to survive.
- `survival`: ignore food where necessary and maximize safe horizon.
- `high-risk`: select best available option when all choices are dangerous.
- `endgame`: prioritize occupancy-safe sequencing over short-term score.
- `hamiltonian`: follow validated cycle/order constraints where applicable.
- `recovery`: return from deviation or unstable local topology to a safe invariant.

## Candidate score
A candidate move may use a weighted score, but hard disqualifiers should precede weights.

Example evidence dimensions:
```ts
interface MoveEvaluation {
  direction: Direction;
  legal: boolean;
  immediateCollision: boolean;
  reachableArea: number;
  reachableAreaRatio: number;
  tailReachable: boolean;
  escapeRouteCount: number;
  corridorDepth: number;
  foodDistance: number | null;
  foodSafe: boolean;
  predictedSurvivalTicks: number;
  hamiltonianPenalty: number;
  trapProbability: number;
  totalScore: number;
  reasons: readonly DecisionReason[];
}
```

## Pathfinding layers
### BFS / distance maps
Use for unweighted shortest paths and fast food/tail distance information.

### A*
Use for path construction when heuristics materially reduce search work.

### Flood fill
Measure reachable free space after simulating body movement. Compare region size against snake length, growth, topology, and escape options.

### Tail reachability
A food path is not considered safe merely because the current tail is reachable. Simulate tail movement and verify the post-route state remains viable.

### Future simulation
Bound by configurable depth and/or node budget. Never let a pathological board freeze the render loop. Decision telemetry records elapsed decision time and nodes evaluated.

## Hamiltonian/endgame behavior
For compatible boards, precompute or generate a cycle/order map. The AI may use safe shortcuts only if they preserve cycle ordering constraints. Irregular levels can use near-Hamiltonian region ordering instead of forcing a cycle that does not fit.

## Strategy switching
Strategy switching must be based on state thresholds with hysteresis to prevent oscillation every tick. Example triggers:
- low safe-move count -> escape/survival
- food route fails space threshold -> reject hunt
- high occupancy + compatible geometry -> endgame/Hamiltonian
- safe tail route + constrained region -> tail-follow
- recovery after controlled deviation -> recovery

## Explainability
Every decision returns machine evidence and a concise spectator-safe summary derived from that evidence. Example:
- `FOOD PATH REJECTED — accessible area 488 → 79`
- `TAIL FOLLOW — preserves 3 escape routes`
- `ENDGAME MODE — occupancy 82.4%`

Do not generate fake reasoning strings independently of the actual scoring result.

## Risk score
Risk is computed from normalized contributors including safe moves, accessible-space ratio, escape routes, obstacle/hazard density, occupancy, body proximity, prediction failures, speed/difficulty multiplier, and trap score. Store contributors so the debug UI can explain the number.

## Performance budgets
Define per-profile budgets rather than unlimited reasoning:
- interactive normal
- interactive maximum
- headless batch
- demo/high-speed

When a budget is exhausted, return the best fully evaluated candidate rather than blocking indefinitely.

## Test fixtures
Maintain scenario fixtures for:
- food inside a pocket
- one-safe-move escape
- tail-follow survival
- apparent shortcut that closes the tail path
- narrow corridor longer than available escape room
- high-occupancy Hamiltonian endgame
- moving hazard timing
- portal route safety
- shrinking arena boundary transition
