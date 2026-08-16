# Testing Strategy

## Goal
Testing must prove correctness, determinism, survivability, long-run stability, and livestream reliability. A green UI smoke test is not sufficient.

## Test pyramid
### Unit tests
Cover pure algorithms and reducers:
- movement
- growth
- collision detection
- food placement
- seeded RNG
- BFS/A*
- flood fill
- trap/corridor analysis
- tail reachability
- risk scoring
- progression goals
- record updates
- failure eligibility/probability
- config validation/migrations

### Scenario tests
Construct intentionally dangerous board states and assert the AI's decision/evidence. Every discovered production simulation bug should become a permanent seeded regression fixture.

Required scenarios:
- one safe move
- greedy food trap
- tail-follow escape
- false tail path
- chamber/bottleneck trap
- portal path ambiguity
- moving wall timing
- shrinking arena transition
- poison-food tradeoff
- high-occupancy endgame

### Property/invariant tests
Examples:
- snake body coordinates remain unique while alive
- food never occupies blocked cells unless a level mechanic explicitly allows it
- legal decisions are within board rules
- occupancy remains within 0..100%
- same seed/config/commands produce same state/events
- records never decrease
- failure engine never emits illegal moves

### Batch simulations
Run statistically meaningful seed sets after AI/level/failure changes. Compare distributions to baselines and flag regressions in survival, completion funnels, decision time, and failure causes.

### E2E browser tests
Use Playwright for:
- start/restart/pause/resume
- level navigation
- operator configuration
- presets
- config import/export
- destructive confirmations
- stream route privacy
- summary/countdown/restart
- reload recovery
- fullscreen/stream behavior

### Endurance tests
Run browser sessions for hours with telemetry sampling. Test repeated deaths, level transitions, particles, audio, persistence, and simultaneous operator/stream views.

## Deterministic replay protocol
A regression artifact stores:
- seed
- game/level config versions
- AI config
- failure config
- command/event schedule when relevant
- expected state/event checkpoints

A failure report must print the exact replay parameters.

## Performance regression checks
Track:
- frame time p50/p95/p99
- AI decision time p50/p95/p99
- nodes evaluated
- memory after warmup and growth/hour
- particle count
- event/log queue depth
- persistence latency/failure rate

## CI gates
For every merge:
1. format/lint
2. strict type check
3. unit tests
4. deterministic scenario tests
5. config/schema validation for all levels/presets
6. selected fast batch-simulation regression suite
7. browser smoke tests when UI exists

Nightly/release pipelines may run larger simulation and endurance suites.

## Test-data policy
Do not rely solely on random tests. Keep named adversarial fixtures plus seed corpora representing previously observed failures.

## Release standard
No known critical deterministic mismatch, illegal movement, public/private config leak, unrecoverable persistence bug, or unbounded long-run resource growth may be waived without an explicit documented release risk decision.
