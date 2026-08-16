# Rendering and Livestream Architecture

## Rendering approach
Use PixiJS as a read-only visual projection of simulation snapshots and domain events.

### Scene layers
1. environment background
2. static board grid/geometry
3. obstacles and portals
4. food/items
5. hazards
6. snake body/head/trail
7. particles and event effects
8. debug overlays
9. stream HUD
10. transient milestone banners

## Interpolation
The engine advances in fixed ticks. The renderer interpolates position/orientation between the previous and current authoritative snapshots. Visual interpolation must never feed positions back into collision logic.

## Snake rendering
Support a continuous or rounded segmented body with configurable skins:
- Emerald
- Neon
- Inferno
- Galaxy
- Gold
- Rainbow
- Void

Skin definitions should specify shader/tint/gradient/trail parameters without altering gameplay.

## Theme system
Themes provide rendering-only tokens for board, obstacles, particles, food, ambience, and HUD accents. Initial theme family:
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

## Effect budgets
Particles, trails, event banners, and animations have hard caps. Quality presets control density and post-processing. Long-run stability is more important than unconstrained visual effects.

## Stream routes
### `/stream`
Public spectator view. No private failure settings or destructive controls. Designed for OBS browser source and full-screen capture.

### `/operator`
Private local operator dashboard. Controls gameplay, AI, failure, stream, audio, visuals, presets, and recovery.

### `/debug`
Diagnostic view showing paths, flood fills, candidate scoring, performance, deterministic identifiers, and event logs.

## Spectator HUD information hierarchy
Always visible:
- level and level name
- snake length
- board occupancy
- run time
- risk
- current strategy
- current record target / next milestone

Secondary:
- score
- food eaten
- run number
- safe tiles
- projected moves
- current streak
- all-time records

## Event UX
Milestones are meaningful and rate-limited. Examples:
- 25%, 50%, 75%, 90% occupancy
- new record
- level 10/15/20 reached
- longest run
- one safe move remaining
- critical survival

Near-death banners require actual evidence from the decision/risk engine.

## OBS requirements
- responsive at 1920×1080, 2560×1440, 3840×2160
- transparent-background option where feasible
- no accidental pointer controls in stream mode
- stable URL parameters/preset loading
- auto restart and auto progression
- recovery after reload
- readable typography under video compression

## Branding
A public branding projection may contain title, subtitle/tagline, logo, creator name, handle, watermark, and sponsor skin/theme references. Keep branding configuration independent from engine state.

## Performance targets
The renderer should minimize per-frame object allocation, pool transient effects, avoid React updates per simulation tick, and expose FPS/frame-time diagnostics. The HUD should subscribe to coarse-grained selectors rather than the full game object.
