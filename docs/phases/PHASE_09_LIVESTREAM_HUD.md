# Phase 09 — Livestream HUD and Engagement UX

## Primary agents
- Livestream UX Agent
- Rendering Agent
- Survival Intelligence Agent

## Objective
Create the spectator interface that makes the autonomous run understandable, tense, and legible within seconds.

## Deliverables
- stream HUD layout
- risk meter
- strategy panel
- record target panel
- milestone/near-death banners
- run timer and run count
- occupancy/length/score views
- next milestone indicator
- run summary screen
- auto-restart countdown UI
- compression-safe responsive typography

## Always-visible hierarchy
- level number + name
- snake length
- board occupancy
- current strategy
- risk score/band
- run time
- next milestone or record target

## Secondary metrics
- score
- food eaten
- safe tiles
- projected moves
- current run
- best occupancy
- highest level
- deaths
- total games
- streak

## Engagement event rules
Implement restrained event treatment for:
- 25%, 50%, 75%, 90% occupancy
- new all-time record
- longest run
- major level thresholds
- critical survival
- one safe move remaining
- verified close call

Events require data-backed triggers and cooldown/deduplication.

## AI status copy
Public messages must be derived from actual AI evidence, e.g.:
- `SPACE PRESERVATION`
- `FOOD PATH REJECTED — trap risk 68%`
- `FOLLOWING TAIL — 3 escape routes preserved`
- `ENDGAME MODE ACTIVATED`

Never generate arbitrary dramatic copy disconnected from state.

## Viewer comprehension test
Show a frozen frame to a person unfamiliar with the product for five seconds. They should be able to identify:
1. what the snake is trying to do
2. how far it has progressed
3. whether it is in danger
4. what milestone/record matters next

## Exit criteria
The HUD is usable at 1080p/1440p/4K, remains readable after video compression, accurately reflects game/AI state, and communicates the run's tension without visual overload.
