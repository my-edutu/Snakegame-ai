# Phase 04 — Headless Simulation Harness

## Primary agents
- Simulation & Balancing Agent
- Survival Intelligence Agent
- Performance Agent

## Objective
Run large numbers of deterministic games without rendering to expose AI weaknesses and create quantitative balancing data before adding content-heavy visuals.

## Deliverables
- headless simulation runner
- single-seed replay mode
- batch seed generation
- parallel worker execution where useful
- run metrics aggregation
- percentile/distribution reports
- death-cause clustering
- strategy effectiveness report
- reproducible failure-seed output

## Metrics
Collect at minimum:
- level reached
- survival ticks/time
- maximum length
- maximum occupancy
- score
- food consumed
- death cause
- strategy time share
- strategy transitions
- average risk / peak risk
- decision nodes evaluated
- decision time
- near-death count
- Hamiltonian mode outcomes

## Tasks
1. Create CLI/script APIs for 1, 100, 1,000, and 10,000-run batches.
2. Make rendering/audio/browser dependencies impossible in headless mode.
3. Persist failing seeds and configs as replay fixtures.
4. Produce JSON and human-readable summaries.
5. Add per-level completion funnel.
6. Add death-cause frequency and top trap patterns.
7. Add AI configuration comparison runs.
8. Add deterministic regression benchmark set.

## Example report shape
```text
10,000 simulations
Average maximum level: 14.8
Level 20 completion: 2.3%
Median max occupancy: 68.9%
P95 max occupancy: 83.1%
Main failure: self-created corridor — 43%
Hamiltonian fallback survival success: 87%
```

## Quality gates
- batch results can be regenerated from stored seed set
- no renderer imported into simulation process
- metrics aggregation is bounded in memory
- failures output exact repro command/config

## Exit criteria
The project can generate meaningful statistical evidence about AI performance and reliably replay any interesting or failing run.
