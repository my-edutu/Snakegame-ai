# Phase 8 — Premium Rendering Design

## Status
Approved for implementation by the user's instruction to proceed with Phase 8 and standing instruction to choose the strongest technical option without additional clarification.

## Goal
Turn the verified deterministic Snake simulation into a premium, livestream-grade visual experience without allowing rendering, frame timing, browser state, or visual effects to influence authoritative game state.

## Selected architecture
Use a dedicated `@snake/renderer` package built on PixiJS v8.19.0 plus a minimal browser preview host. Simulation state flows one-way into immutable render frames. PixiJS owns frame interpolation and transient visuals; the engine/AI/simulation packages remain authoritative for gameplay.

### Alternatives considered

1. **Single monolithic browser game app** — fastest to prototype, but tightly couples game, UI, and rendering lifecycles and makes long-run resource testing harder.
2. **React-owned Pixi component tree** — pleasant component ergonomics, but risks React reconciliation becoming involved in high-frequency snake/particle updates.
3. **Renderer-first package + thin browser host — selected** — keeps high-frequency rendering entirely in PixiJS, lets React/DOM be added later for operator/HUD surfaces, and makes resource cleanup and resolution validation independently testable.

## Package boundary

### `@snake/renderer`
Responsibilities:
- convert immutable engine/simulation snapshots into presentation frames;
- interpolate fixed-tick snake movement against render time;
- maintain Pixi scene/layer objects;
- render snake, food, obstacles, hazards, portals, background, particles, and visual events;
- own presentation-only theme/skin/quality settings;
- expose renderer performance/resource metrics;
- guarantee full teardown of graphics, textures, pools, listeners, ticker hooks, and references.

Must not:
- call AI decision functions;
- advance engine simulation ticks;
- mutate `GameState` or progression records;
- use renderer FPS to alter gameplay;
- import Phase 6 private failure configuration;
- expose internal chain-of-thought style reasoning.

## Browser preview host
A lightweight `apps/render-preview` host will initialize a Pixi application, run a deterministic demo/session feed from existing public simulation APIs, and provide fixed viewport presets for 1920×1080, 2560×1440, and 3840×2160. It exists for development/visual verification, not as the final operator or livestream app.

The host may use minimal DOM controls for selecting viewport, skin, theme, and quality preset. High-frequency board updates remain inside the renderer package.

## Render-frame contract
Create a serializable presentation model rather than binding Pixi objects directly to engine state.

`RenderFrame` includes:
- tick and interpolation timestamp metadata;
- board geometry and active bounds;
- snake body/head direction;
- food/items with typed presentation metadata;
- obstacles, hazards, portals;
- level id/name/theme key;
- score/length/occupancy/risk/strategy summary;
- lifecycle state;
- spectator-safe events such as milestone, near-death, level-complete, record, and death;
- monotonically increasing event ids for dedupe.

Frame creation is pure and independently tested. Pixi-specific objects never appear in this contract.

## Interpolation
Authoritative simulation remains fixed-tick. Renderer stores previous/current presentation frames and computes `alpha` in `[0,1]` from elapsed presentation time and configured tick duration.

Rules:
- interpolate body segment positions only when segment identity/order is compatible;
- head turns follow shortest visual path without overshoot;
- teleport/portal transitions are explicit discontinuities with a portal effect, not linearly interpolated across the board;
- death, restart, and level transition states suspend normal movement interpolation;
- interpolation never changes logical collision or food-consumption timing.

## Scene/layer architecture
Stable z-order:
1. environment/background;
2. board grid/decorations;
3. static obstacles;
4. dynamic hazards/portals;
5. food/items;
6. snake trail;
7. snake body/head;
8. particles/transient effects;
9. board-local event effects;
10. debug/performance overlay when explicitly enabled.

Each layer has explicit construction/update/destroy ownership.

## Snake rendering
Seven required skins:
- Emerald
- Neon
- Inferno
- Galaxy
- Gold
- Rainbow
- Void

Presentation uses a continuous/rounded body style rather than raw square blocks. Each segment is rendered from pooled/reused graphics or sprites; no per-frame allocation per segment.

Head presentation supports:
- directional emphasis;
- subtle eye/energy detail where appropriate;
- distinct head silhouette at livestream compression sizes.

Skin tokens define body gradient/stops, outline/glow intensity, head accent, trail characteristics, and particle accent. Skins are data-driven.

## Theme system
Theme tokens are independent from level mechanics and include:
- board/background colors;
- grid strength;
- obstacle/hazard/portal palettes;
- ambient particle parameters;
- bloom/glow budgets;
- vignette/background decoration values.

Initial production theme family:
- Neon Grid
- Digital Forest
- Volcano
- Arctic
- Cyber City
- Desert
- Deep Ocean
- Space
- Matrix
- Ancient Temple
- Cosmic Void

Levels map declaratively to a theme key. Theme changes never modify gameplay.

## Food/items
Food presentation derives from existing item type/value metadata.

Effects:
- spawn scale/fade;
- pulsing core/glow;
- bounded ambient particles;
- consumption burst;
- value popup hook for the later HUD layer.

