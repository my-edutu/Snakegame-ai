# Phase 03 — Survival Reasoning and Hybrid AI

## Primary agents
- Survival Intelligence Agent
- AI Pathfinding Agent
- QA / Adversarial Scenario Agent

## Objective
Upgrade the snake from route finding to long-horizon survival reasoning.

## Deliverables
- flood-fill accessible-space analysis
- tail-reachability analysis
- corridor/dead-end detection
- trap probability model
- future-state simulation
- risk score 0–100 with contributors
- hybrid strategy state machine
- endgame/Hamiltonian foundation
- explainable decision evidence

## Tasks
1. Evaluate every legal move before selecting one.
2. Simulate candidate successor states.
3. Flood-fill reachable space after each candidate move.
4. Reject routes that produce materially unsafe accessible regions.
5. Model moving-tail space rather than treating the current body as static forever.
6. Detect bottlenecks, one-way chambers, loops, and deep corridors.
7. Implement configurable bounded lookahead with node/time budgets.
8. Implement strategy modes: Hunt, Explore, Expand, Escape, Tail Follow, Survival, High Risk, Endgame, Hamiltonian, Recovery.
9. Add strategy-switch hysteresis.
10. Derive risk from real state evidence.
11. Generate concise spectator-safe strategy summaries from decision evidence.
12. Add Hamiltonian cycle/order support for compatible boards.

## Scenario tests
- shortest food path causes pocket trap and must be rejected
- one safe move remains
- tail-follow is the only survivable plan
- food is safe now but unsafe after growth
- apparent escape closes after body movement
- high occupancy requires Hamiltonian order preservation
- all candidate moves are risky and best-risk move is selected

## Performance gates
- decision budgets configurable by profile
- budget exhaustion returns best fully evaluated move
- no unbounded search
- same state/config/seed -> same decision and evidence

## Exit criteria
The AI routinely survives board states that defeat shortest-path-only logic, can explain why a route was rejected, exposes a real risk score, and passes all dangerous-state fixtures.
