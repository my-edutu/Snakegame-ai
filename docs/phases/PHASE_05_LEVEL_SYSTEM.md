# Phase 05 — Level System and First 20 Levels

## Primary agents
- Level Design Agent
- Core Game Engine Agent
- Survival Intelligence Agent
- QA / Adversarial Scenario Agent

## Objective
Implement the configuration-driven level engine and ship the first 20 strategically distinct levels.

## Deliverables
- Zod level schema
- level registry
- schema versioning/migrations
- geometry generators
- obstacle/hazard descriptors
- progression-goal evaluator
- special-mechanic hooks
- 20 validated level definitions
- per-level simulation tests

## Level roster
1. Genesis
2. Growing Pressure
3. The Wall
4. Corridors
5. Crossroads
6. Velocity
7. Islands
8. The Maze
9. Moving Walls
10. Famine
11. Hunter
12. Portals
13. Dual Feast
14. Poison Garden
15. Shrinking Arena
16. Chaos Grid
17. Hyper Speed
18. Labyrinth
19. Endgame
20. Singularity

## Tasks
1. Implement the schema defined in `docs/architecture/LEVEL_SCHEMA.md`.
2. Build static validation for spawn/geometry/goal contradictions.
3. Implement deterministic mechanic hooks.
4. Add portal graph semantics.
5. Add moving obstacle/hazard schedules based on simulation ticks.
6. Add multiple food types and configurable spawn rules.
7. Add shrinking-boundary mechanics.
8. Add seeded obstacle reconfiguration for Chaos Grid.
9. Add theme metadata without importing rendering dependencies.
10. Tune AI modifiers and difficulty multipliers using Phase 04 reports.
11. Create fixtures for each level's defining mechanic.

## Balancing target
- Levels 1–5: AI usually succeeds.
- Levels 6–10: moderate challenge.
- Levels 11–15: significant challenge.
- Levels 16–19: very difficult.
- Level 20: extreme endgame.

These are tuning targets, not hard-coded success probabilities.

## Exit criteria
All 20 levels validate, run headlessly, differ strategically, produce deterministic outcomes under a seed, and can be progressed through without special-case code in the core engine.
