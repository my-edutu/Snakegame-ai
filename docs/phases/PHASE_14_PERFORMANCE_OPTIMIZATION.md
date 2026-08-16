# Phase 14 — Performance and Long-Run Optimization

## Primary agents
- Performance Agent
- Rendering Agent
- Survival Intelligence Agent
- Release / Stream Reliability Agent

## Objective
Prove the game can run continuously for many hours or days without memory leaks, runaway queues, frame degradation, or AI decision stalls.

## Deliverables
- CPU/frame-time profiling report
- memory-growth report
- AI decision budget instrumentation
- event/listener leak checks
- particle/object pool audits
- React render audit
- long-session benchmark scripts
- performance budgets and regression thresholds

## Performance areas
### Simulation
- fixed tick remains stable independent of rendering FPS
- no pathological unbounded AI search
- board occupancy/collision checks use efficient structures
- batch mode scales without retaining complete game histories

### Rendering
- minimize per-frame allocation
- cap particles/trails
- pool transient graphics where beneficial
- avoid recreating textures/materials
- destroy subscriptions/resources on teardown

### React/UI
- no full-game-state rerender on every tick
- coarse selectors and throttled HUD updates
- debug logs virtualized/bounded

### Analytics/persistence
- bounded event buffers
- batch low-priority writes
- no ever-growing in-memory decision logs
- retention policies for verbose telemetry

## Tests
1. Run multi-hour browser endurance test.
2. Compare memory snapshots over time.
3. Run thousands of death/restart cycles.
4. Test large snake/high occupancy endgame.
5. Test Hyper Speed and maximum AI reasoning.
6. Profile 4K rendering preset.
7. Exercise stream + operator views simultaneously.
8. Verify teardown/recreation leaves no accumulating listeners.

## Suggested release budgets
Budgets should be measured and adjusted on target hardware, but the project must define explicit thresholds for:
- median and p95 frame time
- p95 AI decision time by profile
- memory growth/hour after warmup
- maximum particle count
- maximum event buffer size
- maximum persisted verbose telemetry

## Exit criteria
Measured long-duration tests show bounded memory/resource usage, stable simulation timing, acceptable rendering performance at target stream resolutions, and no known unbounded queues or listeners.
