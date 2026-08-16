# Technology Decisions

## Frontend
Use **Next.js + React + TypeScript** for the browser application. Next.js gives predictable routing for `/stream`, `/operator`, `/debug`, and future public pages while allowing the game packages to remain framework-independent.

## Renderer
Use **PixiJS** rather than DOM-heavy rendering. Reasons:
- excellent 2D GPU acceleration
- efficient sprites/graphics/particles
- predictable full-screen Canvas/WebGL behavior
- appropriate for 1080p, 1440p, and 4K stream layouts
- easier separation from deterministic simulation than a framework-centric game engine

Do not put authoritative gameplay physics into PixiJS.

## State
Authoritative game state lives inside the simulation runtime. Use **Zustand** only for browser/UI state such as operator panels, selected tabs, presentation preferences, and projections of engine snapshots.

## Validation
Use **Zod** for all external/configuration inputs: level files, presets, imported settings, persisted documents, and future remote data.

## Persistence
Start with **IndexedDB** behind repository interfaces. LocalStorage may hold tiny non-critical preferences only. All-time records and recovery checkpoints belong in IndexedDB. Design repositories so a future Supabase adapter can replace or supplement it.

## Randomness
Use one deterministic seeded PRNG implementation. Never use `Math.random()` in the engine, AI simulations, food placement, moving hazards, or controlled-failure decisions.

## Testing
- **Vitest**: unit tests and deterministic scenario tests
- **Playwright**: browser lifecycle, operator controls, fullscreen/stream routes
- custom simulation runner: thousands of headless games, distributions, strategy reports

## Audio
Use **Web Audio API** with pooled/reused nodes where possible. Audio must be optional, fatigue-safe, and cleanly suspend/resume.

## Worker strategy
Use **Web Workers** for batch/headless simulation from the browser. Do not introduce worker synchronization into the main game until profiling proves the AI decision budget requires it.

## Styling
Use CSS variables/design tokens and lightweight component primitives. Stream HUD typography and spacing must be resolution-aware, not tied to a single viewport.

## Build quality
Enable strict TypeScript, ESLint, formatter, type checking, test scripts, and CI from the beginning. Treat warnings about accidental `any`, floating promises, and mutation of readonly state as build-quality issues.

## Rejected approaches
- React state as the game loop: risks rerender coupling and timing instability.
- DOM grid with one element per tile: poor fit for large boards, effects, and 4K streaming.
- hard-coded level components: prevents scale to 50+ levels.
- server dependency for v1 gameplay: unnecessary failure mode for an always-on stream.
- opaque ML model for movement: difficult to debug, reproduce, and explain; deterministic hybrid search is preferred for v1.