Rare/epic/bonus/speed/multiplier/mystery foods are visually distinguishable without making normal food unreadable.

## Obstacles, hazards, and portals
Visual language must communicate mechanics immediately under livestream compression:
- obstacles: solid, high-contrast, inert shape language;
- hazards: animated warning edge/pulse distinct from solid walls;
- portals: paired color/id treatment plus swirl/ring animation;
- active/shrinking bounds: visible boundary energy line and safe-area contrast.

No effect may obscure collision boundaries.

## Transient-effect system
Use bounded object pools for:
- food bursts;
- snake trail particles;
- portal bursts;
- death particles;
- milestone/record emphasis;
- level transition effects.

Every pool has a hard capacity. Exhaustion drops/reuses low-priority effects rather than allocating without bound.

No normal rendering path may append indefinitely to an array or display container.

## Quality presets
Three initial presets:

### Performance
- minimal particles;
- no expensive blur/bloom stacks;
- short trail;
- reduced ambient decoration.

### Balanced
- moderate particles;
- restrained glow/filter use;
- normal trail and environment animation.

### Cinematic
- higher but still capped particles;
- richer glow/ambient effects;
- longer trail;
- stronger transition presentation.

Preset changes affect presentation only and are safe during a running simulation.

## Spectator event hooks
Phase 8 consumes existing Phase 7 spectator-safe event types and exposes visual hooks for:
- CLOSE CALL / critical survival;
- occupancy milestones;
- NEW RECORD;
- LEVEL COMPLETE;
- RUN ENDED / death classification;
- countdown/restart;
- strategy change emphasis where useful.

The renderer may show short human-readable labels, but it must never display raw private failure settings or internal reasoning traces.

## Performance instrumentation
Expose presentation metrics:
- FPS;
- average frame time;
- peak frame time over bounded window;
- active display object count;
- particle pool occupancy;
- snake drawable count;
- transient effect count;
- renderer/resource generation id.

Metrics use bounded rolling windows only.

## Resolution strategy
Reference coordinate system is 1920×1080 with aspect-preserving scale. Board viewport layout is tested at:
- 1920×1080;
- 2560×1440;
- 3840×2160.

Renderer uses device resolution carefully and caps excessive device-pixel-ratio in preview/stream presets to protect GPU load. 16:9 remains primary Phase 8 target.

## Resource lifecycle
Renderer exposes explicit `init`, `resize`, `renderFrame`, `setTheme`, `setSkin`, `setQuality`, and `destroy` APIs.

`destroy` must:
- stop/remove ticker callbacks;
- remove event listeners;
- destroy generated textures/render textures owned by the package;
- clear pools/buffers;
- destroy Pixi containers/graphics owned by the package;
- release references to frames/state;
- permit a new renderer instance to initialize cleanly afterward.

## Error handling
- invalid frame geometry: reject before touching scene state;
- unknown theme/skin: fall back to explicit safe defaults and record a renderer warning;
- WebGPU unavailable: allow PixiJS renderer negotiation/fallback;
- context loss/init failure: surface typed renderer error to host rather than altering gameplay;
- effect-pool exhaustion: degrade gracefully by skipping/reusing visual effects;
- resize to zero/non-finite dimensions: ignore/reject safely.

## Testing strategy

### Pure unit tests
- render-frame projection and immutability;
- interpolation including turns and portal discontinuities;
- skin/theme registries;
- quality preset validation;
- event dedupe;
- resource-pool hard bounds;
- viewport math for 1080p/1440p/4K;
- metrics rolling-window bounds.

### Pixi integration tests
- layer construction/z-order;
- drawable reuse instead of per-frame reallocation;
- theme/skin switches;
- destroy idempotence/resource release;
- repeated init/destroy cycles;
- long snake drawable counts remain bounded by current frame data.

### Browser visual verification
- preview renders at all three target resolutions;
- screenshots/visual inspection fixtures for each skin/theme family;
- text/board contrast under compression-oriented sizing;
- effects do not hide collision boundaries.

### Soak/performance tests
- deterministic synthetic feed for thousands of renderer updates;
- bounded active object and particle counts;
- repeated death/restart/level-transition cycles;
- no unbounded listener/container/pool growth;
- renderer destroy/recreate cycles.

CI will use structural/resource budgets rather than fragile absolute GPU FPS thresholds on hosted runners. Real browser performance evidence remains a release artifact/checklist item.

## CI/release gates
Phase 8 release requires:
- all Phase 1–7 tests remain green;
- renderer typecheck/tests/build green;
- frozen dependency lock;
- PixiJS package boundary contains no gameplay authority;
- resource-bound tests green;
- deterministic simulation outputs unchanged;
- preview host builds;
- target-resolution viewport tests green;
- repeated renderer lifecycle/soak tests green;
- PR exact-head full CI green;
- squash merge with expected-head protection;
- post-merge `main` CI green.

## Scope boundary
Phase 8 does **not** implement the full spectator HUD layout (Phase 9), operator dashboard (Phase 10), audio (Phase 11), or OBS/fullscreen stream lifecycle (Phase 12). It provides the premium PixiJS visual foundation and event hooks those phases consume.
