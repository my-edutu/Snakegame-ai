# Autonomous AI Snake — Master Roadmap

## Mission
Build a production-grade autonomous Snake livestream system that can run continuously, reason about survival, progress through 20+ strategically distinct levels, produce understandable spectator tension, preserve records, recover from failures, and support future viewer integrations without coupling the core game to any streaming platform.

## Architectural principles
1. **Deterministic simulation first.** Game logic must be runnable without React, Canvas, audio, or OBS.
2. **Rendering is a projection of state.** The renderer never owns authoritative game state.
3. **AI is strategy-driven, not food-greedy.** Every candidate move is evaluated for future survivability.
4. **Configuration over hard-coding.** Levels, hazards, visuals, AI modifiers, milestones, and failure behavior are data-driven.
5. **Replayability.** Every run is reproducible from seed + configuration + event log.
6. **Long-run safety.** Memory, timers, subscriptions, particles, analytics queues, and persistence are bounded.
7. **Livestream clarity.** A new viewer must understand objective, progress, danger, and record target in ~5 seconds.
8. **No deceptive engagement.** Monetization readiness is limited to legitimate platform-supported interactions.

## Recommended stack
- TypeScript
- Next.js + React for operator and stream surfaces
- PixiJS for the high-performance 2D board renderer
- Zustand for UI/client state that is not authoritative simulation state
- Zod for configuration validation
- Vitest for unit and simulation tests
- Playwright for operator/stream end-to-end tests
- IndexedDB via a small repository abstraction for initial persistence
- Web Audio API for sound
- Web Workers for headless/high-speed simulation and optional AI decision isolation
- Seeded PRNG owned by the simulation core

## Target repository structure
```text
/apps
  /web                 # Next.js app: stream view, operator dashboard, debug views
/packages
  /engine              # deterministic snake simulation
  /ai                  # decision engine and strategies
  /levels              # level schemas + 20 initial definitions
  /failure             # controlled failure policy engine
  /analytics           # events, run metrics, aggregation
  /persistence         # repository interfaces + IndexedDB adapter
  /rendering           # PixiJS renderer, particles, skins, themes
  /streaming           # stream lifecycle, milestones, overlays, OBS behavior
  /audio               # sound engine
  /config               # schemas, defaults, presets, import/export
  /shared               # IDs, utilities, shared immutable types
/tests
  /scenarios           # dangerous-state AI fixtures
  /simulations         # high-volume headless runs
  /e2e                 # browser/OBS/operator tests
/docs
  /architecture
  /agents
  /phases
```

## Development sequence
| Phase | Focus | Exit criterion |
|---|---|---|
| 01 | Core deterministic engine | Snake can complete seeded games headlessly with correct collisions |
| 02 | Pathfinding | Safe BFS/A*/distance-map decisions work |
| 03 | Survival reasoning | Flood fill, tail-follow, trap detection, lookahead, hybrid strategy work |
| 04 | Simulation harness | Thousands of headless seeded runs produce reports |
| 05 | Level system | 20 config-driven levels load and validate |
| 06 | Failure engine | Natural and configured deviations are distinguishable and auditable |
| 07 | Progression + records | Runs, levels, records, summaries, milestones persist |
| 08 | Premium rendering | Smooth PixiJS board, snake, food, themes, effects |
| 09 | Livestream HUD | Spectator UI explains run state and tension instantly |
| 10 | Operator dashboard | All safe runtime controls and presets are available |
| 11 | Audio + effects | Fatigue-safe sound and event effects |
| 12 | OBS/fullscreen mode | Stable browser-source-ready presentation |
| 13 | Persistence + recovery | Reload/crash restoration preserves run/all-time state |
| 14 | Performance optimization | Long-duration CPU/memory budgets verified |
| 15 | Stress + release verification | Multi-hour tests, 10k+ simulations, no release blockers |

## Cross-cutting quality gates
Every phase must preserve:
- strict TypeScript
- deterministic state transitions
- no renderer-to-engine writes outside commands
- no `Math.random()` in simulation code
- schema-validated configuration
- bounded queues and caches
- structured event logging
- unit tests for new rules
- replay fixture for every discovered simulation bug
- no magic gameplay constants outside configuration

## Product success indicators
Engineering metrics:
- deterministic replay parity: 100%
- simulation core can run at >100x real-time when rendering is disabled on typical desktop hardware
- zero unbounded listener/event/particle growth
- stable multi-hour browser run
- no major console errors

Gameplay metrics to tune, not hard-code:
- Levels 1–5: high success
- Levels 6–10: moderate challenge
- Levels 11–15: significant challenge
- Levels 16–19: very difficult
- Level 20: extreme endgame

Spectator metrics:
- objective, progress, danger, and record target visible simultaneously
- meaningful milestones are rate-limited
- near-death alerts come from actual AI-state evidence
- AI strategy text reflects real selected strategy/reasoning

## Definition of done
The project is complete only when the autonomous snake, survival AI, 20+ strategic levels, records, stream lifecycle, operator controls, controlled failure system, premium rendering, OBS mode, persistence/recovery, headless simulations, deterministic replay, debug tools, and long-run stability all work together as one production system.
