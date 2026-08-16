# Phase 15 — Stress Testing, Release Verification, and Stream Readiness

## Primary agents
- QA / Adversarial Scenario Agent
- Simulation & Balancing Agent
- Release / Stream Reliability Agent
- Performance Agent

## Objective
Prove the complete system is release-ready as a long-running autonomous livestream product, not merely functionally complete.

## Deliverables
- 10k+ simulation report
- deterministic regression suite
- multi-hour browser endurance report
- OBS verification report
- dangerous-state scenario suite
- release checklist
- known-risk register
- recovery drill results
- production runbook

## Final verification matrix
### Game correctness
- movement, growth, food, collisions
- hazards and special mechanics
- all 20 levels
- progression and run lifecycle
- manual controls

### AI correctness
- pathfinding
- flood fill
- tail following
- trap rejection
- future simulation
- risk scoring
- Hamiltonian/endgame behavior
- explainable decision evidence

### Failure engine
- disabled mode purity
- rate/config eligibility
- deterministic deviations
- public/private state separation
- causal analytics

### Persistence/recovery
- record durability
- checkpoint restore
- reload mid-run
- corrupted state fallback
- schema migration

### Stream product
- 1080p/1440p/4K layouts
- OBS Browser Source
- unattended restart/progression
- milestone and near-death correctness
- run summary/countdown
- branding
- readable compression-safe HUD

### Stability
- no major console errors
- bounded memory
- bounded logs/queues/particles
- repeated run cycles
- renderer/context cleanup
- error-boundary recovery

## Simulation acceptance report
At minimum include:
- runs executed
- level completion funnel
- max-level distribution
- survival percentiles
- occupancy percentiles
- death-cause distribution
- strategy effectiveness
- failure-engine distribution by preset
- top reproducible failure seeds
- Level 20 outcomes

## Release blockers
- nondeterministic replay for identical seed/config
- illegal AI movement
- impossible/corrupt level definitions
- private failure settings visible publicly
- unbounded memory/resource growth
- records lost on routine reload
- stream lifecycle stops after death
- major console/runtime errors
- HUD unreadable at target resolution
- destructive operator actions without confirmation

## Exit criteria
The product satisfies the full definition of done in `ROADMAP.md`, passes deterministic and endurance verification, runs unattended in OBS, and has documented known limitations rather than hidden release risks.
