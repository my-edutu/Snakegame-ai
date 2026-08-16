# Phase 08 — Premium Rendering

## Primary agents
- Rendering Agent
- Performance Agent
- Livestream UX Agent

## Objective
Build a polished PixiJS presentation layer that remains visually satisfying and stable at livestream resolutions without becoming authoritative gameplay logic.

## Deliverables
- PixiJS renderer package
- scene/layer architecture
- board renderer
- smooth snake interpolation
- snake skins
- food/item effects
- obstacle/hazard visuals
- theme system
- particles and pooled transient effects
- death/level transition animations
- graphics quality presets

## Tasks
1. Create renderer adapter consuming immutable snapshots/events.
2. Implement fixed-tick interpolation for smooth movement.
3. Create premium snake body/head rendering with rounded or continuous presentation.
4. Add Emerald, Neon, Inferno, Galaxy, Gold, Rainbow, and Void skins.
5. Add pulsing/spawn/consume effects for food types.
6. Implement environment theme tokens and at least the initial theme family.
7. Add obstacle/hazard visual language that remains readable under compression.
8. Add capped particle pools and trail buffers.
9. Add level-start, level-complete, close-call, record, and death visual hooks.
10. Implement quality presets controlling particles, glow, trail, and expensive effects.

## Resolution validation
Verify layouts/rendering at:
- 1920×1080
- 2560×1440
- 3840×2160

## Performance constraints
- no React rerender per snake segment/tick
- bounded transient objects
- pooled effects where practical
- renderer destruction cleans textures/listeners/resources
- debug metrics expose FPS and frame time

## Exit criteria
The game presentation looks intentionally premium, movement is smooth, effects remain readable rather than cluttered, and multi-hour rendering tests show no unbounded resource growth.
