# Specialized Agent Roles

## Purpose
Use specialized implementation agents with narrow ownership, explicit inputs/outputs, and hard quality gates. No agent should silently redesign another subsystem without an architecture decision record.

## 1. Architecture Agent
Owns package boundaries, interfaces, dependency direction, ADRs, lifecycle model, and cross-package contracts.

Deliverables:
- architecture diagrams
- package APIs
- state/event contracts
- ADR reviews
- dependency-boundary checks

Must reject:
- rendering logic in engine
- persistence calls in simulation ticks
- unseeded randomness
- giant cross-domain services

## 2. Core Game Engine Agent
Owns deterministic tick loop, snake movement, collision detection, growth, food spawning, obstacles, hazards integration hooks, scoring, and lifecycle transitions.

Definition of quality:
- pure deterministic behavior under seed/config
- complete movement/collision tests
- replay fixtures for regressions

## 3. AI Pathfinding Agent
Owns BFS, A*, distance maps, route reconstruction, candidate enumeration, and pathfinding performance.

Does not own:
- UI strategy text
- failure probabilities
- renderer paths

## 4. Survival Intelligence Agent
Owns flood fill, free-space evaluation, tail reachability, trap/corridor analysis, future-state simulation, strategy switching, risk calculation, endgame/Hamiltonian logic, and explainable decision evidence.

## 5. Level Design Agent
Owns level schema usage, geometry, hazards, goals, balancing intent, AI modifiers, validation, and the first 20 level definitions.

Every level must be:
- visually identifiable through theme metadata
- strategically distinct
- deterministic
- simulation-testable

## 6. Failure Systems Agent
Owns configurable strategy deviations, eligibility rules, seeded probability, causal analytics, privacy boundary between operator/public state, and presets.

Must never manipulate records or fabricate public events.

## 7. Simulation & Balancing Agent
Owns headless simulation runner, batch orchestration, metrics aggregation, failure clustering, percentile reports, tuning experiments, and deterministic repro seeds.

Expected outputs:
- 1k/10k run reports
- per-level completion rates
- death-cause distributions
- strategy effectiveness
- occupancy/survival percentiles

## 8. Rendering Agent
Owns PixiJS scene graph, interpolation, skins, themes, particles, food visuals, hazards, transitions, death animation, and quality presets.

Hard constraint: renderer is never authoritative.

## 9. Livestream UX Agent
Owns spectator HUD, milestone banners, near-death UX, record presentation, run summary, countdown, stream-mode interaction restrictions, and 1080p/1440p/4K layouts.

Success test: a fresh viewer can understand objective, progress, danger, and record target in ~5 seconds.

## 10. Operator Dashboard Agent
Owns operator controls, configuration forms, presets, import/export, destructive-action confirmations, private failure settings, debug toggles, and live configuration validation.

## 11. Audio Agent
Owns Web Audio implementation, sound event mapping, volume/mute, fatigue-safe repetition limits, pooling, and copyright-safe asset policy.

## 12. Persistence & Recovery Agent
Owns repositories, IndexedDB, checkpoints, schema migrations, autosave, restore, record durability, corrupted-state handling, and future Supabase adapter boundaries.

## 13. Performance Agent
Owns profiling, memory snapshots, event/listener leak detection, particle/object pools, rendering budgets, decision-time budgets, long-session instrumentation, and optimization verification.

## 14. QA / Adversarial Scenario Agent
Owns dangerous board fixtures, deterministic regression cases, property/invariant tests, operator E2E tests, reload/crash recovery tests, and release blocking criteria.

## 15. Release / Stream Reliability Agent
Owns production build checks, OBS browser-source verification, fullscreen behavior, watchdog integration readiness, recovery drills, release checklist, and deployment runbook.

## Agent handoff protocol
Each agent task must state:
1. scope
2. files/packages owned
3. dependencies
4. interfaces consumed
5. interfaces produced
6. tests required
7. performance/reliability constraints
8. acceptance criteria
9. known risks
10. handoff notes

## Shared rules for every agent
- inspect repository before editing
- read architecture docs first
- prefer small typed modules
- add tests with behavior changes
- do not use `Math.random()` in deterministic paths
- do not couple stream/operator UI to engine internals
- do not add dependencies without justification
- document architectural deviations with ADRs
- preserve backward-compatible config/schema migrations where persistence is involved
- report discovered spec gaps rather than silently inventing conflicting behavior
