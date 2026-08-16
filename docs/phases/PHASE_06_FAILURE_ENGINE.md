# Phase 06 — Configurable Failure Engine

## Primary agents
- Failure Systems Agent
- Survival Intelligence Agent
- Simulation & Balancing Agent
- QA / Adversarial Scenario Agent

## Objective
Implement optional, seeded, plausible AI deviations while preserving natural failures and auditable analytics.

## Deliverables
- validated failure configuration
- eligibility engine
- seeded probability model
- deviation policy registry
- natural-looking mode
- causal attribution analytics
- operator presets integration
- statistical tests

## Tasks
1. Implement `FailureConfig` from the architecture document.
2. Convert hourly/minute rate settings into per-eligible-decision probabilities.
3. Enforce minimum runtime, level, occupancy, risk, and length restrictions.
4. Clamp maximum probability.
5. Use only the simulation RNG.
6. Implement allowed deviations: second-best route, reduced lookahead, food over-weight, delayed tail-follow, risky corridor, temporary scoring bias.
7. Record the baseline best move and applied deviation.
8. Keep private settings out of public stream state.
9. Add causal window logic so a deviation can be marked contributory without incorrectly labeling every later death artificial.
10. Add presets: Record Attempt, Safe Stream, Balanced Stream, Chaos Stream, Demo.

## Statistical verification
Run large samples to verify:
- disabled = zero deviations
- target hazard rate is approximately achieved
- maximum probability is never exceeded
- eligibility restrictions are exact
- seed replay reproduces deviation timing and type

## Safety invariants
- never choose an illegal move
- never rewrite historical records
- never secretly change board physics
- never guarantee death at a specific hidden time

## Exit criteria
Controlled deviations are configurable, plausible, deterministic under a seed, statistically verified, privately configured, and analytically distinguishable from natural AI failure.
