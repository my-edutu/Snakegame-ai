# Phase 11 — Audio and Event Effects

## Primary agents
- Audio Agent
- Livestream UX Agent
- Performance Agent

## Objective
Add subtle, fatigue-safe audio that improves milestone, danger, food, level, death, and record moments without becoming exhausting during multi-hour streams.

## Deliverables
- Web Audio service
- event-to-sound mapping
- master/effect/music controls
- pooled/reused audio resources
- cooldown/rate limits
- stream-safe default mix
- mute/suspend/resume behavior

## Event sounds
- normal food
- rare/special food
- milestone
- close call / danger
- level complete
- new record
- death
- run restart/countdown accent where appropriate

## Rules
- no copyrighted packaged music
- repeated food sounds vary subtly and remain quiet
- high-frequency events use cooldowns or aggregation
- danger cues are informative, not constant alarm noise
- audio never affects simulation timing
- muted audio should avoid unnecessary processing

## Tests
- event mapping correctness
- master mute
- per-category volume
- browser suspend/resume recovery
- repeated event rate limits
- teardown releases resources

## Exit criteria
Audio adds polish and tension, remains comfortable over long sessions, can be fully muted, and has no effect on deterministic gameplay.
